"""
Unified Environmental Prediction API
Combines AQI, Noise, Litter, and Pollen predictions with composite risk scoring
"""

import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List

class EnvironmentalPredictor:
    """
    Unified predictor for all 4 environmental categories
    Supports both API and Community modes
    """

    def __init__(self, mode='api'):
        """
        Initialize predictor

        Args:
            mode: 'api' or 'community'
        """
        self.mode = mode
        self.models = {}
        self._load_models()

    def _load_models(self):
        """Load all trained models"""
        categories = ['aqi', 'noise', 'litter', 'pollen']
        for cat in categories:
            model_path = f'models/{cat}/{cat}_{self.mode}_model.pkl'
            with open(model_path, 'rb') as f:
                self.models[cat] = pickle.load(f)
        print(f"✅ Loaded {len(self.models)} {self.mode.upper()} models")

    def predict_all(self, hours_ahead=24, **kwargs):
        """
        Generate predictions for all 4 categories

        Args:
            hours_ahead: Number of hours to forecast
            **kwargs: Additional parameters for API mode
                - temperature (F)
                - humidity (%)
                - wind_speed (mph)
                - complaint_count (311 complaints)
                - grass_pollen, tree_pollen, weed_pollen

        Returns:
            Dictionary with predictions for each category
        """
        now = datetime.now()
        future_dates = [now + timedelta(hours=i) for i in range(hours_ahead)]

        results = {}

        # AQI Prediction
        if self.mode == 'api':
            aqi_future = pd.DataFrame({
                'ds': future_dates,
                'temperature': kwargs.get('temperature', 65),
                'humidity': kwargs.get('humidity', 50),
                'wind_speed': kwargs.get('wind_speed', 5)
            })
        else:
            aqi_future = pd.DataFrame({'ds': future_dates})

        aqi_forecast = self.models['aqi'].predict(aqi_future)
        results['aqi'] = {
            'timestamp': aqi_forecast['ds'].tolist(),
            'prediction': aqi_forecast['yhat'].clip(0, 200 if self.mode == 'api' else 100).tolist(),
            'lower': aqi_forecast['yhat_lower'].clip(0, 200 if self.mode == 'api' else 100).tolist(),
            'upper': aqi_forecast['yhat_upper'].clip(0, 200 if self.mode == 'api' else 100).tolist()
        }

        # Noise Prediction
        if self.mode == 'api':
            noise_future = pd.DataFrame({
                'ds': future_dates,
                'complaint_count': kwargs.get('complaint_count', 3)
            })
        else:
            noise_future = pd.DataFrame({'ds': future_dates})

        noise_forecast = self.models['noise'].predict(noise_future)
        results['noise'] = {
            'timestamp': noise_forecast['ds'].tolist(),
            'prediction': noise_forecast['yhat'].clip(30 if self.mode == 'api' else 0, 100).tolist(),
            'lower': noise_forecast['yhat_lower'].clip(30 if self.mode == 'api' else 0, 100).tolist(),
            'upper': noise_forecast['yhat_upper'].clip(30 if self.mode == 'api' else 0, 100).tolist()
        }

        # Litter Prediction
        if self.mode == 'api':
            litter_future = pd.DataFrame({
                'ds': future_dates,
                'day_of_week': [d.weekday() for d in future_dates]
            })
        else:
            litter_future = pd.DataFrame({'ds': future_dates})

        litter_forecast = self.models['litter'].predict(litter_future)
        results['litter'] = {
            'timestamp': litter_forecast['ds'].tolist(),
            'prediction': litter_forecast['yhat'].clip(0, 100).tolist(),
            'lower': litter_forecast['yhat_lower'].clip(0, 100).tolist(),
            'upper': litter_forecast['yhat_upper'].clip(0, 100).tolist()
        }

        # Pollen Prediction
        if self.mode == 'api':
            pollen_future = pd.DataFrame({
                'ds': future_dates,
                'temperature': kwargs.get('temperature', 60),
                'grass_pollen': kwargs.get('grass_pollen', 20),
                'tree_pollen': kwargs.get('tree_pollen', 15),
                'weed_pollen': kwargs.get('weed_pollen', 10)
            })
        else:
            pollen_future = pd.DataFrame({'ds': future_dates})

        pollen_forecast = self.models['pollen'].predict(pollen_future)
        results['pollen'] = {
            'timestamp': pollen_forecast['ds'].tolist(),
            'prediction': pollen_forecast['yhat'].clip(0, 100).tolist(),
            'lower': pollen_forecast['yhat_lower'].clip(0, 100).tolist(),
            'upper': pollen_forecast['yhat_upper'].clip(0, 100).tolist()
        }

        return results

    def compute_composite_risk(self, predictions: Dict) -> List[Dict]:
        """
        Compute composite environmental risk score

        Combines all 4 categories into a single 0-100 risk score:
        - AQI: 30% weight
        - Noise: 25% weight
        - Litter: 20% weight
        - Pollen: 25% weight

        Args:
            predictions: Output from predict_all()

        Returns:
            List of dicts with timestamp and composite_risk
        """
        hours = len(predictions['aqi']['prediction'])
        composite_scores = []

        for i in range(hours):
            # Normalize all to 0-100 scale
            if self.mode == 'api':
                aqi_normalized = (predictions['aqi']['prediction'][i] / 200) * 100
                noise_normalized = ((predictions['noise']['prediction'][i] - 30) / 70) * 100
            else:
                aqi_normalized = predictions['aqi']['prediction'][i]
                noise_normalized = predictions['noise']['prediction'][i]

            litter_normalized = predictions['litter']['prediction'][i]
            pollen_normalized = predictions['pollen']['prediction'][i]

            # Weighted composite
            composite = (
                0.30 * aqi_normalized +
                0.25 * noise_normalized +
                0.20 * litter_normalized +
                0.25 * pollen_normalized
            )

            composite_scores.append({
                'timestamp': predictions['aqi']['timestamp'][i],
                'composite_risk': round(composite, 2),
                'risk_level': self._risk_level(composite)
            })

        return composite_scores

    def _risk_level(self, score):
        """Convert numeric score to categorical risk level"""
        if score < 25:
            return 'Low'
        elif score < 50:
            return 'Moderate'
        elif score < 75:
            return 'High'
        else:
            return 'Very High'


if __name__ == "__main__":
    # Demo: API Mode
    print("="*70)
    print("ENVIRONMENTAL PREDICTION - API MODE")
    print("="*70)

    predictor_api = EnvironmentalPredictor(mode='api')
    predictions_api = predictor_api.predict_all(
        hours_ahead=24,
        temperature=68,
        humidity=55,
        wind_speed=6,
        complaint_count=4,
        grass_pollen=25,
        tree_pollen=10,
        weed_pollen=5
    )

    composite_api = predictor_api.compute_composite_risk(predictions_api)

    print("\nNext 10 hours - Composite Risk Scores:")
    for i in range(10):
        ts = composite_api[i]['timestamp']
        risk = composite_api[i]['composite_risk']
        level = composite_api[i]['risk_level']
        print(f"  {ts}: {risk:.1f} ({level})")

    print(f"\n24-hour Average Risk: {np.mean([c['composite_risk'] for c in composite_api]):.1f}")

    # Demo: Community Mode
    print("\n" + "="*70)
    print("ENVIRONMENTAL PREDICTION - COMMUNITY MODE")
    print("="*70)

    predictor_community = EnvironmentalPredictor(mode='community')
    predictions_community = predictor_community.predict_all(hours_ahead=24)
    composite_community = predictor_community.compute_composite_risk(predictions_community)

    print("\nNext 10 hours - Composite Risk Scores:")
    for i in range(10):
        ts = composite_community[i]['timestamp']
        risk = composite_community[i]['composite_risk']
        level = composite_community[i]['risk_level']
        print(f"  {ts}: {risk:.1f} ({level})")

    print(f"\n24-hour Average Risk: {np.mean([c['composite_risk'] for c in composite_community]):.1f}")
