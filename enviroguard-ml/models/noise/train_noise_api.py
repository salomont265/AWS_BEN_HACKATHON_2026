"""
Train Prophet model for Noise prediction (API mode)
Uses 311 complaint count as regressor
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import json
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Load data
df = pd.read_csv('data/noise_synthetic.csv')
df['ds'] = pd.to_datetime(df['ds'])

# 80/10 split (last 10% for testing)
split_idx = int(len(df) * 0.9)
train = df[:split_idx].copy()
test = df[split_idx:].copy()

print(f"Training on {len(train)} samples, testing on {len(test)} samples")
print(f"Date range: {train['ds'].min()} to {train['ds'].max()}")

# Initialize Prophet with regressors
model = Prophet(
    seasonality_mode='multiplicative',
    daily_seasonality=True,
    weekly_seasonality=True,
    yearly_seasonality=False,
    changepoint_prior_scale=0.05
)

# Add 311 complaint regressor
model.add_regressor('complaint_count')

# Fit model
print("\nTraining Noise model...")
model.fit(train[['ds', 'y', 'complaint_count']])

# Make predictions on test set
forecast = model.predict(test[['ds', 'complaint_count']])

# Evaluate
mae = mean_absolute_error(test['y'], forecast['yhat'])
rmse = np.sqrt(mean_squared_error(test['y'], forecast['yhat']))

print(f"\n{'='*60}")
print(f"Model Performance:")
print(f"  MAE:  {mae:.2f} dB (target: < 8)")
print(f"  RMSE: {rmse:.2f} dB")
print(f"{'='*60}")

# Save model
with open('models/noise/noise_api_model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("\n✅ Model saved: models/noise/noise_api_model.pkl")

# Save metrics
metrics = {
    'mae': float(mae),
    'rmse': float(rmse),
    'train_samples': len(train),
    'test_samples': len(test),
    'mean_db': float(df['y'].mean()),
    'std_db': float(df['y'].std())
}

with open('eval/noise_api_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("✅ Metrics saved: eval/noise_api_metrics.json")

# Save test predictions for visualization
test_results = pd.DataFrame({
    'ds': test['ds'],
    'y_true': test['y'],
    'y_pred': forecast['yhat'],
    'yhat_lower': forecast['yhat_lower'],
    'yhat_upper': forecast['yhat_upper']
})
test_results.to_csv('outputs/noise_api_predictions.csv', index=False)
print("✅ Test predictions saved: outputs/noise_api_predictions.csv")
