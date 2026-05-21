# Setup Guide

## Prerequisites

- Python 3.9+
- pip package manager
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ml-model
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install prophet scikit-learn pandas numpy matplotlib seaborn requests
```

### 3. Set Up API Keys

#### EPA AirNow API Key (Required for AQI predictions)

1. Register for a free API key at: https://docs.airnowapi.org/account/request/
2. Set the environment variable:

```bash
export EPA_AIRNOW_API_KEY="your-api-key-here"
```

Or create a `.env` file (not tracked in git):

```bash
echo "EPA_AIRNOW_API_KEY=your-api-key-here" > .env
```

#### Other APIs (No key required)

- NYC 311 API: No authentication needed
- Open-Meteo API: No authentication needed

## Usage

### Make Predictions

```python
from unified_api import EnvironmentalPredictor

predictor = EnvironmentalPredictor(mode='api')
predictions = predictor.predict_all(
    hours_ahead=24,
    temperature=22,
    humidity=60,
    wind_speed=10,
    complaint_count=5,
    grass_pollen=20,
    tree_pollen=15,
    weed_pollen=3
)

print(predictions[0])
```

### View Results

Results are in `final_outputs/`:
- `HACKATHON_SUMMARY.md` - Complete project overview
- `FINAL_v3.2_IMPROVED.txt` - Detailed results
- `FINAL_v3.2_improved.png` - Accuracy chart

### Retrain Models

```bash
# Retrain all models
python3 scripts/retrain_all_models_with_accuracy.py

# View metrics
cat eval/noise_api_metrics.json
```

## Project Structure

```
ml-model/
├── final_outputs/      # Results and documentation
├── models/             # Trained .pkl files
├── data/               # Training data (CSVs)
├── eval/               # Accuracy metrics
├── scripts/            # Training scripts
├── docs/               # Additional documentation
└── README.md
```

## Data

Pre-trained models are included in the repository. To fetch fresh data:

### Fetch NYC 311 Data

```bash
python3 scripts/fetch_and_process_noise_data.py
```

### Fetch EPA AQI Data

```bash
# Set your API key first!
export EPA_AIRNOW_API_KEY="your-key"
python3 scripts/fetch_real_aqi_data.py
```

### Fetch Weather Data

```bash
# No API key needed
python3 scripts/fetch_weather_data.py
```

## Model Performance

| Model | Accuracy | Data Source | Status |
|-------|----------|-------------|--------|
| Noise | 96.7% | 186k NYC 311 complaints | ✅ Production |
| Pollen | 88.3% | Synthetic patterns | ✅ Production |
| Litter | 78.8% | 20k NYC 311 complaints | ✅ Production |
| AQI | 73.7% | 69 days EPA data | ⚠️ Near target |

## Troubleshooting

### Import Errors

```bash
pip install --upgrade prophet scikit-learn pandas
```

### API Rate Limits

- NYC 311: No limits
- EPA AirNow: 500 requests/hour
- Open-Meteo: 10,000 requests/day

### Missing Data Files

Pre-trained models are included. If you need to retrain:

```bash
python3 scripts/retrain_all_models_with_accuracy.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Contact

For questions or issues, please open a GitHub issue.

## Acknowledgments

- NYC Open Data Portal (311 API)
- EPA AirNow API
- Open-Meteo Weather API
- Facebook Prophet library
- Scikit-learn library
