from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load a trained model if available
MODEL_PATH = "models/predict_model.pkl"
model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

# Basic fallback thresholds (heuristics)
def predict_risk_fallback(user):
    score = float(user.get("avg_score") or 0)
    std = float(user.get("score_stddev") or 0)

    if score >= 70 and std < 10:
        return "low", 0.85  # high confidence
    if score >= 50:
        return "medium", 0.6  # medium confidence
    return "high", 0.3  # low confidence

@app.route("/predict-risk", methods=["POST"])
def predict_risk():
    data = request.json
    users = data.get("users", [])

    results = []
    for user in users:
        features = [
            float(user.get("avg_score") or 0),
            float(user.get("score_stddev") or 0),
            int(user.get("ontime_payments") or 0),
            int(user.get("missed_payments") or 0),
            int(user.get("span_days") or 0)
        ]

        if model:
            prediction = model.predict([features])[0]
            proba = model.predict_proba([features])[0][1]  # Probability for positive class
            pred_label = "high" if prediction == 1 else "low"
            confidence = float(proba)
        else:
            pred_label, confidence = predict_risk_fallback(user)

        results.append({
            "user_id": user.get("user_id"),
            "predicted_risk": pred_label,
            "confidence": confidence  # Always included!
        })

    return jsonify({"predictions": results})

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "ML API is running 🚀"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

