from flask import Flask, request, jsonify
from flask_cors import CORS
from engines.itinerary_engine import generate_itinerary
from engines.crowd_engine import (
    get_all_destinations_basic,
    get_crowd_all,
    get_crowd_single,
)
from engines.heritage_engine import get_all_heritage_sites, get_heritage_site

app = Flask(__name__)
CORS(app)


@app.route("/api/itinerary", methods=["POST"])
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

    result = generate_itinerary(user_profile)
    return jsonify(result)


@app.route("/api/destinations", methods=["GET"])
def all_destinations():
    return jsonify(get_all_destinations_basic())


@app.route("/api/crowd/all", methods=["GET"])
def crowd_all():
    month = request.args.get("month", "10")
    try:
        month_num = int(month)
        if month_num < 1 or month_num > 12:
            month_num = 10
    except ValueError:
        month_num = 10

    return jsonify(get_crowd_all(month_num))


@app.route("/api/crowd/<dest_id>", methods=["GET"])
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

    return jsonify(result)


@app.route("/api/heritage", methods=["GET"])
def heritage_list():
    return jsonify(get_all_heritage_sites())


@app.route("/api/heritage/<site_id>", methods=["GET"])
def heritage_detail(site_id):
    site = get_heritage_site(site_id)
    if site is None:
        return jsonify({"error": "Heritage site not found"}), 404
    return jsonify(site)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "NepalQuest API"})


if __name__ == "__main__":
    print("=" * 50)
    print("NepalQuest API Server")
    print("Running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
