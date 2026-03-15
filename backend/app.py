import os
import uuid
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from engines.itinerary_engine import generate_itinerary
from engines.crowd_engine import (
    get_all_destinations_basic,
    get_crowd_all,
    get_crowd_single,
    get_ai_crowd_advice,
)
from engines.heritage_engine import get_all_heritage_sites, get_heritage_site, get_ai_heritage_story
from engines.database import save_session, save_itinerary, log_analytics, get_analytics_summary

app = Flask(__name__)
CORS(app)

# Rate limiter — enforces per-IP limits
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)


# --- AI-powered endpoints (rate-limited to 10 RPM as required) ---

@app.route('/api/itinerary', methods=['POST'])
@limiter.limit("10 per minute")
def itinerary():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    required_fields = ['duration_days', 'interests', 'fitness_level', 'budget']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    user_profile = {
        'duration_days': int(data['duration_days']),
        'interests': data['interests'],
        'fitness_level': int(data['fitness_level']),
        'budget': data['budget'],
        'age_group': data.get('age_group', 'adult'),
        'travel_month': data.get('travel_month', 'Oct'),
        'group_type': data.get('group_type', 'solo'),
    }

    session_id = data.get('session_id', str(uuid.uuid4()))

    try:
        save_session(session_id, user_profile)
        log_analytics('itinerary_generated', {
            'interests': user_profile['interests'],
            'duration': user_profile['duration_days'],
            'budget': user_profile['budget'],
            'month': user_profile['travel_month'],
        })
    except Exception as e:
        print(f"[DB] Warning: {e}")

    result = generate_itinerary(user_profile)
    result['session_id'] = session_id

    try:
        save_itinerary(session_id, user_profile, result, ai_enhanced=result.get('ai_enhanced', False))
    except Exception as e:
        print(f"[DB] Warning: {e}")

    return jsonify(result)


@app.route('/api/destinations', methods=['GET'])
@limiter.limit("30 per minute")
def all_destinations():
    return jsonify(get_all_destinations_basic())


@app.route('/api/crowd/all', methods=['GET'])
@limiter.limit("30 per minute")
def crowd_all():
    month = request.args.get('month', '10')
    try:
        month_num = int(month)
        if month_num < 1 or month_num > 12:
            month_num = 10
    except ValueError:
        month_num = 10

    log_analytics('crowd_map_viewed', {'month': month_num})
    return jsonify(get_crowd_all(month_num))


@app.route('/api/crowd/<dest_id>', methods=['GET'])
@limiter.limit("20 per minute")
def crowd_single(dest_id):
    month = request.args.get('month', '10')
    try:
        month_num = int(month)
        if month_num < 1 or month_num > 12:
            month_num = 10
    except ValueError:
        month_num = 10

    result = get_crowd_single(dest_id, month_num)
    if result is None:
        return jsonify({'error': 'Destination not found'}), 404

    # Add AI advice
    ai_advice = get_ai_crowd_advice(dest_id, month_num)
    if ai_advice:
        result['ai_advice'] = ai_advice

    log_analytics('crowd_detail_viewed', {'destination': dest_id, 'month': month_num})
    return jsonify(result)


@app.route('/api/heritage', methods=['GET'])
@limiter.limit("30 per minute")
def heritage_list():
    return jsonify(get_all_heritage_sites())


@app.route('/api/heritage/<site_id>', methods=['GET'])
@limiter.limit("10 per minute")
def heritage_detail(site_id):
    site = get_heritage_site(site_id)
    if site is None:
        return jsonify({'error': 'Heritage site not found'}), 404

    # Add AI-generated narrative
    interests = request.args.get('interests', '')
    user_interests = [i.strip() for i in interests.split(',') if i.strip()] if interests else None
    ai_story = get_ai_heritage_story(site_id, user_interests)
    if ai_story:
        site = {**site, 'ai_story': ai_story}

    log_analytics('heritage_viewed', {'site': site_id})
    return jsonify(site)


@app.route('/api/analytics', methods=['GET'])
@limiter.limit("5 per minute")
def analytics():
    return jsonify(get_analytics_summary())


@app.route('/api/health', methods=['GET'])
def health():
    has_key = bool(os.getenv('AZURE_OPENAI_API_KEY', ''))
    return jsonify({
        'status': 'ok',
        'service': 'NepalQuest API',
        'ai_enabled': has_key,
    })


# Error handlers for rate limiting
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded. Please slow down.',
        'retry_after': e.description,
    }), 429


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("NepalQuest API Server")
    print(f"AI Enabled: {bool(os.getenv('AZURE_OPENAI_API_KEY', ''))}")
    print("Running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
