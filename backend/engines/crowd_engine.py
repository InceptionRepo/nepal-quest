import json
import os
import numpy as np
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

TYPE_ENCODING = {
    "trekking": 0,
    "adventure": 1,
    "heritage": 2,
    "wildlife": 3,
    "spiritual": 4,
    "nature": 5,
}
REGION_ENCODING = {
    "Khumbu": 0,
    "Gandaki": 1,
    "Bagmati": 2,
    "Narayani": 3,
    "Rupandehi": 4,
    "Karnali": 5,
    "Mustang": 6,
    "Tanahun": 7,
    "Mechi": 8,
}


def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


destinations = load_json("destinations.json")
destinations_by_id = {d["id"]: d for d in destinations}

ml_model = None
model_path = os.path.join(MODELS_DIR, "crowd_model.pkl")
if os.path.exists(model_path):
    ml_model = joblib.load(model_path)


def get_crowd_label(score):
    if score <= 3:
        return "Quiet", "#22c55e"
    elif score <= 6:
        return "Moderate", "#f59e0b"
    elif score <= 8:
        return "Busy", "#f97316"
    else:
        return "Very Crowded", "#ef4444"


def get_all_destinations_basic():
    result = []
    for d in destinations:
        result.append(
            {
                "id": d["id"],
                "name": d["name"],
                "lat": d["lat"],
                "lng": d["lng"],
                "type": d["type"],
                "hidden_gem": d["hidden_gem"],
            }
        )
    return result


def predict_crowd_score(dest, month_num):
    global ml_model

    month_name = MONTH_NAMES[month_num - 1]
    actual_score = dest["crowd_score"].get(month_name, 5)

    if ml_model is not None:
        try:
            features = np.array(
                [
                    [
                        month_num,
                        TYPE_ENCODING.get(dest["type"], 0),
                        REGION_ENCODING.get(dest["region"], 0),
                        dest["altitude_m"],
                        1 if dest["hidden_gem"] else 0,
                    ]
                ]
            )
            predicted = ml_model.predict(features)[0]
            blended = 0.6 * actual_score + 0.4 * predicted
            return round(min(max(blended, 1), 10), 1)
        except Exception:
            return actual_score

    return actual_score


def get_crowd_all(month_num):
    results = []
    for dest in destinations:
        score = predict_crowd_score(dest, month_num)
        label, color = get_crowd_label(score)
        results.append(
            {
                "id": dest["id"],
                "name": dest["name"],
                "lat": dest["lat"],
                "lng": dest["lng"],
                "type": dest["type"],
                "hidden_gem": dest["hidden_gem"],
                "crowd_score": score,
                "crowd_label": label,
                "color": color,
            }
        )
    return results


def get_crowd_single(dest_id, month_num):
    dest = destinations_by_id.get(dest_id)
    if dest is None:
        return None

    score = predict_crowd_score(dest, month_num)
    label, color = get_crowd_label(score)

    monthly_trend = []
    for i, month_name in enumerate(MONTH_NAMES):
        m_score = predict_crowd_score(dest, i + 1)
        monthly_trend.append({"month": month_name, "score": m_score})

    if score <= 3:
        recommendation = f"{dest['name']} is peaceful and uncrowded this month — perfect for a quiet visit."
    elif score <= 6:
        recommendation = f"{dest['name']} has moderate crowds this month. A good balance of atmosphere and comfort."
    elif score <= 8:
        recommendation = f"{dest['name']} is quite busy this month. Book accommodations in advance and expect queues."
    else:
        recommendation = f"{dest['name']} is very crowded this month — peak tourist season. Consider visiting in a quieter month for a better experience."

    return {
        "id": dest["id"],
        "name": dest["name"],
        "crowd_score": score,
        "crowd_label": label,
        "color": color,
        "recommendation": recommendation,
        "monthly_trend": monthly_trend,
    }
