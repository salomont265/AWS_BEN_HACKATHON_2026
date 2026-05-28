"""
Inference script for Litter predictions
Supports both API and Community modes
"""

import pickle
import pandas as pd
from datetime import datetime, timedelta

def predict_litter_api(model_path, hours_ahead=24):
    """
    Predict Litter severity for the next N hours using API mode

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
    future = pd.DataFrame({
        'ds': future_dates,
        'day_of_week': [d.weekday() for d in future_dates]
    })

    # Make predictions
    forecast = model.predict(future)

    results = pd.DataFrame({
        'timestamp': forecast['ds'],
        'severity_prediction': forecast['yhat'].clip(0, 100),
        'severity_lower': forecast['yhat_lower'].clip(0, 100),
        'severity_upper': forecast['yhat_upper'].clip(0, 100)
    })

    return results

def predict_litter_community(model_path, hours_ahead=24):
    """
    Predict Litter severity for the next N hours using Community mode

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
    print("Litter Prediction - API Mode (24-hour forecast)")
    print("="*70)
    api_forecast = predict_litter_api('models/litter/litter_api_model.pkl', hours_ahead=24)
    print(api_forecast.head(10))
    print(f"\nMean predicted severity: {api_forecast['severity_prediction'].mean():.1f}")

    print("\n" + "="*70)
    print("Litter Prediction - Community Mode (24-hour forecast)")
    print("="*70)
    community_forecast = predict_litter_community('models/litter/litter_community_model.pkl', hours_ahead=24)
    print(community_forecast.head(10))
    print(f"\nMean predicted severity: {community_forecast['severity_prediction'].mean():.1f}")
