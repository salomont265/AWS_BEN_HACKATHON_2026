#!/usr/bin/env python3
"""
Train Noise Models using Prophet with Real NYC 311 Complaint Data
Based on 186,946 real NYC 311 noise complaints
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import json
import os
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Paths
DATA_DIR = "/home/ec2-user/ml model/data"
MODEL_DIR = "/home/ec2-user/ml model/models"
EVAL_DIR = "/home/ec2-user/ml model/eval"

# Create directories if they don't exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

def calculate_mape(y_true, y_pred):
    """Calculate Mean Absolute Percentage Error"""
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    # Avoid division by zero
    mask = y_true != 0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def calculate_metrics(y_true, y_pred, model_name):
    """Calculate all accuracy metrics"""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    mape = calculate_mape(y_true, y_pred)
    accuracy = 100 - mape

    metrics = {
        "model_name": model_name,
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "mape": float(mape),
        "accuracy_percent": float(accuracy)
    }

    print(f"\n{model_name} Metrics:")
    print(f"  MAE:       {mae:.4f}")
    print(f"  RMSE:      {rmse:.4f}")
    print(f"  R²:        {r2:.4f}")
    print(f"  MAPE:      {mape:.2f}%")
    print(f"  Accuracy:  {accuracy:.2f}%")

    return metrics

def train_api_model():
    """Train API mode model with regressors"""
    print("="*60)
    print("TRAINING API MODE MODEL")
    print("="*60)

    # Load data
    api_data = pd.read_csv(f"{DATA_DIR}/noise_real_api.csv", comment='#')
    complaints = pd.read_csv(f"{DATA_DIR}/verified_real_noise_complaints.csv")

    print(f"Loaded API data: {len(api_data)} records")
    print(f"Loaded complaints data: {len(complaints)} records")

    # Convert timestamps
    api_data['timestamp'] = pd.to_datetime(api_data['timestamp'])
    complaints['timestamp'] = pd.to_datetime(complaints['timestamp'])

    # Merge complaint counts with API data
    merged = api_data.merge(complaints[['timestamp', 'complaint_count']],
                           on='timestamp', how='left')

    # Fill any missing complaint counts with 0
    merged['complaint_count'] = merged['complaint_count'].fillna(0)

    print(f"Merged data: {len(merged)} records")
    print(f"Complaint count range: {merged['complaint_count'].min():.0f} - {merged['complaint_count'].max():.0f}")

    # Prepare for Prophet (requires 'ds' and 'y' columns)
    prophet_df = pd.DataFrame({
        'ds': merged['timestamp'],
        'y': merged['y'],
        'temperature': merged['temperature'],
        'humidity': merged['humidity'],
        'wind_speed': merged['wind_speed'],
        'complaint_count': merged['complaint_count']
    })

    # Split 90/10
    split_idx = int(len(prophet_df) * 0.9)
    train_df = prophet_df[:split_idx].copy()
    test_df = prophet_df[split_idx:].copy()

    print(f"\nTrain set: {len(train_df)} records")
    print(f"Test set:  {len(test_df)} records")

    # Train Prophet model
    print("\nTraining Prophet model with regressors...")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=True,
        seasonality_mode='multiplicative'
    )

    # Add regressors
    model.add_regressor('temperature')
    model.add_regressor('humidity')
    model.add_regressor('wind_speed')
    model.add_regressor('complaint_count')

    model.fit(train_df)

    # Make predictions on test set
    print("Making predictions...")
    forecast = model.predict(test_df[['ds', 'temperature', 'humidity', 'wind_speed', 'complaint_count']])

    # Calculate metrics
    y_true = test_df['y'].values
    y_pred = forecast['yhat'].values

    metrics = calculate_metrics(y_true, y_pred, "Noise API Model")

    # Save model
    model_path = f"{MODEL_DIR}/noise_api_model.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nModel saved to: {model_path}")

    # Save metrics
    metrics_path = f"{EVAL_DIR}/noise_api_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")

    return metrics

def train_community_model():
    """Train Community mode model (timestamp only, no regressors)"""
    print("\n" + "="*60)
    print("TRAINING COMMUNITY MODE MODEL")
    print("="*60)

    # Load data
    community_data = pd.read_csv(f"{DATA_DIR}/noise_real_community.csv", comment='#')

    print(f"Loaded Community data: {len(community_data)} records")

    # Convert timestamps
    community_data['timestamp'] = pd.to_datetime(community_data['timestamp'])

    # Prepare for Prophet
    prophet_df = pd.DataFrame({
        'ds': community_data['timestamp'],
        'y': community_data['y']
    })

    # Split 90/10
    split_idx = int(len(prophet_df) * 0.9)
    train_df = prophet_df[:split_idx].copy()
    test_df = prophet_df[split_idx:].copy()

    print(f"\nTrain set: {len(train_df)} records")
    print(f"Test set:  {len(test_df)} records")

    # Train Prophet model (no regressors)
    print("\nTraining Prophet model (timestamp only)...")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=True,
        seasonality_mode='additive'
    )

    model.fit(train_df)

    # Make predictions on test set
    print("Making predictions...")
    forecast = model.predict(test_df[['ds']])

    # Calculate metrics
    y_true = test_df['y'].values
    y_pred = forecast['yhat'].values

    metrics = calculate_metrics(y_true, y_pred, "Noise Community Model")

    # Save model
    model_path = f"{MODEL_DIR}/noise_community_model.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nModel saved to: {model_path}")

    # Save metrics
    metrics_path = f"{EVAL_DIR}/noise_community_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")

    return metrics

def main():
    print("\n" + "="*60)
    print("NOISE MODEL TRAINING - PROPHET")
    print("Based on 186,946 Real NYC 311 Noise Complaints")
    print("="*60)

    # Train both models
    api_metrics = train_api_model()
    community_metrics = train_community_model()

    # Summary
    print("\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)

    print(f"\nAPI Mode:")
    print(f"  Accuracy: {api_metrics['accuracy_percent']:.2f}%")
    print(f"  Target:   75.00%")
    print(f"  Status:   {'PASS' if api_metrics['accuracy_percent'] >= 75 else 'FAIL'}")

    print(f"\nCommunity Mode:")
    print(f"  Accuracy: {community_metrics['accuracy_percent']:.2f}%")
    print(f"  Target:   75.00%")
    print(f"  Status:   {'PASS' if community_metrics['accuracy_percent'] >= 75 else 'FAIL'}")

    print("\nModels saved to:")
    print(f"  - {MODEL_DIR}/noise_api_model.pkl")
    print(f"  - {MODEL_DIR}/noise_community_model.pkl")

    print("\nMetrics saved to:")
    print(f"  - {EVAL_DIR}/noise_api_metrics.json")
    print(f"  - {EVAL_DIR}/noise_community_metrics.json")

    print("\n" + "="*60)

if __name__ == "__main__":
    main()
