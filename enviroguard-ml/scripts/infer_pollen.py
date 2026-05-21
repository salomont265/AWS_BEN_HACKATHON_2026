"""
Inference script for Pollen predictions
Supports both API and Community modes
"""

import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def predict_pollen_api(model_path, hours_ahead=24, temperature=60, grass_pollen=20, tree_pollen=15, weed_pollen=10):
    """
    Predict Pollen index for the next N hours using API mode

    Args:
        model_path: Path to trained model .pkl
        hours_ahead: Number of hours to forecast (default 24)
        temperature: Current temperature (F)
        grass_pollen: Grass pollen component
        tree_pollen: Tree pollen component
        weed_pollen: Weed pollen component

    Returns:
        DataFrame with predictions
    """
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Create future dataframe
    now = datetime.now()
    future_dates = [now + timedelta(hours=i) for i in range(hours_ahead)]
    future = pd.DataFrame({
        'ds': future_dates,
        'temperature': temperature,
        'grass_pollen': grass_pollen,
        'tree_pollen': tree_pollen,
        'weed_pollen': weed_pollen
    })

    # Make predictions
    forecast = model.predict(future)

    results = pd.DataFrame({
        'timestamp': forecast['ds'],
        'pollen_index_prediction': forecast['yhat'].clip(0, 100),
        'pollen_index_lower': forecast['yhat_lower'].clip(0, 100),
        'pollen_index_upper': forecast['yhat_upper'].clip(0, 100)
    })

    return results

def predict_pollen_community(model_path, hours_ahead=24):
    """
    Predict Pollen severity for the next N hours using Community mode

    Args:
        model_path: Path to trained model .pkl
        hours_ahead: Number of hours to forecast (default 24)

    Returns:
        DataFrame with predictions
    """
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Create future dataframe
    now = datetime.now()
    future_dates = [now + timedelta(hours=i) for i in range(hours_ahead)]
    future = pd.DataFrame({'ds': future_dates})

    # Make predictions
    forecast = model.predict(future)

    results = pd.DataFrame({
        'timestamp': forecast['ds'],
        'severity_prediction': forecast['yhat'].clip(0, 100),
        'severity_lower': forecast['yhat_lower'].clip(0, 100),
        'severity_upper': forecast['yhat_upper'].clip(0, 100)
    })

    return results

if __name__ == "__main__":
    # Example usage
    print("="*70)
    print("Pollen Prediction - API Mode (24-hour forecast)")
    print("="*70)
    api_forecast = predict_pollen_api('models/pollen/pollen_api_model.pkl', hours_ahead=24)
    print(api_forecast.head(10))
    print(f"\nMean predicted pollen index: {api_forecast['pollen_index_prediction'].mean():.1f}")

    print("\n" + "="*70)
    print("Pollen Prediction - Community Mode (24-hour forecast)")
    print("="*70)
    community_forecast = predict_pollen_community('models/pollen/pollen_community_model.pkl', hours_ahead=24)
    print(community_forecast.head(10))
    print(f"\nMean predicted severity: {community_forecast['severity_prediction'].mean():.1f}")
