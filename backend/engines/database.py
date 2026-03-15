import sqlite3
import os
import json
import time

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'nepalquest.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            profile_json TEXT NOT NULL,
            created_at REAL NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_itineraries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            profile_json TEXT NOT NULL,
            itinerary_json TEXT NOT NULL,
            ai_enhanced INTEGER DEFAULT 0,
            created_at REAL NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key TEXT UNIQUE NOT NULL,
            response_text TEXT NOT NULL,
            created_at REAL NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            event_data TEXT,
            created_at REAL NOT NULL
        )
    ''')

    conn.commit()
    conn.close()
    print("[DB] Database initialized at", DB_PATH)


def save_session(session_id, profile):
    conn = get_connection()
    conn.execute(
        'INSERT INTO user_sessions (session_id, profile_json, created_at) VALUES (?, ?, ?)',
        (session_id, json.dumps(profile), time.time())
    )
    conn.commit()
    conn.close()


def save_itinerary(session_id, profile, itinerary, ai_enhanced=False):
    conn = get_connection()
    conn.execute(
        'INSERT INTO saved_itineraries (session_id, profile_json, itinerary_json, ai_enhanced, created_at) VALUES (?, ?, ?, ?, ?)',
        (session_id, json.dumps(profile), json.dumps(itinerary), 1 if ai_enhanced else 0, time.time())
    )
    conn.commit()
    conn.close()


def get_cached_ai_response(cache_key):
    conn = get_connection()
    row = conn.execute(
        'SELECT response_text, created_at FROM ai_cache WHERE cache_key = ?', (cache_key,)
    ).fetchone()
    conn.close()
    if row:
        age = time.time() - row['created_at']
        if age < 3600:
            return row['response_text']
    return None


def set_cached_ai_response(cache_key, response_text):
    conn = get_connection()
    conn.execute(
        'INSERT OR REPLACE INTO ai_cache (cache_key, response_text, created_at) VALUES (?, ?, ?)',
        (cache_key, response_text, time.time())
    )
    conn.commit()
    conn.close()


def log_analytics(event_type, event_data=None):
    conn = get_connection()
    conn.execute(
        'INSERT INTO analytics (event_type, event_data, created_at) VALUES (?, ?, ?)',
        (event_type, json.dumps(event_data) if event_data else None, time.time())
    )
    conn.commit()
    conn.close()


def get_analytics_summary():
    conn = get_connection()
    total_sessions = conn.execute('SELECT COUNT(*) FROM user_sessions').fetchone()[0]
    total_itineraries = conn.execute('SELECT COUNT(*) FROM saved_itineraries').fetchone()[0]
    ai_itineraries = conn.execute('SELECT COUNT(*) FROM saved_itineraries WHERE ai_enhanced = 1').fetchone()[0]
    cached_responses = conn.execute('SELECT COUNT(*) FROM ai_cache').fetchone()[0]

    popular_events = conn.execute(
        'SELECT event_type, COUNT(*) as cnt FROM analytics GROUP BY event_type ORDER BY cnt DESC LIMIT 10'
    ).fetchall()

    conn.close()
    return {
        'total_sessions': total_sessions,
        'total_itineraries': total_itineraries,
        'ai_enhanced_itineraries': ai_itineraries,
        'cached_ai_responses': cached_responses,
        'top_events': [{'type': r['event_type'], 'count': r['cnt']} for r in popular_events],
    }


# Initialize on import
init_db()
