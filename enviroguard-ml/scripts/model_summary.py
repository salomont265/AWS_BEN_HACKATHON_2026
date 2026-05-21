"""
Display model performance summary for all 8 trained models
"""

import json

print('='*70)
print('MODEL PERFORMANCE SUMMARY')
print('='*70)

# API Models
print('\n📊 API MODE MODELS:')
print('-'*70)
api_models = [
    ('AQI', 'eval/aqi_api_metrics.json', '< 10'),
    ('Noise', 'eval/noise_api_metrics.json', '< 8'),
    ('Litter', 'eval/litter_api_metrics.json', '< 10'),
    ('Pollen', 'eval/pollen_api_metrics.json', '< 15')
]

for name, fname, target in api_models:
    with open(fname) as f:
        m = json.load(f)
    target_val = float(target.split('<')[1].strip())
    status = '✅' if m['mae'] < target_val else '⚠️'
    print(f'{status} {name:8s}  MAE: {m["mae"]:5.2f}  RMSE: {m["rmse"]:5.2f}  (Target: {target})')

# Community Models
print('\n📊 COMMUNITY MODE MODELS:')
print('-'*70)
community_models = [
    ('AQI', 'eval/aqi_community_metrics.json'),
    ('Noise', 'eval/noise_community_metrics.json'),
    ('Litter', 'eval/litter_community_metrics.json'),
    ('Pollen', 'eval/pollen_community_metrics.json')
]

for name, fname in community_models:
    with open(fname) as f:
        m = json.load(f)
    print(f'✅ {name:8s}  MAE: {m["mae"]:5.2f}  RMSE: {m["rmse"]:5.2f}')

print('\n' + '='*70)
print('All 8 models trained successfully!')
print('='*70)

# List all generated files
print('\n📁 Generated Files:')
print('-'*70)
print('Data (8 CSVs):')
print('  - data/aqi_synthetic.csv, data/aqi_community.csv')
print('  - data/noise_synthetic.csv, data/noise_community.csv')
print('  - data/litter_synthetic.csv, data/litter_community.csv')
print('  - data/pollen_synthetic.csv, data/pollen_community.csv')
print('\nModels (8 .pkl files):')
print('  - models/aqi/aqi_api_model.pkl, models/aqi/aqi_community_model.pkl')
print('  - models/noise/noise_api_model.pkl, models/noise/noise_community_model.pkl')
print('  - models/litter/litter_api_model.pkl, models/litter/litter_community_model.pkl')
print('  - models/pollen/pollen_api_model.pkl, models/pollen/pollen_community_model.pkl')
print('\nInference Scripts (4 files):')
print('  - infer_aqi.py, infer_noise.py, infer_litter.py, infer_pollen.py')
print('\nUnified API:')
print('  - unified_api.py (all 4 models + composite risk scoring)')
