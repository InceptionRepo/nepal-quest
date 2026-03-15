import json
import os
import hashlib
import numpy as np
import joblib
from engines.ai_client import ai_generate
from engines.database import get_cached_ai_response, set_cached_ai_response

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

ALL_INTERESTS = ['heritage', 'trekking', 'wildlife', 'spiritual', 'relaxation', 'food', 'hidden_gems', 'adventure']
BUDGET_MAP = {'low': 0, 'medium': 1, 'high': 2}
AGE_GROUP_MAP = {'youth': 0, 'adult': 1, 'senior': 2, 'family': 3}
DIFFICULTY_MAP = {'Easy': 1, 'Moderate': 2, 'Hard': 3}


def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


destinations = load_json('destinations.json')
itineraries = load_json('itineraries.json')
user_profiles = load_json('user_profiles.json')

destinations_by_id = {d['id']: d for d in destinations}


def get_interest_description(dest, user_interests):
    """Return the best matching interest-specific description for a destination."""
    interest_descs = dest.get('interest_descriptions', {})
    if not interest_descs:
        return dest.get('description', '')
    # Find first matching interest
    for interest in user_interests:
        if interest in interest_descs:
            return interest_descs[interest]
    # Fallback to generic
    return dest.get('description', '')

ml_model = None
model_path = os.path.join(MODELS_DIR, 'itinerary_model.pkl')
if os.path.exists(model_path):
    ml_model = joblib.load(model_path)


def compute_interest_score(user_interests, dest_tags):
    if not user_interests or not dest_tags:
        return 0.0
    overlap = len(set(user_interests) & set(dest_tags))
    max_possible = max(len(user_interests), 1)
    return min((overlap / max_possible) * 5, 5.0)


def compute_fitness_score(user_fitness, dest_difficulty):
    dest_level = DIFFICULTY_MAP.get(dest_difficulty, 1)
    if dest_level > user_fitness:
        return 0.0
    return 5.0


def compute_budget_score(user_budget, avg_cost_usd):
    budget_val = BUDGET_MAP.get(user_budget, 1)
    if budget_val == 0:
        if avg_cost_usd <= 150: return 5.0
        elif avg_cost_usd <= 300: return 3.0
        elif avg_cost_usd <= 600: return 1.0
        else: return 0.0
    elif budget_val == 1:
        if avg_cost_usd <= 300: return 5.0
        elif avg_cost_usd <= 900: return 3.5
        else: return 1.5
    else:
        return 5.0


def compute_season_score(travel_month, best_months):
    if travel_month in best_months:
        return 5.0
    return 1.0


def score_destination(dest, user_profile):
    interest_score = compute_interest_score(user_profile['interests'], dest['tags'])
    fitness_score = compute_fitness_score(user_profile['fitness_level'], dest['difficulty'])
    budget_score = compute_budget_score(user_profile['budget'], dest['avg_cost_usd'])
    season_score = compute_season_score(user_profile.get('travel_month', ''), dest['best_months'])

    composite = (
        0.35 * interest_score +
        0.25 * fitness_score +
        0.20 * budget_score +
        0.20 * season_score
    )

    if 'hidden_gems' in user_profile['interests'] and dest.get('hidden_gem', False):
        composite += 2.0

    return composite


def select_destinations(user_profile):
    scored = []
    for dest in destinations:
        score = score_destination(dest, user_profile)
        scored.append((dest, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    selected = []
    total_days = 0
    duration = user_profile['duration_days']

    for dest, score in scored:
        if total_days + dest['min_days'] <= duration:
            selected.append(dest)
            total_days += dest['min_days']
        if total_days >= duration:
            break

    if not selected and scored:
        selected.append(scored[0][0])

    return selected


def match_itinerary_template(selected_dests, user_profile):
    dest_ids = set(d['id'] for d in selected_dests)
    user_interests = set(user_profile['interests'])
    user_budget = user_profile['budget']
    user_duration = user_profile['duration_days']

    best_template = None
    best_score = -1

    for template in itineraries:
        score = 0
        template_dest_ids = set(template['destinations'])
        dest_overlap = len(dest_ids & template_dest_ids)
        score += dest_overlap * 3

        interest_overlap = len(user_interests & set(template['interest_tags']))
        score += interest_overlap * 2

        if template['budget_range'] == user_budget:
            score += 2

        duration_diff = abs(template['duration_days'] - user_duration)
        if duration_diff == 0:
            score += 3
        elif duration_diff <= 2:
            score += 1

        if score > best_score:
            best_score = score
            best_template = template

    return best_template


def build_itinerary_from_template(template, selected_dests, user_profile):
    if template is None:
        return build_fallback_itinerary(selected_dests, user_profile)

    daily_plan = template['daily_plan']
    user_duration = user_profile['duration_days']
    adjusted_plan = daily_plan[:user_duration]

    total_cost = sum(day['cost_usd'] for day in adjusted_plan)
    dest_names = [d['id'] for d in selected_dests]

    return {
        'itinerary': adjusted_plan,
        'destinations_used': dest_names,
        'total_cost_usd': total_cost,
        'template_title': template['title'],
        'highlights': template['highlights'],
    }


def build_fallback_itinerary(selected_dests, user_profile):
    daily_plan = []
    day_num = 1
    user_interests = user_profile.get('interests', [])

    for dest in selected_dests:
        # Pick the best interest-specific description
        desc = get_interest_description(dest, user_interests)
        for d in range(dest['min_days']):
            if day_num > user_profile['duration_days']:
                break
            daily_plan.append({
                'day': day_num,
                'title': f"Exploring {dest['name']} — Day {d + 1}",
                'morning': f"Morning exploration of {dest['name']}. {desc[:150]}",
                'afternoon': f"Afternoon activities in {dest['name']}. Discover hidden corners and interact with locals.",
                'evening': f"Evening in {dest['name']}. Enjoy local cuisine and reflect on the day's adventures.",
                'cost_usd': max(30, dest['avg_cost_usd'] // dest['min_days']),
                'transport': 'Local transport',
            })
            day_num += 1

    total_cost = sum(day['cost_usd'] for day in daily_plan)
    dest_names = [d['id'] for d in selected_dests]

    return {
        'itinerary': daily_plan,
        'destinations_used': dest_names,
        'total_cost_usd': total_cost,
        'template_title': 'Custom Nepal Itinerary',
        'highlights': [f"Visit {d['name']}" for d in selected_dests],
    }


def encode_user_profile(profile):
    features = []
    features.append(profile['duration_days'])
    features.append(profile['fitness_level'])
    features.append(BUDGET_MAP.get(profile['budget'], 1))
    features.append(AGE_GROUP_MAP.get(profile.get('age_group', 'adult'), 1))

    interest_vec = [0] * len(ALL_INTERESTS)
    for interest in profile.get('interests', []):
        if interest in ALL_INTERESTS:
            interest_vec[ALL_INTERESTS.index(interest)] = 1
    features.extend(interest_vec)

    return features


def get_ml_confidence(user_profile, selected_dest_ids):
    global ml_model
    if ml_model is None:
        return 0.75

    try:
        features = np.array([encode_user_profile(user_profile)])
        probas = ml_model.predict_proba(features)[0]
        classes = ml_model.classes_

        confidence = 0.0
        for dest_id in selected_dest_ids:
            if dest_id in classes:
                idx = list(classes).index(dest_id)
                confidence += probas[idx]

        confidence = min(confidence, 1.0)
        confidence = max(confidence, 0.5)
        return round(confidence, 2)
    except Exception:
        return 0.75


def ai_enhance_itinerary(result, user_profile):
    """Use GPT to generate richer, personalized day descriptions."""
    dest_names = [destinations_by_id[d]['name'] for d in result['destinations_used'] if d in destinations_by_id]
    interests = ', '.join(user_profile['interests'])
    month = user_profile.get('travel_month', 'October')
    budget = user_profile['budget']
    age = user_profile.get('age_group', 'adult')
    days = len(result['itinerary'])

    cache_key = hashlib.md5(f"itin:{','.join(result['destinations_used'])}:{interests}:{month}:{budget}:{days}".encode()).hexdigest()
    cached = get_cached_ai_response(cache_key)
    if cached:
        try:
            ai_data = json.loads(cached)
            result['ai_summary'] = ai_data.get('summary', '')
            result['ai_tips'] = ai_data.get('tips', [])
            result['ai_enhanced'] = True
            return result
        except (json.JSONDecodeError, KeyError):
            pass

    system_prompt = """You are an expert Nepal travel advisor. Generate a personalized travel summary and insider tips.
Respond in JSON format only: {"summary": "2-3 sentence personalized overview", "tips": ["tip1", "tip2", "tip3"]}
Keep tips specific to the destinations and traveler type. Be warm and enthusiastic."""

    user_prompt = f"""Traveler profile:
- Destinations: {', '.join(dest_names)}
- Duration: {days} days in {month}
- Interests: {interests}
- Budget: {budget}
- Traveler type: {age}

Generate a personalized trip summary and 3 insider tips for this Nepal itinerary."""

    ai_response = ai_generate(system_prompt, user_prompt, max_tokens=400, temperature=0.7)

    if ai_response:
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            ai_data = json.loads(cleaned)
            result['ai_summary'] = ai_data.get('summary', '')
            result['ai_tips'] = ai_data.get('tips', [])
            result['ai_enhanced'] = True
            set_cached_ai_response(cache_key, json.dumps(ai_data))
        except (json.JSONDecodeError, KeyError):
            result['ai_summary'] = ai_response
            result['ai_tips'] = []
            result['ai_enhanced'] = True
    else:
        result['ai_enhanced'] = False

    return result


def generate_itinerary(user_profile):
    selected_dests = select_destinations(user_profile)
    template = match_itinerary_template(selected_dests, user_profile)
    result = build_itinerary_from_template(template, selected_dests, user_profile)

    dest_ids = result['destinations_used']
    confidence = get_ml_confidence(user_profile, dest_ids)
    result['confidence_score'] = confidence

    # Add interest-specific destination descriptions
    user_interests = user_profile.get('interests', [])
    dest_details = []
    for d in selected_dests:
        dest_details.append({
            'id': d['id'],
            'name': d['name'],
            'description': get_interest_description(d, user_interests),
            'type': d['type'],
            'difficulty': d['difficulty'],
            'region': d['region'],
        })
    result['destination_details'] = dest_details

    result = ai_enhance_itinerary(result, user_profile)

    return result
