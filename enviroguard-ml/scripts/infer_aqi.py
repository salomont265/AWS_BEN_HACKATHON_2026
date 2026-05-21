"""
Inference script for AQI predictions
Supports both API and Community modes
"""

import pickle
import pandas as pd
from datetime import datetime, timedelta

def predict_aqi_api(model_path, hours_ahead=24, temperature=65, humidity=50, wind_speed=5):
    """
    Predict AQI for the next N hours using API mode

    Args:
        model_path: Path to trained model .pkl
        hours_ahead: Number of hours to forecast (default 24)
        temperature: Current temperature (F)
        humidity: Current humidity (%)
        wind_speed: Current wind speed (mph)

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
        'humidity': humidity,
        'wind_speed': wind_speed
    })

    # Make predictions
    forecast = model.predict(future)

    results = pd.DataFrame({
        'timestamp': forecast['ds'],
        'aqi_prediction': forecast['yhat'].clip(0, 200),
        'aqi_lower': forecast['yhat_lower'].clip(0, 200),
        'aqi_upper': forecast['yhat_upper'].clip(0, 200)
    })

    return results

def predict_aqi_community(model_path, hours_ahead=24):
    """
    Predict AQI severity for the next N hours using Community mode

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
    print("AQI Prediction - API Mode (24-hour forecast)")
    print("="*70)
    api_forecast = predict_aqi_api('models/aqi/aqi_api_model.pkl', hours_ahead=24)
    print(api_forecast.head(10))
    print(f"\nMean predicted AQI: {api_forecast['aqi_prediction'].mean():.1f}")

    print("\n" + "="*70)
    print("AQI Prediction - Community Mode (24-hour forecast)")
    print("="*70)
    community_forecast = predict_aqi_community('models/aqi/aqi_community_model.pkl', hours_ahead=24)
    print(community_forecast.head(10))
    print(f"\nMean predicted severity: {community_forecast['severity_prediction'].mean():.1f}")
