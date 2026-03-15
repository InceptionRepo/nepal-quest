import os
import time
import threading
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

_client = None
_lock = threading.Lock()
_request_times = []
MAX_RPM = 9  # stay under 10 RPM limit


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv('AZURE_OPENAI_API_KEY', '')
        endpoint = os.getenv('AZURE_OPENAI_ENDPOINT', '')
        api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2024-12-01-preview')
        if api_key and endpoint:
            _client = AzureOpenAI(
                api_key=api_key,
                azure_endpoint=endpoint,
                api_version=api_version,
            )
    return _client


def _rate_limit_check():
    now = time.time()
    with _lock:
        _request_times[:] = [t for t in _request_times if now - t < 60]
        if len(_request_times) >= MAX_RPM:
            return False
        _request_times.append(now)
        return True


def ai_generate(system_prompt, user_prompt, max_tokens=1024, temperature=0.7):
    client = get_client()
    if client is None:
        return None

    if not _rate_limit_check():
        return None

    model = os.getenv('AZURE_OPENAI_MODEL', 'gpt-5.4')

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_completion_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[AI] Error calling Azure OpenAI: {e}")
        return None
