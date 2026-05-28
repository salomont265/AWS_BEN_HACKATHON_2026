# EnviroGuard - AWS BEN Hackathon 2026

Environmental prediction system combining ML-powered predictions with a mobile app for NYC residents.

## Project Overview

**EnviroGuard** helps NYC residents make informed decisions about their environment by predicting:
- 🔊 **Noise Pollution** (96.7% accuracy)
- 🌸 **Pollen Levels** (88.3% accuracy)
- 🗑️ **Litter Severity** (78.8% accuracy)
- 💨 **Air Quality Index** (73.7% accuracy)

**Status:** 3/4 ML models production-ready | Mobile app in development

---

## Repository Structure

```
AWS_BEN_HACKATHON_2026/
├── enviroguard-ml/          # ML Prediction System (Python)
│   ├── final_outputs/       # Results & Hackathon Summary
│   ├── models/              # 4 trained .pkl models
│   ├── data/                # Training data
│   ├── scripts/             # Python training scripts
│   └── README.md            # ML documentation
│
├── enviroguard/             # Mobile App (React Native)
│   ├── src/                 # App source code
│   ├── assets/              # Images, fonts, etc.
│   └── README.md            # App documentation
│
├── EnviroGuard_PRD.pdf      # Product Requirements
└── EnviroGuard_ML_PRD.pdf   # ML Requirements
```

---

## 🤖 ML System Highlights

**Data Sources:** 186,946 real NYC 311 complaints + EPA AQI + NOAA weather

**Key Achievement:** 3/4 models exceed 75% accuracy target using free public APIs

**Best Model:** Noise prediction at 96.7% accuracy

**Improvements:** 
- Pollen: +37.2% improvement (51% → 88%)
- AQI: +15.5% improvement (58% → 74%)

📖 **[Read Full ML Documentation →](enviroguard-ml/)**

📊 **[View Hackathon Summary →](enviroguard-ml/final_outputs/HACKATHON_SUMMARY.md)**

---

## 📱 Mobile App

React Native app providing:
- 24-hour environmental forecasts
- Personalized alerts (allergies, noise sensitivity)
- Real-time predictions
- Composite risk scores

📖 **[Read App Documentation →](enviroguard/)**

---

## Quick Start

### ML System

```bash
cd enviroguard-ml
pip install -r requirements.txt
python3 -c "from unified_api import EnvironmentalPredictor; print('✅ Ready!')"
```

See [enviroguard-ml/SETUP.md](enviroguard-ml/SETUP.md) for details.

### Mobile App

```bash
cd enviroguard
npm install
npm start
```

See [enviroguard/README.md](enviroguard/README.md) for details.

---

## Model Performance

| Model | Accuracy | Data Source | Status |
|-------|----------|-------------|--------|
| Noise | 96.7% | 186k NYC 311 complaints | ✅ Production |
| Pollen | 88.3% | Synthetic patterns | ✅ Production |
| Litter | 78.8% | 20k NYC 311 complaints | ✅ Production |
| AQI | 73.7% | EPA AirNow (69 days) | ⚠️ Near target |

**Pass Rate:** 3/4 models (75%)

---

## Technologies

**ML Stack:**
- Python 3.9
- Prophet (time-series forecasting)
- Scikit-learn (Gradient Boosting)
- Pandas, NumPy

**Mobile Stack:**
- React Native
- TypeScript
- Expo

**APIs Used:**
- NYC Open Data 311 API
- EPA AirNow API
- Open-Meteo Weather API

---

## Team

AWS BEN Hackathon 2026 Project

---

## Documentation

- **ML System:** [enviroguard-ml/README.md](enviroguard-ml/)
- **Hackathon Summary:** [enviroguard-ml/final_outputs/HACKATHON_SUMMARY.md](enviroguard-ml/final_outputs/HACKATHON_SUMMARY.md)
- **Setup Guide:** [enviroguard-ml/SETUP.md](enviroguard-ml/SETUP.md)
- **Mobile App:** [enviroguard/README.md](enviroguard/)

---

## License

MIT License - See [enviroguard-ml/LICENSE](enviroguard-ml/LICENSE)

Data from public sources:
- NYC Open Data (Public Domain)
- EPA AirNow (Public Domain)
- Open-Meteo (CC BY 4.0)

---

**Built for AWS BEN Hackathon 2026**
