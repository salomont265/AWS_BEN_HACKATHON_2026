"""
Visualize model predictions for all 4 categories
Creates simple ASCII plots for quick visualization
"""

import pandas as pd
import numpy as np

def ascii_plot(values, title, width=60, height=10):
    """Create simple ASCII line plot"""
    print(f"\n{title}")
    print("=" * width)

    values = np.array(values)
    min_val, max_val = values.min(), values.max()

    # Normalize to plot height
    if max_val > min_val:
        normalized = ((values - min_val) / (max_val - min_val) * (height - 1)).astype(int)
    else:
        normalized = np.zeros(len(values), dtype=int)

    # Build plot from top to bottom
    for row in range(height - 1, -1, -1):
        line = []
        for val in normalized[:width]:
            line.append('█' if val >= row else ' ')

        # Add y-axis label
        y_val = min_val + (max_val - min_val) * row / (height - 1)
        print(f"{y_val:6.1f} |{''.join(line)}")

    print("       " + "-" * width)
    print(f"       Min: {min_val:.1f}  Max: {max_val:.1f}  Mean: {values.mean():.1f}")

def load_and_plot_predictions():
    """Load test predictions and create visualizations"""

    print("=" * 70)
    print("MODEL PREDICTIONS VISUALIZATION (Test Set)")
    print("=" * 70)

    # AQI API
    aqi_api = pd.read_csv('outputs/aqi_api_predictions.csv')
    ascii_plot(aqi_api['y_pred'][:60], "AQI Predictions (API Mode) - First 60 hours")

    # Noise API
    noise_api = pd.read_csv('outputs/noise_api_predictions.csv')
    ascii_plot(noise_api['y_pred'][:60], "Noise Predictions (API Mode) - First 60 hours (dB)")

    # Litter API
    litter_api = pd.read_csv('outputs/litter_api_predictions.csv')
    ascii_plot(litter_api['y_pred'][:60], "Litter Predictions (API Mode) - First 60 hours (severity)")

    # Pollen API
    pollen_api = pd.read_csv('outputs/pollen_api_predictions.csv')
    ascii_plot(pollen_api['y_pred'][:60], "Pollen Predictions (API Mode) - First 60 hours (index)")

    print("\n" + "=" * 70)
    print("PREDICTION vs ACTUAL COMPARISON")
    print("=" * 70)

    categories = [
        ('AQI', aqi_api),
        ('Noise', noise_api),
        ('Litter', litter_api),
        ('Pollen', pollen_api)
    ]

    for name, df in categories:
        mae = np.abs(df['y_true'] - df['y_pred']).mean()
        correlation = np.corrcoef(df['y_true'], df['y_pred'])[0, 1]
        print(f"\n{name:8s}  MAE: {mae:5.2f}  Correlation: {correlation:.3f}")

if __name__ == "__main__":
    load_and_plot_predictions()
