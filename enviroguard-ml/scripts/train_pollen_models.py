#!/usr/bin/env python3
"""
Train Pollen models (API and Community modes) using Prophet.
Uses synthetic but realistic NYC seasonal pollen data.
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
import pickle
import json
import os
from datetime import datetime

# Ensure directories exist
os.makedirs('/home/ec2-user/ml model/models', exist_ok=True)
os.makedirs('/home/ec2-user/ml model/eval', exist_ok=True)

def calculate_metrics(y_true, y_pred):
    """Calculate accuracy metrics."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100  # Convert to percentage
    accuracy = 100 - mape

    return {
        'MAE': round(mae, 4),
        'RMSE': round(rmse, 4),
        'R2': round(r2, 4),
        'MAPE': round(mape, 4),
        'Accuracy': round(accuracy, 4)
    }

def train_api_model():
    """Train API mode model with regressors."""
    print("\n" + "="*60)
    print("TRAINING POLLEN API MODEL")
    print("="*60)

    # Load data
    df = pd.read_csv('/home/ec2-user/ml model/data/pollen_real_api.csv',
                     comment='#', skipinitialspace=True)

    # Prepare Prophet format
    prophet_df = pd.DataFrame({
        'ds': pd.to_datetime(df['timestamp']),
        'y': df['y'],
        'temperature': df['temperature'],
        'humidity': df['humidity'],
        'wind_speed': df['wind_speed'],
        'grass_pollen': df['grass_pollen'],
        'tree_pollen': df['tree_pollen'],
        'weed_pollen': df['weed_pollen']
    })

    # Split: 90% train, 10% test
    split_idx = int(len(prophet_df) * 0.9)
    train_df = prophet_df[:split_idx].copy()
    test_df = prophet_df[split_idx:].copy()

    print(f"\nData split:")
    print(f"  Total samples: {len(prophet_df)}")
    print(f"  Training samples: {len(train_df)} (90%)")
    print(f"  Test samples: {len(test_df)} (10%)")

    # Train model with regressors
    print("\nTraining Prophet model with regressors...")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=True,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.05
    )

    # Add regressors
    model.add_regressor('temperature')
    model.add_regressor('humidity')
    model.add_regressor('wind_speed')
    model.add_regressor('grass_pollen')
    model.add_regressor('tree_pollen')
    model.add_regressor('weed_pollen')

    model.fit(train_df)

    # Make predictions on test set
    print("Making predictions...")
    test_predictions = model.predict(test_df)

    # Calculate metrics
    metrics = calculate_metrics(test_df['y'].values, test_predictions['yhat'].values)

    print("\n" + "-"*60)
    print("API MODE RESULTS:")
    print("-"*60)
    print(f"MAE:      {metrics['MAE']}")
    print(f"RMSE:     {metrics['RMSE']}")
    print(f"R²:       {metrics['R2']}")
    print(f"MAPE:     {metrics['MAPE']}%")
    print(f"Accuracy: {metrics['Accuracy']}%")
    print("-"*60)

    # Save model
    model_path = '/home/ec2-user/ml model/models/pollen_api_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nModel saved to: {model_path}")

    # Save metrics
    metrics_data = {
        'model': 'Pollen API',
        'trained_on': datetime.now().isoformat(),
        'data_source': 'Synthetic NYC seasonal pollen data',
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'metrics': metrics,
        'regressors': ['temperature', 'humidity', 'wind_speed', 'grass_pollen', 'tree_pollen', 'weed_pollen']
    }

    metrics_path = '/home/ec2-user/ml model/eval/pollen_api_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")

    return metrics

def train_community_model():
    """Train Community mode model (timestamp only, no regressors)."""
    print("\n" + "="*60)
    print("TRAINING POLLEN COMMUNITY MODEL")
    print("="*60)

    # Load data
    df = pd.read_csv('/home/ec2-user/ml model/data/pollen_real_community.csv',
                     comment='#', skipinitialspace=True)

    # Prepare Prophet format
    prophet_df = pd.DataFrame({
        'ds': pd.to_datetime(df['timestamp']),
        'y': df['y']
    })

    # Split: 90% train, 10% test
    split_idx = int(len(prophet_df) * 0.9)
    train_df = prophet_df[:split_idx].copy()
    test_df = prophet_df[split_idx:].copy()

    print(f"\nData split:")
    print(f"  Total samples: {len(prophet_df)}")
    print(f"  Training samples: {len(train_df)} (90%)")
    print(f"  Test samples: {len(test_df)} (10%)")

    # Train model (no regressors)
    print("\nTraining Prophet model (timestamp only)...")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=True,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.05
    )

    model.fit(train_df)

    # Make predictions on test set
    print("Making predictions...")
    test_predictions = model.predict(test_df)

    # Calculate metrics
    metrics = calculate_metrics(test_df['y'].values, test_predictions['yhat'].values)

    print("\n" + "-"*60)
    print("COMMUNITY MODE RESULTS:")
    print("-"*60)
    print(f"MAE:      {metrics['MAE']}")
    print(f"RMSE:     {metrics['RMSE']}")
    print(f"R²:       {metrics['R2']}")
    print(f"MAPE:     {metrics['MAPE']}%")
    print(f"Accuracy: {metrics['Accuracy']}%")
    print("-"*60)

    # Save model
    model_path = '/home/ec2-user/ml model/models/pollen_community_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nModel saved to: {model_path}")

    # Save metrics
    metrics_data = {
        'model': 'Pollen Community',
        'trained_on': datetime.now().isoformat(),
        'data_source': 'Synthetic NYC seasonal pollen data',
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'metrics': metrics,
        'regressors': []
    }

    metrics_path = '/home/ec2-user/ml model/eval/pollen_community_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")

    return metrics

def main():
    """Train both pollen models."""
    print("\n" + "="*60)
    print("POLLEN MODEL TRAINING")
    print("="*60)
    print("\nUsing Prophet for time-series forecasting")
    print("Data: Synthetic but realistic NYC seasonal pollen patterns")
    print("Split: 90% train, 10% test")

    # Train both models
    api_metrics = train_api_model()
    community_metrics = train_community_model()

    # Final summary
    print("\n" + "="*60)
    print("TRAINING COMPLETE - SUMMARY")
    print("="*60)
    print(f"\nAPI Mode Accuracy:       {api_metrics['Accuracy']:.2f}%")
    print(f"Community Mode Accuracy: {community_metrics['Accuracy']:.2f}%")

    print("\nTarget Accuracy: 75%")
    api_meets = "✓ MEETS" if api_metrics['Accuracy'] >= 75 else "✗ BELOW"
    community_meets = "✓ MEETS" if community_metrics['Accuracy'] >= 75 else "✗ BELOW"
    print(f"API Mode:       {api_meets} target")
    print(f"Community Mode: {community_meets} target")

    print("\nModels saved to: /home/ec2-user/ml model/models/")
    print("  - pollen_api_model.pkl")
    print("  - pollen_community_model.pkl")

    print("\nMetrics saved to: /home/ec2-user/ml model/eval/")
    print("  - pollen_api_metrics.json")
    print("  - pollen_community_metrics.json")
    print("="*60)

if __name__ == '__main__':
    main()
