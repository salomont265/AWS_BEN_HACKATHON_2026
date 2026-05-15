"""
Fill Prediction Inference

Generates 48-hour bin fill forecast with overflow detection.

Usage:
    python models/fill/infer_fill.py STATION_001
"""

import pickle
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

def predict_fill(station_id: str, hours: int = 48):
    """
    Generate 48-hour fill forecast with overflow detection.

    Args:
        station_id: Station identifier (e.g., 'STATION_001')
        hours: Number of hours to forecast (default: 48)

    Returns:
        dict: Forecast with predictions, overflow time, hours until overflow
    """
    # Load model
    model_path = f'models/fill/{station_id}_model.pkl'

    if not os.path.exists(model_path):
        print(f"Warning: Model for {station_id} not found, using STATION_001")
        model_path = 'models/fill/STATION_001_model.pkl'

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No fill models found. Train first: python models/fill/train_fill.py"
        )

    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Generate future dataframe (15-min intervals for N hours)
    periods = hours * 4  # 4 intervals per hour
    future = model.make_future_dataframe(periods=periods, freq='15min')
    forecast = model.predict(future)

    # Get last N hours (future predictions only)
    forecast = forecast.tail(periods)

    # Overflow detection: scan for first value >= 95%
    overflow_time = None
    for _, row in forecast.iterrows():
        if row['yhat'] >= 95.0:
            overflow_time = row['ds']
            break

    # Calculate hours until overflow
    hours_until_overflow = None
    if overflow_time:
        now = datetime.now()
        hours_until_overflow = int((overflow_time - now).total_seconds() / 3600)

    # Get current fill (first prediction as proxy for "current")
    current_fill_pct = forecast.iloc[0]['yhat']

    # Format output
    return {
        'station_id': station_id,
        'generated_at': datetime.now().isoformat(),
        'forecast': [
            {
                'time': row['ds'].isoformat(),
                'predicted': round(row['yhat'], 2),
                'lower': round(row['yhat_lower'], 2),
                'upper': round(row['yhat_upper'], 2)
            }
            for _, row in forecast.iterrows()
        ],
        'overflow_predicted': overflow_time is not None,
        'overflow_time': overflow_time.isoformat() if overflow_time else None,
        'hours_until_overflow': hours_until_overflow,
        'current_fill_pct': round(current_fill_pct, 2)
    }

def main():
    """CLI interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python models/fill/infer_fill.py <station_id>")
        print("Example: python models/fill/infer_fill.py STATION_001")
        sys.exit(1)

    station_id = sys.argv[1]
    hours = int(sys.argv[2]) if len(sys.argv) > 2 else 48

    print(f"Generating {hours}-hour fill forecast for {station_id}...")
    result = predict_fill(station_id, hours)

    print(f"\n✓ Forecast generated at {result['generated_at']}")
    print(f"Current fill: {result['current_fill_pct']}%")

    if result['overflow_predicted']:
        print(f"⚠ OVERFLOW PREDICTED at {result['overflow_time']}")
        print(f"  Hours until overflow: {result['hours_until_overflow']}")
    else:
        print("✓ No overflow predicted in forecast window")

    print(f"\nFirst 8 predictions (2 hours):")
    for pred in result['forecast'][:8]:
        print(f"  {pred['time']}: {pred['predicted']}% "
              f"(CI: {pred['lower']}-{pred['upper']})")

if __name__ == '__main__':
    main()
