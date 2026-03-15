import json
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

ALL_INTERESTS = [
    "heritage",
    "trekking",
    "wildlife",
    "spiritual",
    "relaxation",
    "food",
    "hidden_gems",
    "adventure",
]
BUDGET_MAP = {"low": 0, "medium": 1, "high": 2}
AGE_GROUP_MAP = {"youth": 0, "adult": 1, "senior": 2, "family": 3}
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


def train_itinerary_model():
    print("=" * 50)
    print("Training Itinerary Recommendation Model")
    print("=" * 50)

    profiles = load_json("user_profiles.json")

    features = []
    targets = []

    for profile in profiles:
        feature_vec = []
        feature_vec.append(profile["duration_days"])
        feature_vec.append(profile["fitness_level"])
        feature_vec.append(BUDGET_MAP.get(profile["budget"], 1))
        feature_vec.append(AGE_GROUP_MAP.get(profile.get("age_group", "adult"), 1))

        interest_vec = [0] * len(ALL_INTERESTS)
        for interest in profile.get("interests", []):
            if interest in ALL_INTERESTS:
                interest_vec[ALL_INTERESTS.index(interest)] = 1
        feature_vec.extend(interest_vec)

        features.append(feature_vec)
        targets.append(profile["recommended_destinations"][0])

    X = np.array(features)
    y = np.array(targets)

    feature_names = ["duration_days", "fitness_level", "budget", "age_group"] + [
        f"interest_{i}" for i in ALL_INTERESTS
    ]

    print(f"Training samples: {len(X)}")
    print(f"Features per sample: {len(X[0])}")
    print(f"Unique destination targets: {len(set(y))}")
    print(f"Feature names: {feature_names}")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
    )
    model.fit(X, y)

    train_accuracy = model.score(X, y)
    print(f"Training accuracy: {train_accuracy:.2%}")

    importances = model.feature_importances_
    print("\nFeature importances:")
    for name, imp in sorted(
        zip(feature_names, importances), key=lambda x: x[1], reverse=True
    ):
        print(f"  {name}: {imp:.4f}")

    model_path = os.path.join(MODELS_DIR, "itinerary_model.pkl")
    joblib.dump(model, model_path)
    print(f"\nModel saved to: {model_path}")
    print()


def train_crowd_model():
    print("=" * 50)
    print("Training Crowd Prediction Model")
    print("=" * 50)

    destinations = load_json("destinations.json")

    features = []
    targets = []

    for dest in destinations:
        type_encoded = TYPE_ENCODING.get(dest["type"], 0)
        region_encoded = REGION_ENCODING.get(dest["region"], 0)
        altitude = dest["altitude_m"]
        is_hidden = 1 if dest["hidden_gem"] else 0

        for month_idx, month_name in enumerate(MONTH_NAMES):
            month_num = month_idx + 1
            crowd_score = dest["crowd_score"][month_name]

            features.append(
                [month_num, type_encoded, region_encoded, altitude, is_hidden]
            )
            targets.append(crowd_score)

    X = np.array(features)
    y = np.array(targets, dtype=float)

    feature_names = ["month", "dest_type", "region", "altitude_m", "is_hidden_gem"]

    print(f"Training samples: {len(X)} (10 destinations x 12 months)")
    print(f"Features per sample: {len(X[0])}")
    print(f"Target range: {y.min()} - {y.max()}")
    print(f"Feature names: {feature_names}")

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
    )
    model.fit(X, y)

    train_predictions = model.predict(X)
    mse = np.mean((train_predictions - y) ** 2)
    mae = np.mean(np.abs(train_predictions - y))
    r2 = model.score(X, y)
    print(f"\nTraining MSE: {mse:.4f}")
    print(f"Training MAE: {mae:.4f}")
    print(f"Training R² score: {r2:.4f}")

    importances = model.feature_importances_
    print("\nFeature importances:")
    for name, imp in sorted(
        zip(feature_names, importances), key=lambda x: x[1], reverse=True
    ):
        print(f"  {name}: {imp:.4f}")

    model_path = os.path.join(MODELS_DIR, "crowd_model.pkl")
    joblib.dump(model, model_path)
    print(f"\nModel saved to: {model_path}")
    print()


if __name__ == "__main__":
    print("NepalQuest — ML Model Training Pipeline")
    print("=" * 50)
    print()

    train_itinerary_model()
    train_crowd_model()

    print("=" * 50)
    print("All models trained and saved successfully!")
    print(f"Models directory: {MODELS_DIR}")
    print("  - itinerary_model.pkl")
    print("  - crowd_model.pkl")
    print("=" * 50)
