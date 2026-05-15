"""
Train Prophet noise prediction models

Trains one model per station for 24-hour dB forecasting.

NOTE: Run this on EC2 after copying the project there.
Takes ~5 minutes on CPU.

Usage:
    cd /app/enviroguard-ml
    python models/noise/train_noise.py
"""

import pandas as pd
import pickle
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
import matplotlib.pyplot as plt
import os

print("=" * 60)
print("Training Noise Prediction Models (Prophet)")
print("=" * 60)

# Load synthetic noise data
print("\nLoading data from data/noise_synthetic.csv...")
df = pd.read_csv('data/noise_synthetic.csv')
df['ds'] = pd.to_datetime(df['ds'])

print(f"Loaded {len(df)} readings from {df['ds'].min()} to {df['ds'].max()}")

# Train one model per station
for station_id in ['STATION_001', 'STATION_002', 'STATION_003']:
    print(f"\n{'=' * 60}")
    print(f"Training model for {station_id}")
    print(f"{'=' * 60}")

    # Filter data for this station
    station_df = df[df['station_id'] == station_id][['ds', 'y']].copy()
    print(f"Station data: {len(station_df)} readings")

    # Initialize Prophet model
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        interval_width=0.80,  # 80% confidence intervals
        changepoint_prior_scale=0.05  # Conservative trend changes
    )

    # Fit model
    print("Fitting Prophet model...")
    model.fit(station_df)

    # Generate 24-hour forecast
    future = model.make_future_dataframe(periods=24, freq='h')
    forecast = model.predict(future)

    # Cross-validation for evaluation
    print("Running cross-validation...")
    cv_results = cross_validation(
        model,
        initial='60 days',
        period='7 days',
        horizon='24 hours'
    )

    metrics = performance_metrics(cv_results)
    mae = metrics['mae'].mean()
    rmse = metrics['rmse'].mean()
    coverage = metrics['coverage'].mean()

    print(f"\nEvaluation Metrics:")
    print(f"  MAE:  {mae:.2f} dB")
    print(f"  RMSE: {rmse:.2f} dB")
    print(f"  Coverage: {coverage:.2%}")

    # Save evaluation metrics
    with open(f'models/noise/{station_id}_eval.txt', 'w') as f:
        f.write(f"Noise Prediction Model - {station_id}\n")
        f.write(f"{'=' * 40}\n\n")
        f.write(f"MAE:  {mae:.2f} dB\n")
        f.write(f"RMSE: {rmse:.2f} dB\n")
        f.write(f"Coverage: {coverage:.2%}\n")
        f.write(f"\nTarget: MAE < 8 dB, RMSE < 12 dB, Coverage > 75%\n")
        f.write(f"Status: {'✓ PASS' if mae < 8 and rmse < 12 and coverage > 0.75 else '✗ FAIL'}\n")

    # Save model
    model_path = f'models/noise/{station_id}_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"✓ Model saved to {model_path}")

    # Generate forecast plot
    fig = model.plot(forecast)
    plt.title(f'Noise Forecast - {station_id}')
    plt.ylabel('dB Level')
    plt.tight_layout()
    plt.savefig(f'outputs/noise_forecast_{station_id}.png', dpi=150)
    plt.close()
    print(f"✓ Forecast plot saved to outputs/noise_forecast_{station_id}.png")

    # Generate components plot
    fig = model.plot_components(forecast)
    plt.tight_layout()
    plt.savefig(f'outputs/noise_components_{station_id}.png', dpi=150)
    plt.close()
    print(f"✓ Components plot saved to outputs/noise_components_{station_id}.png")

print("\n" + "=" * 60)
print("✅ All noise prediction models trained successfully!")
print("=" * 60)
print("\nNext steps:")
print("1. Check evaluation metrics in models/noise/*_eval.txt")
print("2. View forecast plots in outputs/")
print("3. Train fill models: python models/fill/train_fill.py")
