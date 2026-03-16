"""
Authentication engine for NepalQuest
- User registration and login
- JWT token generation and verification
- Role-based access control (user, guide)
"""

import os
import jwt
import time
import sqlite3
from functools import wraps
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask import request, jsonify, g

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "nepalquest.db")
JWT_SECRET = os.getenv("JWT_SECRET", "nepalquest-secret-key-change-in-production")
JWT_EXPIRY_HOURS = 24 * 7  # 7 days


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================
# USER OPERATIONS
# ============================================


def register_user(
    email,
    password,
    name,
    role="user",
    phone=None,
    nationality=None,
    bio=None,
    experience_years=None,
    languages=None,
    specialties=None,
    hourly_rate_npr=None,
):
    """
    Register a new user/guide.
    Returns: (success: bool, message: str, user_data: dict or None)
    """
    if role not in ("user", "guide", "admin"):
        return False, "Invalid role. Must be 'user' or 'guide'", None

    if not email or not password or not name:
        return False, "Email, password, and name are required", None

    if len(password) < 6:
        return False, "Password must be at least 6 characters", None

    conn = get_db()
    cursor = conn.cursor()

    # Check if email already exists
    existing = cursor.execute(
        "SELECT id FROM users WHERE email = ?", (email.lower(),)
    ).fetchone()
    if existing:
        conn.close()
        return False, "Email already registered", None

    # Hash password and insert
    password_hash = generate_password_hash(password)

    try:
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, name, role, phone, nationality, bio,
                              experience_years, languages, specialties, hourly_rate_npr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                email.lower(),
                password_hash,
                name,
                role,
                phone,
                nationality,
                bio,
                experience_years,
                languages,
                specialties,
                hourly_rate_npr,
            ),
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        user_data = {
            "id": user_id,
            "email": email.lower(),
            "name": name,
            "role": role,
            "phone": phone,
            "nationality": nationality,
            "bio": bio,
            "experience_years": experience_years,
            "languages": languages,
            "specialties": specialties,
            "hourly_rate_npr": hourly_rate_npr,
        }
        return True, "Registration successful", user_data
    except Exception as e:
        conn.close()
        return False, f"Registration failed: {str(e)}", None


def login_user(email, password):
    """
    Authenticate user and return JWT token.
    Returns: (success: bool, message: str, token: str or None, user_data: dict or None)
    """
    if not email or not password:
        return False, "Email and password are required", None, None

    conn = get_db()
    cursor = conn.cursor()

    user = cursor.execute(
        """
        SELECT id, email, password_hash, name, role, phone, nationality, bio,
               experience_years, languages, specialties, hourly_rate_npr, is_verified, created_at
        FROM users WHERE email = ? AND is_active = 1
    """,
        (email.lower(),),
    ).fetchone()
    conn.close()

    if not user:
        return False, "Invalid email or password", None, None

    if not check_password_hash(user["password_hash"], password):
        return False, "Invalid email or password", None, None

    # Generate JWT token
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + (JWT_EXPIRY_HOURS * 3600),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user["phone"],
        "nationality": user["nationality"],
        "bio": user["bio"],
        "experience_years": user["experience_years"],
        "languages": user["languages"],
        "specialties": user["specialties"],
        "hourly_rate_npr": user["hourly_rate_npr"],
        "is_verified": user["is_verified"],
    }

    return True, "Login successful", token, user_data


def verify_token(token):
    """
    Verify JWT token and return user data.
    Returns: (valid: bool, user_data: dict or None, error: str or None)
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        # Check expiry
        if payload.get("exp", 0) < time.time():
            return False, None, "Token expired"

        # Fetch fresh user data from DB
        conn = get_db()
        user = conn.execute(
            """
            SELECT id, email, name, role, phone, nationality, bio,
                   experience_years, languages, specialties, hourly_rate_npr, is_verified
            FROM users WHERE id = ? AND is_active = 1
        """,
            (payload["user_id"],),
        ).fetchone()
        conn.close()

        if not user:
            return False, None, "User not found"

        user_data = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "phone": user["phone"],
            "nationality": user["nationality"],
            "bio": user["bio"],
            "experience_years": user["experience_years"],
            "languages": user["languages"],
            "specialties": user["specialties"],
            "hourly_rate_npr": user["hourly_rate_npr"],
            "is_verified": user["is_verified"],
        }
        return True, user_data, None

    except jwt.ExpiredSignatureError:
        return False, None, "Token expired"
    except jwt.InvalidTokenError:
        return False, None, "Invalid token"


def get_user_by_id(user_id):
    """Get user by ID."""
    conn = get_db()
    user = conn.execute(
        """
        SELECT id, email, name, role, phone, nationality, bio,
               experience_years, languages, specialties, hourly_rate_npr, is_verified, created_at
        FROM users WHERE id = ? AND is_active = 1
    """,
        (user_id,),
    ).fetchone()
    conn.close()

    if not user:
        return None

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user["phone"],
        "nationality": user["nationality"],
        "bio": user["bio"],
        "experience_years": user["experience_years"],
        "languages": user["languages"],
        "specialties": user["specialties"],
        "hourly_rate_npr": user["hourly_rate_npr"],
        "is_verified": user["is_verified"],
    }


def get_all_guides():
    """Get all users with role='guide'."""
    conn = get_db()
    guides = conn.execute("""
        SELECT id, name, email, phone, nationality, bio,
               experience_years, languages, specialties, hourly_rate_npr, is_verified, created_at
        FROM users WHERE role = 'guide' AND is_active = 1
        ORDER BY is_verified DESC, experience_years DESC, name
    """).fetchall()
    conn.close()

    return [
        {
            "id": g["id"],
            "name": g["name"],
            "email": g["email"],
            "phone": g["phone"],
            "nationality": g["nationality"],
            "bio": g["bio"],
            "experience_years": g["experience_years"],
            "languages": g["languages"],
            "specialties": g["specialties"],
            "hourly_rate_npr": g["hourly_rate_npr"],
            "is_verified": g["is_verified"],
        }
        for g in guides
    ]


# ============================================
# GUIDE REQUEST OPERATIONS
# ============================================


def create_guide_request(
    user_id,
    guide_id,
    message,
    start_date,
    end_date,
    trip_title=None,
    destination_ids=None,
    group_size=1,
    budget_range=None,
    special_requirements=None,
):
    """
    User sends a request to a guide.
    Returns: (success: bool, message: str, request_data: dict or None)
    """
    conn = get_db()
    cursor = conn.cursor()

    # Verify user exists
    user = cursor.execute(
        "SELECT id, role FROM users WHERE id = ? AND is_active = 1", (user_id,)
    ).fetchone()
    if not user:
        conn.close()
        return False, "User not found", None

    # Verify guide exists and is a guide (if specific guide requested)
    guide_name = "any available guide"
    if guide_id:
        guide = cursor.execute(
            "SELECT id, role, name FROM users WHERE id = ? AND role = 'guide' AND is_active = 1",
            (guide_id,),
        ).fetchone()
        if not guide:
            conn.close()
            return False, "Guide not found", None
        guide_name = guide["name"]

        # Check for existing pending request to this specific guide
        existing = cursor.execute(
            """
            SELECT id FROM guide_requests
            WHERE user_id = ? AND guide_id = ? AND status = 'pending'
        """,
            (user_id, guide_id),
        ).fetchone()
        if existing:
            conn.close()
            return False, "You already have a pending request to this guide", None

    try:
        cursor.execute(
            """
            INSERT INTO guide_requests (user_id, guide_id, trip_title, destination_ids, start_date, end_date,
                                       group_size, message, budget_range, special_requirements, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """,
            (
                user_id,
                guide_id,
                trip_title,
                destination_ids,
                start_date,
                end_date,
                group_size,
                message,
                budget_range,
                special_requirements,
            ),
        )
        conn.commit()
        request_id = cursor.lastrowid
        conn.close()

        return (
            True,
            f"Request sent to {guide_name}",
            {"id": request_id, "status": "pending"},
        )
    except Exception as e:
        conn.close()
        return False, f"Failed to send request: {str(e)}", None


def get_guide_requests(guide_id, status=None):
    """
    Get all requests sent to a guide.
    Optionally filter by status (pending, accepted, rejected, completed, cancelled).
    """
    conn = get_db()

    query = """
        SELECT gr.id, gr.user_id, gr.guide_id, gr.trip_title, gr.destination_ids,
               gr.start_date, gr.end_date, gr.group_size, gr.message, gr.budget_range,
               gr.special_requirements, gr.status, gr.guide_response, gr.created_at,
               u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM guide_requests gr
        JOIN users u ON gr.user_id = u.id
        WHERE (gr.guide_id = ? OR gr.guide_id IS NULL)
    """
    params = [guide_id]

    if status:
        query += " AND gr.status = ?"
        params.append(status)

    query += " ORDER BY gr.created_at DESC"

    requests = conn.execute(query, params).fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "guide_id": r["guide_id"],
            "user_name": r["user_name"],
            "user_email": r["user_email"],
            "user_phone": r["user_phone"],
            "trip_title": r["trip_title"],
            "destination_ids": r["destination_ids"],
            "start_date": r["start_date"],
            "end_date": r["end_date"],
            "group_size": r["group_size"],
            "message": r["message"],
            "budget_range": r["budget_range"],
            "special_requirements": r["special_requirements"],
            "status": r["status"],
            "guide_response": r["guide_response"],
            "created_at": r["created_at"],
        }
        for r in requests
    ]


def get_user_requests(user_id):
    """Get all requests sent by a user."""
    conn = get_db()

    requests = conn.execute(
        """
        SELECT gr.id, gr.guide_id, gr.trip_title, gr.destination_ids, gr.start_date,
               gr.end_date, gr.group_size, gr.message, gr.budget_range, gr.special_requirements,
               gr.status, gr.guide_response, gr.created_at,
               u.name as guide_name, u.email as guide_email, u.phone as guide_phone
        FROM guide_requests gr
        LEFT JOIN users u ON gr.guide_id = u.id
        WHERE gr.user_id = ?
        ORDER BY gr.created_at DESC
    """,
        (user_id,),
    ).fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "guide_id": r["guide_id"],
            "guide_name": r["guide_name"],
            "guide_email": r["guide_email"],
            "guide_phone": r["guide_phone"],
            "trip_title": r["trip_title"],
            "destination_ids": r["destination_ids"],
            "start_date": r["start_date"],
            "end_date": r["end_date"],
            "group_size": r["group_size"],
            "message": r["message"],
            "budget_range": r["budget_range"],
            "special_requirements": r["special_requirements"],
            "status": r["status"],
            "guide_response": r["guide_response"],
            "created_at": r["created_at"],
        }
        for r in requests
    ]


def update_guide_request(request_id, guide_id, new_status, guide_response=None):
    """
    Guide accepts or rejects a request.
    new_status must be 'accepted', 'rejected', 'completed', or 'cancelled'.
    """
    if new_status not in ("accepted", "rejected", "completed", "cancelled"):
        return False, "Invalid status"

    conn = get_db()
    cursor = conn.cursor()

    # Verify the request belongs to this guide
    req = cursor.execute(
        """
        SELECT id, guide_id, status FROM guide_requests WHERE id = ?
    """,
        (request_id,),
    ).fetchone()

    if not req:
        conn.close()
        return False, "Request not found"

    # If this is an open request (guide_id is NULL), allow a guide to claim it by accepting.
    if req["guide_id"] is None:
        if new_status != "accepted":
            conn.close()
            return False, "Only accepting is supported for open requests"

        cursor.execute(
            """
            UPDATE guide_requests
            SET guide_id = ?, status = ?, guide_response = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND guide_id IS NULL AND status = 'pending'
            """,
            (guide_id, new_status, guide_response, request_id),
        )
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        if updated == 0:
            return False, "Request is no longer available"
        return True, "Request accepted"

    if req["guide_id"] != guide_id:
        conn.close()
        return False, "You can only update your own requests"

    cursor.execute(
        """
        UPDATE guide_requests SET status = ?, guide_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    """,
        (new_status, guide_response, request_id),
    )
    conn.commit()
    conn.close()

    return True, f"Request {new_status}"


# ============================================
# GUIDE REQUEST MESSAGING
# ============================================


def get_guide_request_minimal(request_id):
    """Fetch minimal guide request fields for access control."""
    conn = get_db()
    row = conn.execute(
        """
        SELECT id, user_id, guide_id, status
        FROM guide_requests
        WHERE id = ?
        """,
        (request_id,),
    ).fetchone()
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "guide_id": row["guide_id"],
        "status": row["status"],
    }


def get_guide_request_messages(request_id, limit=100):
    """Return messages for a guide request in chronological order."""
    conn = get_db()
    rows = conn.execute(
        """
        SELECT m.id, m.request_id, m.sender_user_id, m.body, m.created_at,
               u.name AS sender_name, u.role AS sender_role
        FROM guide_request_messages m
        JOIN users u ON u.id = m.sender_user_id
        WHERE m.request_id = ?
        ORDER BY m.created_at ASC, m.id ASC
        LIMIT ?
        """,
        (request_id, int(limit)),
    ).fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "request_id": r["request_id"],
            "sender_user_id": r["sender_user_id"],
            "sender_name": r["sender_name"],
            "sender_role": r["sender_role"],
            "body": r["body"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


def create_guide_request_message(request_id, sender_user_id, body):
    """Create a new message for the guide request."""
    text = (body or "").strip()
    if not text:
        return False, "Message cannot be empty", None
    if len(text) > 2000:
        return False, "Message is too long (max 2000 characters)", None

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO guide_request_messages (request_id, sender_user_id, body)
            VALUES (?, ?, ?)
            """,
            (request_id, sender_user_id, text),
        )
        conn.commit()
        message_id = cursor.lastrowid

        row = conn.execute(
            """
            SELECT m.id, m.request_id, m.sender_user_id, m.body, m.created_at,
                   u.name AS sender_name, u.role AS sender_role
            FROM guide_request_messages m
            JOIN users u ON u.id = m.sender_user_id
            WHERE m.id = ?
            """,
            (message_id,),
        ).fetchone()
        conn.close()

        return (
            True,
            "Message sent",
            {
                "id": row["id"],
                "request_id": row["request_id"],
                "sender_user_id": row["sender_user_id"],
                "sender_name": row["sender_name"],
                "sender_role": row["sender_role"],
                "body": row["body"],
                "created_at": row["created_at"],
            },
        )
    except Exception as e:
        conn.close()
        return False, f"Failed to send message: {str(e)}", None


# ============================================
# FLASK DECORATORS
# ============================================


def login_required(f):
    """
    Decorator to require authentication.
    Sets g.current_user with the authenticated user's data.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        token = None
        if auth_header:
            # Expect "Bearer <token>"
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({"error": "Invalid authorization header format"}), 401
            token = parts[1]

        # Fallback: read JWT from HttpOnly cookie
        if not token:
            token = request.cookies.get("nepalquest_token")

        if not token:
            return jsonify({"error": "Authentication required"}), 401

        valid, user_data, error = verify_token(token)

        if not valid:
            return jsonify({"error": error or "Invalid token"}), 401

        g.current_user = user_data
        return f(*args, **kwargs)

    return decorated


def role_required(role):
    """
    Decorator to require a specific role.
    Must be used after @login_required.
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return jsonify({"error": "Authentication required"}), 401

            if g.current_user.get("role") != role:
                return jsonify({"error": f"This endpoint requires '{role}' role"}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator
