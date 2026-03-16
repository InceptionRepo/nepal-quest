import os
import uuid
from flask import Flask, request, jsonify, g
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
from engines.heritage_engine import (
    get_all_heritage_sites,
    get_heritage_site,
    get_ai_heritage_story,
)
from engines.database import (
    save_session,
    save_itinerary,
    log_analytics,
    get_analytics_summary,
)
from engines.auth import (
    register_user,
    login_user,
    verify_token,
    get_all_guides,
    create_guide_request,
    get_guide_requests,
    get_user_requests,
    update_guide_request,
    get_guide_request_minimal,
    get_guide_request_messages,
    create_guide_request_message,
    login_required,
)

app = Flask(__name__)

# Allow cookies for auth when frontend is on a different origin (e.g. localhost:3000)
CORS(
    app,
    resources={
        r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
    },
    supports_credentials=True,
)


AUTH_COOKIE_NAME = "nepalquest_token"


def _set_auth_cookie(response, token: str):
    # In local dev we typically run over http://, so Secure must be False.
    response.set_cookie(
        AUTH_COOKIE_NAME,
        token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response


def _clear_auth_cookie(response):
    response.set_cookie(
        AUTH_COOKIE_NAME,
        "",
        httponly=True,
        secure=False,
        samesite="Lax",
        expires=0,
        max_age=0,
        path="/",
    )
    return response


def _get_authenticated_user():
    """Best-effort auth check for endpoints that optionally include AI insights."""
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if not token:
        token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        return None

    valid, user_data, _ = verify_token(token)
    return user_data if valid else None


# Rate limiter — enforces per-IP limits
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)


# --- AI-powered endpoints (rate-limited to 10 RPM as required) ---


@app.route("/api/itinerary", methods=["POST"])
@login_required
@limiter.limit("10 per minute")
def itinerary():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    required_fields = ["duration_days", "interests", "fitness_level", "budget"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    user_profile = {
        "duration_days": int(data["duration_days"]),
        "interests": data["interests"],
        "fitness_level": int(data["fitness_level"]),
        "budget": data["budget"],
        "age_group": data.get("age_group", "adult"),
        "travel_month": data.get("travel_month", "Oct"),
        "group_type": data.get("group_type", "solo"),
    }

    session_id = data.get("session_id", str(uuid.uuid4()))

    try:
        save_session(session_id, user_profile)
        log_analytics(
            "itinerary_generated",
            {
                "interests": user_profile["interests"],
                "duration": user_profile["duration_days"],
                "budget": user_profile["budget"],
                "month": user_profile["travel_month"],
            },
        )
    except Exception as e:
        print(f"[DB] Warning: {e}")

    result = generate_itinerary(user_profile)
    result["session_id"] = session_id

    try:
        save_itinerary(
            session_id,
            user_profile,
            result,
            ai_enhanced=result.get("ai_enhanced", False),
        )
    except Exception as e:
        print(f"[DB] Warning: {e}")

    return jsonify(result)


@app.route("/api/destinations", methods=["GET"])
@limiter.limit("30 per minute")
def all_destinations():
    return jsonify(get_all_destinations_basic())


@app.route("/api/crowd/all", methods=["GET"])
@limiter.limit("30 per minute")
def crowd_all():
    month = request.args.get("month", "10")
    try:
        month_num = int(month)
        if month_num < 1 or month_num > 12:
            month_num = 10
    except ValueError:
        month_num = 10

    log_analytics("crowd_map_viewed", {"month": month_num})
    return jsonify(get_crowd_all(month_num))


@app.route("/api/crowd/<dest_id>", methods=["GET"])
@limiter.limit("20 per minute")
def crowd_single(dest_id):
    month = request.args.get("month", "10")
    try:
        month_num = int(month)
        if month_num < 1 or month_num > 12:
            month_num = 10
    except ValueError:
        month_num = 10

    result = get_crowd_single(dest_id, month_num)
    if result is None:
        return jsonify({"error": "Destination not found"}), 404

    # Add AI advice only for authenticated users
    if _get_authenticated_user():
        ai_advice = get_ai_crowd_advice(dest_id, month_num)
        if ai_advice:
            result["ai_advice"] = ai_advice

    log_analytics("crowd_detail_viewed", {"destination": dest_id, "month": month_num})
    return jsonify(result)


@app.route("/api/heritage", methods=["GET"])
@limiter.limit("30 per minute")
def heritage_list():
    return jsonify(get_all_heritage_sites())


@app.route("/api/heritage/<site_id>", methods=["GET"])
@limiter.limit("10 per minute")
def heritage_detail(site_id):
    site = get_heritage_site(site_id)
    if site is None:
        return jsonify({"error": "Heritage site not found"}), 404

    # Add AI-generated narrative only for authenticated users
    if _get_authenticated_user():
        interests = request.args.get("interests", "")
        user_interests = (
            [i.strip() for i in interests.split(",") if i.strip()]
            if interests
            else None
        )
        ai_story = get_ai_heritage_story(site_id, user_interests)
        if ai_story:
            site = {**site, "ai_story": ai_story}

    log_analytics("heritage_viewed", {"site": site_id})
    return jsonify(site)


@app.route("/api/analytics", methods=["GET"])
@limiter.limit("5 per minute")
def analytics():
    return jsonify(get_analytics_summary())


@app.route("/api/leads", methods=["POST"])
@limiter.limit("10 per minute")
def create_lead():
    """Simple endpoint to log 'lead_created' events for guide/agency marketplace demos."""
    data = request.get_json() or {}
    # We don't enforce a strict schema here; anything sent from the frontend
    # is stored as event_data for analytics / demo purposes.
    try:
        log_analytics("lead_created", data)
    except Exception as e:
        print(f"[Analytics] Failed to log lead: {e}")
        return jsonify({"status": "error", "message": "Failed to record lead"}), 500

    return jsonify({"status": "ok"})


# ============================================
# AUTHENTICATION ROUTES
# ============================================


@app.route("/api/auth/register", methods=["POST"])
@limiter.limit("5 per minute")
def auth_register():
    """Register a new user or guide."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    success, message, user_data = register_user(
        email=data.get("email"),
        password=data.get("password"),
        name=data.get("name"),
        role=data.get("role", "user"),
        phone=data.get("phone"),
        nationality=data.get("nationality"),
        bio=data.get("bio"),
        experience_years=data.get("experience_years"),
        languages=data.get("languages"),
        specialties=data.get("specialties"),
        hourly_rate_npr=data.get("hourly_rate_npr"),
    )

    if not success:
        return jsonify({"error": message}), 400

    # Auto-login after registration
    success, _, token, user_data = login_user(data.get("email"), data.get("password"))

    log_analytics("user_registered", {"role": data.get("role", "user")})
    resp = jsonify({"message": message, "token": token, "user": user_data})
    _set_auth_cookie(resp, token)
    return resp, 201


@app.route("/api/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def auth_login():
    """Login with email and password."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    success, message, token, user_data = login_user(
        email=data.get("email"), password=data.get("password")
    )

    if not success:
        return jsonify({"error": message}), 401

    log_analytics("user_login", {"user_id": user_data["id"], "role": user_data["role"]})
    resp = jsonify({"message": message, "token": token, "user": user_data})
    _set_auth_cookie(resp, token)
    return resp


@app.route("/api/auth/logout", methods=["POST"])
@limiter.limit("30 per minute")
def auth_logout():
    """Clear the auth cookie (logout)."""
    resp = jsonify({"message": "Logged out"})
    _clear_auth_cookie(resp)
    return resp


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """Get current user's profile."""
    user = _get_authenticated_user()
    return jsonify({"user": user})


@app.route("/api/auth/me", methods=["PUT"])
@login_required
def auth_update_me():
    """Update current user's profile."""
    from engines.auth import get_db

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Build dynamic update query
    allowed_fields = [
        "name",
        "phone",
        "nationality",
        "bio",
        "experience_years",
        "languages",
        "specialties",
        "hourly_rate_npr",
    ]
    updates = []
    values = []

    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            values.append(data[field])

    if not updates:
        conn.close()
        return jsonify({"error": "No valid fields to update"}), 400

    updates.append("updated_at = CURRENT_TIMESTAMP")
    values.append(g.current_user["id"])

    query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

    # Fetch and return updated user
    from engines.auth import get_user_by_id

    updated_user = get_user_by_id(g.current_user["id"])
    return jsonify({"message": "Profile updated", "user": updated_user})


# ============================================
# GUIDE ROUTES
# ============================================


@app.route("/api/guides", methods=["GET"])
@limiter.limit("30 per minute")
def list_guides():
    """List guides, optionally prioritized for specific destinations/regions.

    Query params (all optional):
      - destinations: comma-separated destination IDs (e.g. "KTM,PKR")
      - region: a free-text region/city hint (e.g. "Pokhara", "Kathmandu")

    For now this is a best-effort text match against each guide's bio,
    specialties, and nationality so that guides mentioning the requested
    areas appear first.
    """
    from engines.itinerary_engine import destinations_by_id

    destination_param = request.args.get("destinations", "").strip()
    region_param = request.args.get("region", "").strip()

    guides = get_all_guides()

    # No filters supplied: return all guides as before
    if not destination_param and not region_param:
        return jsonify({"guides": guides})

    # Build a set of place/region tokens to look for in guide profiles
    match_tokens = set()

    if destination_param:
        for raw_id in destination_param.split(","):
            dest_id = raw_id.strip()
            if not dest_id:
                continue
            dest = destinations_by_id.get(dest_id)
            if dest:
                # Use both the destination name (e.g. "Pokhara") and region
                if dest.get("name"):
                    match_tokens.add(dest["name"])
                if dest.get("region"):
                    match_tokens.add(dest["region"])

    if region_param:
        match_tokens.add(region_param)

    # Nothing to match against, just return all guides
    if not match_tokens:
        return jsonify({"guides": guides})

    def guide_score(g):
        text = " ".join(
            [
                (g.get("bio") or ""),
                (g.get("specialties") or ""),
                (g.get("nationality") or ""),
            ]
        ).lower()
        score = 0
        for token in match_tokens:
            t = token.lower()
            if t and t in text:
                score += 1
        return score

    # Score and sort guides so location‑relevant ones appear first
    scored = [(g, guide_score(g)) for g in guides]
    scored.sort(key=lambda x: x[1], reverse=True)

    # If at least one guide matches, hide pure non-matches so the
    # user doesn't see irrelevant regions first.
    if scored and scored[0][1] > 0:
        filtered_guides = [g for g, s in scored if s > 0]
    else:
        filtered_guides = [g for g, _ in scored]

    return jsonify({"guides": filtered_guides})


@app.route("/api/guides/<int:guide_id>", methods=["GET"])
@limiter.limit("30 per minute")
def get_guide(guide_id):
    """Get a specific guide's public profile."""
    from engines.auth import get_user_by_id

    guide = get_user_by_id(guide_id)

    if not guide or guide.get("role") != "guide":
        return jsonify({"error": "Guide not found"}), 404

    # Remove sensitive info for public view
    public_guide = {k: v for k, v in guide.items() if k not in ["email"]}
    return jsonify({"guide": public_guide})


# ============================================
# GUIDE REQUEST ROUTES
# ============================================


@app.route("/api/guide-requests", methods=["POST"])
@login_required
@limiter.limit("10 per minute")
def create_request():
    """User creates a request for a guide."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    if not data.get("start_date") or not data.get("end_date"):
        return jsonify({"error": "start_date and end_date are required"}), 400

    success, message, request_data = create_guide_request(
        user_id=g.current_user["id"],
        guide_id=data.get("guide_id"),
        message=data.get("message"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        trip_title=data.get("trip_title"),
        destination_ids=data.get("destination_ids"),
        group_size=data.get("group_size", 1),
        budget_range=data.get("budget_range"),
        special_requirements=data.get("special_requirements"),
    )

    if not success:
        return jsonify({"error": message}), 400

    log_analytics("guide_request_created", {"guide_id": data.get("guide_id")})
    return jsonify({"message": message, "request": request_data}), 201


@app.route("/api/guide-requests", methods=["GET"])
@login_required
def get_requests():
    """Get guide requests - users see their requests, guides see requests for them."""
    if g.current_user["role"] == "guide":
        requests = get_guide_requests(g.current_user["id"])
    else:
        requests = get_user_requests(g.current_user["id"])

    return jsonify({"requests": requests})


@app.route("/api/guide-requests/<int:request_id>", methods=["PUT"])
@login_required
def update_request(request_id):
    """Guide accepts/rejects a request."""
    if g.current_user["role"] != "guide":
        return jsonify({"error": "Only guides can update request status"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "status is required"}), 400

    success, message = update_guide_request(
        request_id=request_id,
        guide_id=g.current_user["id"],
        new_status=new_status,
        guide_response=data.get("guide_response"),
    )

    if not success:
        return jsonify({"error": message}), 400

    log_analytics(
        "guide_request_updated", {"request_id": request_id, "status": new_status}
    )
    return jsonify({"message": message})


@app.route("/api/guide-requests/<int:request_id>/messages", methods=["GET"])
@login_required
@limiter.limit("60 per minute")
def list_request_messages(request_id):
    req = get_guide_request_minimal(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    # Only allow chat after acceptance (or completion) and with an assigned guide.
    if req["status"] not in ("accepted", "completed") or not req.get("guide_id"):
        return jsonify(
            {"error": "Chat is available after a guide accepts the request"}
        ), 400

    user_id = g.current_user["id"]
    role = g.current_user.get("role")

    if role == "admin":
        pass
    elif role == "guide":
        if req.get("guide_id") != user_id:
            return jsonify({"error": "Not authorized"}), 403
    else:
        if req.get("user_id") != user_id:
            return jsonify({"error": "Not authorized"}), 403

    messages = get_guide_request_messages(request_id)
    return jsonify({"messages": messages})


@app.route("/api/guide-requests/<int:request_id>/messages", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_request_message(request_id):
    req = get_guide_request_minimal(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    # Only allow chat after acceptance (or completion) and with an assigned guide.
    if req["status"] not in ("accepted", "completed") or not req.get("guide_id"):
        return jsonify(
            {"error": "Chat is available after a guide accepts the request"}
        ), 400

    user_id = g.current_user["id"]
    role = g.current_user.get("role")

    if role == "admin":
        pass
    elif role == "guide":
        if req.get("guide_id") != user_id:
            return jsonify({"error": "Not authorized"}), 403
    else:
        if req.get("user_id") != user_id:
            return jsonify({"error": "Not authorized"}), 403

    data = request.get_json() or {}
    body = data.get("body")

    success, message, msg = create_guide_request_message(
        request_id=request_id,
        sender_user_id=user_id,
        body=body,
    )

    if not success:
        return jsonify({"error": message}), 400

    return jsonify({"message": message, "data": msg}), 201


@app.route("/api/health", methods=["GET"])
def health():
    has_key = bool(os.getenv("AZURE_OPENAI_API_KEY", ""))
    return jsonify(
        {
            "status": "ok",
            "service": "NepalQuest API",
            "ai_enabled": has_key,
            "details": {
                "itinerary_engine": "rule-based scoring + RandomForest classifier",
                "crowd_engine": "RandomForest regressor + handcrafted priors",
                "heritage_engine": "GPT narrative layer (optional, depends on API key)",
            },
        }
    )


# Error handlers for rate limiting
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(
        {
            "error": "Rate limit exceeded. Please slow down.",
            "retry_after": e.description,
        }
    ), 429


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("NepalQuest API Server")
    print(f"AI Enabled: {bool(os.getenv('AZURE_OPENAI_API_KEY', ''))}")
    print("Running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
