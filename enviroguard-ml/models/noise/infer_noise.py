"""
Noise Prediction Inference

Generates 24-hour noise forecast for a given station.

Usage:
    python models/noise/infer_noise.py STATION_001
"""

import pickle
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

def predict_noise(station_id: str, hours: int = 24):
    """
    Generate 24-hour noise forecast for a station.

    Args:
        station_id: Station identifier (e.g., 'STATION_001')
        hours: Number of hours to forecast (default: 24)

    Returns:
        dict: Forecast with predictions, peak hour, peak dB
    """
    # Load model (fallback to STATION_001 if not found)
    model_path = f'models/noise/{station_id}_model.pkl'

    if not os.path.exists(model_path):
        print(f"Warning: Model for {station_id} not found, using STATION_001")
        model_path = 'models/noise/STATION_001_model.pkl'

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No noise models found. Train first: python models/noise/train_noise.py"
        )

    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Generate future dataframe (hourly for N hours)
    future = model.make_future_dataframe(periods=hours, freq='h')
    forecast = model.predict(future)

    # Get last N hours (future predictions only)
    forecast = forecast.tail(hours)

    # Find peak hour and dB
    peak_idx = forecast['yhat'].idxmax()
    peak_hour = forecast.loc[peak_idx, 'ds']
    peak_db = forecast.loc[peak_idx, 'yhat']

    # Format output
    return {
        'station_id': station_id,
        'generated_at': datetime.now().isoformat(),
        'forecast': [
            {
                'hour': row['ds'].isoformat(),
                'predicted': round(row['yhat'], 2),
                'lower': round(row['yhat_lower'], 2),
                'upper': round(row['yhat_upper'], 2)
            }
            for _, row in forecast.iterrows()
        ],
        'peak_hour': peak_hour.isoformat(),
        'peak_db': round(peak_db, 2)
    }

def main():
    """CLI interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python models/noise/infer_noise.py <station_id>")
        print("Example: python models/noise/infer_noise.py STATION_001")
        sys.exit(1)

    station_id = sys.argv[1]
    hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24

    print(f"Generating {hours}-hour noise forecast for {station_id}...")
    result = predict_noise(station_id, hours)

    print(f"\n✓ Forecast generated at {result['generated_at']}")
    print(f"Peak: {result['peak_db']} dB at {result['peak_hour']}")
    print(f"\nFirst 5 predictions:")

    for pred in result['forecast'][:5]:
        print(f"  {pred['hour']}: {pred['predicted']} dB "
              f"(CI: {pred['lower']}-{pred['upper']})")

if __name__ == '__main__':
    main()
