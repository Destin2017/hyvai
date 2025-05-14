import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 👇 Configuration
DATA_PATH = "ml_dataset.csv"
MODEL_PATH = "../models/predict_model.pkl"
TARGET_COLUMN = "eligible"  # 🔁 Change if your label column has a different name

def load_dataset(path=DATA_PATH):
    df = pd.read_csv(path)
    df = df.dropna()  # You may customize this to fillna or other techniques
    return df

def preprocess(df):
    # Select only numeric or known feature columns
    features = [
        "avg_score", "score_stddev", "ontime_payments",
        "missed_payments", "span_days"
    ]
    X = df[features]
    y = df[TARGET_COLUMN].astype(int)  # Ensure binary classification (0/1)
    return X, y

def train_and_save_model():
    df = load_dataset()
    X, y = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("📊 Evaluation Metrics:\n", classification_report(y_test, y_pred))

    joblib.dump(model, MODEL_PATH)
    print(f"✅ Model saved to {MODEL_PATH}")

def predict(user_features):
    model = joblib.load(MODEL_PATH)

    # Ensure input is in the right shape and order
    input_df = pd.DataFrame([user_features], columns=[
        "avg_score", "score_stddev", "ontime_payments", "missed_payments", "span_days"
    ])

    prediction = model.predict(input_df)[0]
    proba = model.predict_proba(input_df)[0][1]

    return {
        "prediction": int(prediction),
        "confidence": round(proba, 4)
    }

# 🧪 Local test
if __name__ == "__main__":
    train_and_save_model()

    # 👇 Test example
    sample = {
        "avg_score": 70,
        "score_stddev": 5,
        "ontime_payments": 6,
        "missed_payments": 0,
        "span_days": 120
    }

    result = predict(sample)
    print("🔮 Prediction Result:", result)
