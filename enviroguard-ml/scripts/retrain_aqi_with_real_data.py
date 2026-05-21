#!/usr/bin/env python3
"""
Retrain AQI models (API and Community modes) using Prophet with real EPA/NOAA data.

Training Data:
- API mode: /home/ec2-user/ml model/data/aqi_real_api.csv
- Community mode: /home/ec2-user/ml model/data/aqi_real_community.csv

Requirements:
1. Use Prophet for time-series forecasting
2. Split: 90% train, 10% test
3. For API mode, add regressors: temperature, humidity, wind_speed
4. For Community mode, use timestamp only (no regressors)
5. Calculate accuracy metrics: MAE, RMSE, R², MAPE
6. Accuracy % = 100 - MAPE
7. Save trained models to /home/ec2-user/ml model/models/
8. Save metrics to /home/ec2-user/ml model/eval/
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import json
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

def calculate_accuracy_metrics(y_true, y_pred):
    """Calculate MAE, RMSE, R², MAPE, and Accuracy %"""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)

    # MAPE calculation with division by zero protection
    mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))) * 100
    accuracy_pct = max(0, 100 - mape)

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "mape": float(mape),
        "accuracy_pct": float(accuracy_pct)
    }

def train_aqi_api_model():
    """Train AQI API mode model with weather regressors"""
    print("\n" + "="*70)
    print("TRAINING AQI API MODEL WITH REAL DATA")
    print("="*70)

    # Load data
    data_path = "/home/ec2-user/ml model/data/aqi_real_api.csv"
    print(f"\nLoading data from: {data_path}")
    df = pd.read_csv(data_path, comment='#')

    print(f"Total records: {len(df)}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    # Prepare data for Prophet
    df['ds'] = pd.to_datetime(df['timestamp'])
    df['y'] = df['y'].astype(float)

    # 90/10 train-test split
    split_idx = int(len(df) * 0.9)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    print(f"\nTrain set: {len(train_df)} records")
    print(f"Test set: {len(test_df)} records")
    print(f"Split date: {train_df['ds'].iloc[-1]}")

    # Initialize Prophet model
    print("\nInitializing Prophet model with regressors...")
    model = Prophet(
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10,
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )

    # Add weather regressors
    model.add_regressor('temperature')
    model.add_regressor('humidity')
    model.add_regressor('wind_speed')

    # Prepare training data with regressors
    train_prophet = train_df[['ds', 'y', 'temperature', 'humidity', 'wind_speed']].copy()

    # Train model
    print("Training model...")
    model.fit(train_prophet)
    print("Training complete!")

    # Prepare test data with regressors
    test_prophet = test_df[['ds', 'temperature', 'humidity', 'wind_speed']].copy()

    # Make predictions
    print("\nMaking predictions on test set...")
    forecast = model.predict(test_prophet)
    y_pred = forecast['yhat'].values
    y_true = test_df['y'].values

    # Calculate metrics
    metrics = calculate_accuracy_metrics(y_true, y_pred)

    # Print results
    print("\n" + "-"*70)
    print("AQI API MODEL RESULTS")
    print("-"*70)
    print(f"MAE:        {metrics['mae']:.4f}")
    print(f"RMSE:       {metrics['rmse']:.4f}")
    print(f"R²:         {metrics['r2']:.4f}")
    print(f"MAPE:       {metrics['mape']:.2f}%")
    print(f"Accuracy:   {metrics['accuracy_pct']:.2f}%")
    print("-"*70)

    if metrics['accuracy_pct'] >= 75:
        print("✓ PASSED: Accuracy meets 75% target")
    else:
        print("✗ FAILED: Accuracy below 75% target")

    # Save model
    model_path = "/home/ec2-user/ml model/models/aqi_api_model.pkl"
    print(f"\nSaving model to: {model_path}")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    # Save metrics
    metrics_path = "/home/ec2-user/ml model/eval/aqi_api_metrics.json"
    print(f"Saving metrics to: {metrics_path}")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    return metrics

def train_aqi_community_model():
    """Train AQI Community mode model (timestamp only, no regressors)"""
    print("\n" + "="*70)
    print("TRAINING AQI COMMUNITY MODEL WITH REAL DATA")
    print("="*70)

    # Load data
    data_path = "/home/ec2-user/ml model/data/aqi_real_community.csv"
    print(f"\nLoading data from: {data_path}")
    df = pd.read_csv(data_path, comment='#')

    print(f"Total records: {len(df)}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    # Prepare data for Prophet
    df['ds'] = pd.to_datetime(df['timestamp'])
    df['y'] = df['y'].astype(float)

    # 90/10 train-test split
    split_idx = int(len(df) * 0.9)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    print(f"\nTrain set: {len(train_df)} records")
    print(f"Test set: {len(test_df)} records")
    print(f"Split date: {train_df['ds'].iloc[-1]}")

    # Initialize Prophet model (no regressors for community mode)
    print("\nInitializing Prophet model (timestamp only)...")
    model = Prophet(
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10,
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )

    # Prepare training data (timestamp and target only)
    train_prophet = train_df[['ds', 'y']].copy()

    # Train model
    print("Training model...")
    model.fit(train_prophet)
    print("Training complete!")

    # Prepare test data
    test_prophet = test_df[['ds']].copy()

    # Make predictions
    print("\nMaking predictions on test set...")
    forecast = model.predict(test_prophet)
    y_pred = forecast['yhat'].values
    y_true = test_df['y'].values

    # Calculate metrics
    metrics = calculate_accuracy_metrics(y_true, y_pred)

    # Print results
    print("\n" + "-"*70)
    print("AQI COMMUNITY MODEL RESULTS")
    print("-"*70)
    print(f"MAE:        {metrics['mae']:.4f}")
    print(f"RMSE:       {metrics['rmse']:.4f}")
    print(f"R²:         {metrics['r2']:.4f}")
    print(f"MAPE:       {metrics['mape']:.2f}%")
    print(f"Accuracy:   {metrics['accuracy_pct']:.2f}%")
    print("-"*70)

    if metrics['accuracy_pct'] >= 75:
        print("✓ PASSED: Accuracy meets 75% target")
    else:
        print("✗ FAILED: Accuracy below 75% target")

    # Save model
    model_path = "/home/ec2-user/ml model/models/aqi_community_model.pkl"
    print(f"\nSaving model to: {model_path}")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    # Save metrics
    metrics_path = "/home/ec2-user/ml model/eval/aqi_community_metrics.json"
    print(f"Saving metrics to: {metrics_path}")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    return metrics

def main():
    """Main training function"""
    print("\n" + "="*70)
    print("AQI MODEL RETRAINING WITH REAL EPA/NOAA DATA")
    print("="*70)
    print("\nData Sources:")
    print("- API mode: Real EPA AQI + NOAA weather (NYC)")
    print("- Community mode: Real EPA AQI scaled to severity 1-10 (NYC)")
    print("- Date range: 2026-03-10 to 2026-05-17 (1,644 hourly records)")

    # Train both models
    api_metrics = train_aqi_api_model()
    community_metrics = train_aqi_community_model()

    # Final summary
    print("\n" + "="*70)
    print("FINAL SUMMARY")
    print("="*70)
    print(f"\nAPI Mode:")
    print(f"  Train/Test Split: 90% / 10%")
    print(f"  Regressors: temperature, humidity, wind_speed")
    print(f"  Accuracy: {api_metrics['accuracy_pct']:.2f}%")
    print(f"  Status: {'✓ PASSED' if api_metrics['accuracy_pct'] >= 75 else '✗ FAILED'} (target: 75%)")

    print(f"\nCommunity Mode:")
    print(f"  Train/Test Split: 90% / 10%")
    print(f"  Regressors: None (timestamp only)")
    print(f"  Accuracy: {community_metrics['accuracy_pct']:.2f}%")
    print(f"  Status: {'✓ PASSED' if community_metrics['accuracy_pct'] >= 75 else '✗ FAILED'} (target: 75%)")

    print("\n" + "="*70)
    print("RETRAINING COMPLETE")
    print("="*70)
    print("\nSaved models:")
    print("  - /home/ec2-user/ml model/models/aqi_api_model.pkl")
    print("  - /home/ec2-user/ml model/models/aqi_community_model.pkl")
    print("\nSaved metrics:")
    print("  - /home/ec2-user/ml model/eval/aqi_api_metrics.json")
    print("  - /home/ec2-user/ml model/eval/aqi_community_metrics.json")
    print()

if __name__ == "__main__":
    main()
