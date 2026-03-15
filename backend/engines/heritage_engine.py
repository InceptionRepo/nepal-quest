import json
import os
import hashlib
from engines.ai_client import ai_generate
from engines.database import get_cached_ai_response, set_cached_ai_response

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


heritage_sites = load_json('heritage_sites.json')
heritage_by_id = {site['id']: site for site in heritage_sites}


def get_all_heritage_sites():
    result = []
    for site in heritage_sites:
        result.append({
            'id': site['id'],
            'name': site['name'],
            'lat': site['lat'],
            'lng': site['lng'],
            'type': site['type'],
            'unesco': site['unesco'],
        })
    return result


def get_heritage_site(site_id):
    return heritage_by_id.get(site_id, None)


def get_ai_heritage_story(site_id, user_interests=None):
    """Use GPT to generate a dynamic, personalized cultural narrative."""
    site = heritage_by_id.get(site_id)
    if site is None:
        return None

    interests_str = ', '.join(user_interests) if user_interests else 'general travel'
    cache_key = hashlib.md5(f"heritage:{site_id}:{interests_str}".encode()).hexdigest()

    cached = get_cached_ai_response(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            return {'ai_narrative': cached}

    system_prompt = """You are a deeply knowledgeable Nepal cultural guide and storyteller.
Generate a personalized cultural narrative for a heritage site visitor.
Respond in JSON: {"ai_narrative": "3-4 sentence immersive story tailored to their interests", "hidden_insight": "one specific thing most guides won't tell you", "best_photo_spot": "exact location for the best photo"}
Be vivid, specific, and authentic."""

    user_prompt = f"""Site: {site['name']} ({site['type']}) in {site['location']}
UNESCO: {'Yes' if site['unesco'] else 'No'}
Visitor interests: {interests_str}
Existing story context: {site['story'][:200]}...

Generate a personalized cultural narrative that connects to their interests."""

    ai_response = ai_generate(system_prompt, user_prompt, max_tokens=350, temperature=0.7)

    if ai_response:
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            ai_data = json.loads(cleaned)
            set_cached_ai_response(cache_key, json.dumps(ai_data))
            return ai_data
        except (json.JSONDecodeError, KeyError):
            result = {'ai_narrative': ai_response}
            set_cached_ai_response(cache_key, json.dumps(result))
            return result

    return None
