"""
Train Prophet model for Pollen prediction (Community mode)
Uses user-reported severity scores (0-100)
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import pickle
import json
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Load data
df = pd.read_csv('data/pollen_community.csv')
df['ds'] = pd.to_datetime(df['ds'])

# 80/10 split (last 10% for testing)
split_idx = int(len(df) * 0.9)
train = df[:split_idx].copy()
test = df[split_idx:].copy()

print(f"Training on {len(train)} samples, testing on {len(test)} samples")
print(f"Date range: {train['ds'].min()} to {train['ds'].max()}")

# Initialize Prophet
model = Prophet(
    seasonality_mode='multiplicative',
    daily_seasonality=True,
    weekly_seasonality=True,
    yearly_seasonality=True,  # Critical for pollen!
    changepoint_prior_scale=0.05
)

# Fit model
print("\nTraining Pollen Community model...")
model.fit(train[['ds', 'y']])

# Make predictions on test set
forecast = model.predict(test[['ds']])

# Evaluate
mae = mean_absolute_error(test['y'], forecast['yhat'])
rmse = np.sqrt(mean_squared_error(test['y'], forecast['yhat']))

print(f"\n{'='*60}")
print(f"Model Performance:")
print(f"  MAE:  {mae:.2f} severity points")
print(f"  RMSE: {rmse:.2f} severity points")
print(f"{'='*60}")

# Save model
with open('models/pollen/pollen_community_model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("\n✅ Model saved: models/pollen/pollen_community_model.pkl")

# Save metrics
metrics = {
    'mae': float(mae),
    'rmse': float(rmse),
    'train_samples': len(train),
    'test_samples': len(test),
    'mean_severity': float(df['y'].mean()),
    'std_severity': float(df['y'].std())
}

with open('eval/pollen_community_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("✅ Metrics saved: eval/pollen_community_metrics.json")

# Save test predictions
test_results = pd.DataFrame({
    'ds': test['ds'],
    'y_true': test['y'],
    'y_pred': forecast['yhat'],
    'yhat_lower': forecast['yhat_lower'],
    'yhat_upper': forecast['yhat_upper']
})
test_results.to_csv('outputs/pollen_community_predictions.csv', index=False)
print("✅ Test predictions saved: outputs/pollen_community_predictions.csv")
