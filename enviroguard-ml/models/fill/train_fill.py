"""
Train Prophet fill prediction models

Trains one model per station for 48-hour bin fill forecasting with overflow detection.

NOTE: Run this on EC2 after copying the project there.
Takes ~5 minutes on CPU.

Usage:
    cd /app/enviroguard-ml
    python models/fill/train_fill.py
"""

import pandas as pd
import pickle
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
import matplotlib.pyplot as plt
import os

print("=" * 60)
print("Training Fill Prediction Models (Prophet)")
print("=" * 60)

# Load synthetic fill data
print("\nLoading data from data/fill_synthetic.csv...")
df = pd.read_csv('data/fill_synthetic.csv')
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

    # Initialize Prophet model with higher flexibility for sawtooth pattern
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        interval_width=0.80,
        changepoint_prior_scale=0.5  # Higher = more flexible for fill resets
    )

    # Fit model
    print("Fitting Prophet model...")
    model.fit(station_df)

    # Generate 48-hour forecast (48 hours × 4 readings/hour = 192 periods)
    future = model.make_future_dataframe(periods=192, freq='15min')
    forecast = model.predict(future)

    # Overflow detection test
    print("\nTesting overflow detection logic...")
    last_192 = forecast.tail(192)
    overflow_time = None
    for idx, row in last_192.iterrows():
        if row['yhat'] >= 95.0:
            overflow_time = row['ds']
            hours_until = (overflow_time - station_df['ds'].max()).total_seconds() / 3600
            print(f"  Overflow predicted at: {overflow_time}")
            print(f"  Hours until overflow: {hours_until:.1f}")
            break

    if overflow_time is None:
        print("  No overflow predicted in 48-hour window")

    # Cross-validation for evaluation
    print("\nRunning cross-validation...")
    cv_results = cross_validation(
        model,
        initial='60 days',
        period='7 days',
        horizon='48 hours'
    )

    metrics = performance_metrics(cv_results)
    mae = metrics['mae'].mean()
    rmse = metrics['rmse'].mean()
    coverage = metrics['coverage'].mean()

    print(f"\nEvaluation Metrics:")
    print(f"  MAE:  {mae:.2f}%")
    print(f"  RMSE: {rmse:.2f}%")
    print(f"  Coverage: {coverage:.2%}")

    # Save evaluation metrics
    with open(f'models/fill/{station_id}_eval.txt', 'w') as f:
        f.write(f"Fill Prediction Model - {station_id}\n")
        f.write(f"{'=' * 40}\n\n")
        f.write(f"MAE:  {mae:.2f}%\n")
        f.write(f"RMSE: {rmse:.2f}%\n")
        f.write(f"Coverage: {coverage:.2%}\n")
        f.write(f"\nTarget: MAE < 5%, RMSE < 7%, Coverage > 75%\n")
        f.write(f"Status: {'✓ PASS' if mae < 5 and rmse < 7 and coverage > 0.75 else '✗ FAIL'}\n")

    # Save model
    model_path = f'models/fill/{station_id}_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"✓ Model saved to {model_path}")

    # Generate forecast plot with overflow threshold line
    fig, ax = plt.subplots(figsize=(12, 6))
    model.plot(forecast, ax=ax)

    # Add red horizontal line at 95% (overflow threshold)
    ax.axhline(y=95, color='red', linestyle='--', linewidth=2, label='Overflow Threshold (95%)')

    # Add vertical line if overflow predicted
    if overflow_time:
        ax.axvline(x=overflow_time, color='red', linestyle=':', linewidth=2, alpha=0.7, label='Predicted Overflow')

    ax.set_title(f'Fill Level Forecast - {station_id}')
    ax.set_ylabel('Fill %')
    ax.set_ylim([0, 105])
    ax.legend()
    plt.tight_layout()
    plt.savefig(f'outputs/fill_forecast_{station_id}.png', dpi=150)
    plt.close()
    print(f"✓ Forecast plot saved to outputs/fill_forecast_{station_id}.png")

    # Generate components plot
    fig = model.plot_components(forecast)
    plt.tight_layout()
    plt.savefig(f'outputs/fill_components_{station_id}.png', dpi=150)
    plt.close()
    print(f"✓ Components plot saved to outputs/fill_components_{station_id}.png")

print("\n" + "=" * 60)
print("✅ All fill prediction models trained successfully!")
print("=" * 60)
print("\nNext steps:")
print("1. Check evaluation metrics in models/fill/*_eval.txt")
print("2. View forecast plots in outputs/")
print("3. Download TACO dataset: python data/download_taco.py")
print("4. Train YOLOv8: python models/litter/train.py")
