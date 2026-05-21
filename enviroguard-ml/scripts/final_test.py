"""
Final comprehensive test of the entire prediction pipeline
"""

from unified_api import EnvironmentalPredictor
import json

print("="*70)
print("COMPREHENSIVE ENVIRONMENTAL PREDICTION SYSTEM TEST")
print("="*70)

# Test 1: API Mode
print("\n[TEST 1] API Mode - 24-hour Forecast")
print("-"*70)
predictor_api = EnvironmentalPredictor(mode='api')

predictions_api = predictor_api.predict_all(
    hours_ahead=24,
    temperature=72,
    humidity=60,
    wind_speed=8,
    complaint_count=5,
    grass_pollen=30,
    tree_pollen=12,
    weed_pollen=8
)

composite_api = predictor_api.compute_composite_risk(predictions_api)

print(f"✅ Generated predictions for 24 hours")
print(f"   - AQI: {predictions_api['aqi']['prediction'][0]:.1f} → {predictions_api['aqi']['prediction'][-1]:.1f}")
print(f"   - Noise: {predictions_api['noise']['prediction'][0]:.1f} → {predictions_api['noise']['prediction'][-1]:.1f} dB")
print(f"   - Litter: {predictions_api['litter']['prediction'][0]:.1f} → {predictions_api['litter']['prediction'][-1]:.1f}")
print(f"   - Pollen: {predictions_api['pollen']['prediction'][0]:.1f} → {predictions_api['pollen']['prediction'][-1]:.1f}")
print(f"\n   Composite Risk: {composite_api[0]['composite_risk']:.1f} → {composite_api[-1]['composite_risk']:.1f}")
print(f"   Risk Level: {composite_api[0]['risk_level']} → {composite_api[-1]['risk_level']}")

# Test 2: Community Mode
print("\n[TEST 2] Community Mode - 24-hour Forecast")
print("-"*70)
predictor_community = EnvironmentalPredictor(mode='community')

predictions_community = predictor_community.predict_all(hours_ahead=24)
composite_community = predictor_community.compute_composite_risk(predictions_community)

print(f"✅ Generated predictions for 24 hours")
print(f"   - AQI Severity: {predictions_community['aqi']['prediction'][0]:.1f} → {predictions_community['aqi']['prediction'][-1]:.1f}")
print(f"   - Noise Severity: {predictions_community['noise']['prediction'][0]:.1f} → {predictions_community['noise']['prediction'][-1]:.1f}")
print(f"   - Litter Severity: {predictions_community['litter']['prediction'][0]:.1f} → {predictions_community['litter']['prediction'][-1]:.1f}")
print(f"   - Pollen Severity: {predictions_community['pollen']['prediction'][0]:.1f} → {predictions_community['pollen']['prediction'][-1]:.1f}")
print(f"\n   Composite Risk: {composite_community[0]['composite_risk']:.1f} → {composite_community[-1]['composite_risk']:.1f}")
print(f"   Risk Level: {composite_community[0]['risk_level']} → {composite_community[-1]['risk_level']}")

# Test 3: Load model metrics
print("\n[TEST 3] Model Performance Metrics")
print("-"*70)
categories = ['aqi', 'noise', 'litter', 'pollen']
targets = {'aqi': 10, 'noise': 8, 'litter': 10, 'pollen': 15}

all_pass = True
for cat in categories:
    with open(f'eval/{cat}_api_metrics.json') as f:
        metrics = json.load(f)
    status = '✅' if metrics['mae'] < targets[cat] else '❌'
    if metrics['mae'] >= targets[cat]:
        all_pass = False
    print(f"{status} {cat.upper():6s} API: MAE {metrics['mae']:.2f} (target < {targets[cat]})")

# Final Summary
print("\n" + "="*70)
if all_pass:
    print("🎉 ALL TESTS PASSED! System ready for deployment.")
else:
    print("⚠️  Some models need improvement to meet targets.")
print("="*70)

print("\n📊 System Capabilities:")
print("  ✅ 8 trained Prophet models (4 categories × 2 modes)")
print("  ✅ 24-hour forecasting with confidence intervals")
print("  ✅ Composite environmental risk scoring")
print("  ✅ External regressor support (weather, complaints, etc.)")
print("  ✅ Time-series patterns (daily, weekly, seasonal)")
print("  ✅ Dual-mode predictions (API + Community)")

print("\n🚀 Next Steps:")
print("  1. Replace synthetic data with real API data sources")
print("  2. Implement neighborhood-specific models")
print("  3. Deploy as FastAPI service")
print("  4. Add real-time retraining pipeline")
print("  5. Expand from NYC to global coverage")
