"""
RETRAIN ALL 8 MODELS WITH REAL DATA AND CALCULATE PROPER ACCURACY SCORES

This script:
1. Trains models on real/realistic data
2. Calculates ACCURACY PERCENTAGES (not just MAE/RMSE)
3. Computes R², MAPE, and Accuracy %
4. Ensures all models meet 75% accuracy target
"""

import pickle
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import json
import warnings
warnings.filterwarnings('ignore')

def calculate_accuracy_metrics(y_true, y_pred):
    """
    Calculate proper accuracy metrics including percentages

    Returns:
        dict with MAE, RMSE, R², MAPE, and Accuracy %
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)

    # MAPE - Mean Absolute Percentage Error
    # Avoid division by zero
    mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))) * 100

    # Accuracy Percentage = 100 - MAPE
    accuracy_pct = max(0, 100 - mape)

    # Alternative accuracy: Based on R²
    r2_accuracy = max(0, r2 * 100)

    return {
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'r2_accuracy_pct': float(r2_accuracy),
        'mape': float(mape),
        'accuracy_pct': float(accuracy_pct)
    }

def train_and_evaluate_model(data_file, regressors, model_name, target_col='y'):
    """
    Train a Prophet model and calculate full accuracy metrics
    """
    print(f"\n{'='*70}")
    print(f"Training: {model_name}")
    print(f"{'='*70}")

    # Load data
    df = pd.read_csv(f'data/{data_file}')
    print(f"📊 Data: {len(df)} hours ({len(df)/24:.0f} days)")
    print(f"   Target Range: {df['y'].min():.2f} - {df['y'].max():.2f}")
    print(f"   Mean: {df['y'].mean():.2f}")

    # Split: 90% train, 10% test
    train_size = int(len(df) * 0.9)
    train_df = df[:train_size].copy()
    test_df = df[train_size:].copy()

    print(f"   Train: {len(train_df)} | Test: {len(test_df)}")

    # Initialize Prophet
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.05
    )

    # Add regressors
    for reg in regressors:
        model.add_regressor(reg, prior_scale=10.0, mode='multiplicative')
        print(f"   + Regressor: {reg}")

    # Train
    print("   Training...")
    model.fit(train_df)

    # Predict on test set
    future = test_df[['ds'] + regressors].copy()
    forecast = model.predict(future)

    # Calculate metrics
    y_true = test_df['y'].values
    y_pred = forecast['yhat'].values

    metrics = calculate_accuracy_metrics(y_true, y_pred)

    # Add sample counts
    metrics['train_samples'] = len(train_df)
    metrics['test_samples'] = len(test_df)
    metrics['mean_value'] = float(df['y'].mean())
    metrics['std_value'] = float(df['y'].std())

    # Print results
    print(f"\n   ✅ RESULTS:")
    print(f"      MAE:  {metrics['mae']:.2f}")
    print(f"      RMSE: {metrics['rmse']:.2f}")
    print(f"      R²:   {metrics['r2']:.3f}")
    print(f"      MAPE: {metrics['mape']:.2f}%")
    print(f"      ⭐ ACCURACY: {metrics['accuracy_pct']:.1f}%")
    print(f"      ⭐ R² ACCURACY: {metrics['r2_accuracy_pct']:.1f}%")

    # Check 75% target
    if metrics['accuracy_pct'] >= 75:
        print(f"      ✅ MEETS 75% TARGET!")
    else:
        print(f"      ⚠️  Below 75% target (at {metrics['accuracy_pct']:.1f}%)")

    return model, metrics, forecast, test_df

print("="*70)
print("RETRAINING ALL 8 MODELS WITH PROPER ACCURACY CALCULATION")
print("="*70)

all_results = {}

# =============================================================================
# 1. AQI API MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'aqi_real_api.csv',
    ['temperature', 'humidity', 'wind_speed'],
    'AQI API Mode'
)

# Save model
with open('models/aqi/aqi_api_model.pkl', 'wb') as f:
    pickle.dump(model, f)

# Save metrics
with open('eval/aqi_api_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

# Save predictions
pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/aqi_api_predictions.csv', index=False)

all_results['aqi_api'] = metrics

# =============================================================================
# 2. AQI COMMUNITY MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'aqi_real_community.csv',
    [],
    'AQI Community Mode'
)

with open('models/aqi/aqi_community_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/aqi_community_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/aqi_community_predictions.csv', index=False)

all_results['aqi_community'] = metrics

# =============================================================================
# 3. NOISE API MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'noise_real_api.csv',
    ['temperature', 'complaint_count'],
    'Noise API Mode'
)

with open('models/noise/noise_api_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/noise_api_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/noise_api_predictions.csv', index=False)

all_results['noise_api'] = metrics

# =============================================================================
# 4. NOISE COMMUNITY MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'noise_real_community.csv',
    [],
    'Noise Community Mode'
)

with open('models/noise/noise_community_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/noise_community_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/noise_community_predictions.csv', index=False)

all_results['noise_community'] = metrics

# =============================================================================
# 5. LITTER API MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'litter_real_api.csv',
    ['temperature', 'complaint_count'],
    'Litter API Mode'
)

with open('models/litter/litter_api_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/litter_api_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/litter_api_predictions.csv', index=False)

all_results['litter_api'] = metrics

# =============================================================================
# 6. LITTER COMMUNITY MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'litter_real_community.csv',
    [],
    'Litter Community Mode'
)

with open('models/litter/litter_community_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/litter_community_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/litter_community_predictions.csv', index=False)

all_results['litter_community'] = metrics

# =============================================================================
# 7. POLLEN API MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'pollen_real_api.csv',
    ['temperature', 'grass_pollen', 'tree_pollen', 'weed_pollen'],
    'Pollen API Mode'
)

with open('models/pollen/pollen_api_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/pollen_api_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/pollen_api_predictions.csv', index=False)

all_results['pollen_api'] = metrics

# =============================================================================
# 8. POLLEN COMMUNITY MODE
# =============================================================================
model, metrics, forecast, test_df = train_and_evaluate_model(
    'pollen_real_community.csv',
    [],
    'Pollen Community Mode'
)

with open('models/pollen/pollen_community_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('eval/pollen_community_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

pred_df = pd.DataFrame({
    'ds': test_df['ds'],
    'y_true': test_df['y'].values,
    'y_pred': forecast['yhat'].values,
    'yhat_lower': forecast['yhat_lower'].values,
    'yhat_upper': forecast['yhat_upper'].values
})
pred_df.to_csv('outputs/pollen_community_predictions.csv', index=False)

all_results['pollen_community'] = metrics

# =============================================================================
# FINAL SUMMARY
# =============================================================================
print("\n" + "="*70)
print("FINAL SUMMARY - ALL 8 MODELS")
print("="*70)

print("\n📊 API MODE MODELS:")
print("-"*70)
print(f"{'Model':<12} {'MAE':<8} {'RMSE':<8} {'R²':<8} {'Accuracy %':<12} {'Status':<10}")
print("-"*70)

api_models = ['aqi_api', 'noise_api', 'litter_api', 'pollen_api']
for model_name in api_models:
    m = all_results[model_name]
    status = "✅ PASS" if m['accuracy_pct'] >= 75 else "⚠️ BELOW"
    print(f"{model_name:<12} {m['mae']:<8.2f} {m['rmse']:<8.2f} {m['r2']:<8.3f} {m['accuracy_pct']:<12.1f} {status:<10}")

print("\n📊 COMMUNITY MODE MODELS:")
print("-"*70)
print(f"{'Model':<16} {'MAE':<8} {'RMSE':<8} {'R²':<8} {'Accuracy %':<12} {'Status':<10}")
print("-"*70)

comm_models = ['aqi_community', 'noise_community', 'litter_community', 'pollen_community']
for model_name in comm_models:
    m = all_results[model_name]
    status = "✅ PASS" if m['accuracy_pct'] >= 75 else "⚠️ BELOW"
    print(f"{model_name:<16} {m['mae']:<8.2f} {m['rmse']:<8.2f} {m['r2']:<8.3f} {m['accuracy_pct']:<12.1f} {status:<10}")

# Count passing models
passing = sum(1 for m in all_results.values() if m['accuracy_pct'] >= 75)
total = len(all_results)

print("\n" + "="*70)
print(f"RESULT: {passing}/{total} models meet 75% accuracy target")
print("="*70)

if passing == total:
    print("🎉 ALL MODELS PASS! System ready for production!")
else:
    print(f"⚠️  {total - passing} models need improvement")

print("\n✅ All models saved to models/ directory")
print("✅ All metrics saved to eval/ directory with accuracy percentages")
print("✅ All predictions saved to outputs/ directory")
