"""
Enhanced Model Accuracy Visualization
Creates comprehensive graphs showing model performance metrics
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import os

# Set style for better-looking plots
plt.style.use('seaborn-v0_8-darkgrid')

def load_metrics():
    """Load all model metrics from eval directory"""
    categories = ['aqi', 'noise', 'litter', 'pollen']
    modes = ['api', 'community']

    metrics = {}
    for cat in categories:
        metrics[cat] = {}
        for mode in modes:
            filepath = f'eval/{cat}_{mode}_metrics.json'
            with open(filepath) as f:
                metrics[cat][mode] = json.load(f)

    return metrics

def plot_mae_comparison(metrics, save_path='outputs/mae_comparison.png'):
    """Plot MAE comparison across all models"""
    categories = ['AQI', 'Noise', 'Litter', 'Pollen']
    api_mae = [metrics[cat.lower()]['api']['mae'] for cat in categories]
    community_mae = [metrics[cat.lower()]['community']['mae'] for cat in categories]

    # Define targets for API models
    targets = [10, 8, 10, 15]  # AQI, Noise, Litter, Pollen

    x = np.arange(len(categories))
    width = 0.25

    fig, ax = plt.subplots(figsize=(12, 6))

    bars1 = ax.bar(x - width, api_mae, width, label='API Mode', color='#3498db', alpha=0.8)
    bars2 = ax.bar(x, community_mae, width, label='Community Mode', color='#e74c3c', alpha=0.8)
    bars3 = ax.bar(x + width, targets, width, label='Target (API)', color='#2ecc71', alpha=0.5)

    ax.set_xlabel('Model Category', fontsize=12, fontweight='bold')
    ax.set_ylabel('Mean Absolute Error (MAE)', fontsize=12, fontweight='bold')
    ax.set_title('Model Performance: MAE Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend(fontsize=10)
    ax.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}',
                   ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {save_path}")
    return fig

def plot_rmse_comparison(metrics, save_path='outputs/rmse_comparison.png'):
    """Plot RMSE comparison across all models"""
    categories = ['AQI', 'Noise', 'Litter', 'Pollen']
    api_rmse = [metrics[cat.lower()]['api']['rmse'] for cat in categories]
    community_rmse = [metrics[cat.lower()]['community']['rmse'] for cat in categories]

    x = np.arange(len(categories))
    width = 0.35

    fig, ax = plt.subplots(figsize=(12, 6))

    bars1 = ax.bar(x - width/2, api_rmse, width, label='API Mode', color='#9b59b6', alpha=0.8)
    bars2 = ax.bar(x + width/2, community_rmse, width, label='Community Mode', color='#f39c12', alpha=0.8)

    ax.set_xlabel('Model Category', fontsize=12, fontweight='bold')
    ax.set_ylabel('Root Mean Squared Error (RMSE)', fontsize=12, fontweight='bold')
    ax.set_title('Model Performance: RMSE Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend(fontsize=10)
    ax.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}',
                   ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {save_path}")
    return fig

def plot_predictions_vs_actual(category, mode, save_path=None):
    """Plot predicted vs actual values for a specific model"""
    df = pd.read_csv(f'outputs/{category}_{mode}_predictions.csv')

    if save_path is None:
        save_path = f'outputs/{category}_{mode}_pred_vs_actual.png'

    # Check if we have actual test data
    if df['y_true'].isna().all():
        # Just plot predictions with confidence intervals
        fig, ax1 = plt.subplots(1, 1, figsize=(14, 5))

        sample_size = min(200, len(df))
        predictions = df['y_pred'][:sample_size]

        ax1.plot(predictions, label='Predicted', color='#e74c3c', linewidth=2, alpha=0.7)

        # Add confidence intervals if available
        if 'yhat_lower' in df.columns and 'yhat_upper' in df.columns:
            ax1.fill_between(range(sample_size),
                            df['yhat_lower'][:sample_size],
                            df['yhat_upper'][:sample_size],
                            alpha=0.2, color='#3498db', label='Confidence Interval')

        ax1.set_xlabel('Time (hours)', fontsize=11)
        ax1.set_ylabel(f'{category.upper()} Value', fontsize=11)
        ax1.set_title(f'{category.upper()} {mode.capitalize()}: Predictions with Confidence Intervals',
                     fontsize=12, fontweight='bold')
        ax1.legend()
        ax1.grid(alpha=0.3)

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {save_path}")
        return fig
    else:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        # Subplot 1: Time series
        sample_size = min(200, len(df))
        ax1.plot(df['y_true'][:sample_size], label='Actual', color='#2c3e50', linewidth=2, alpha=0.7)
        ax1.plot(df['y_pred'][:sample_size], label='Predicted', color='#e74c3c', linewidth=2, alpha=0.7)
        ax1.set_xlabel('Time (hours)', fontsize=11)
        ax1.set_ylabel(f'{category.upper()} Value', fontsize=11)
        ax1.set_title(f'{category.upper()} {mode.capitalize()}: Predictions vs Actual', fontsize=12, fontweight='bold')
        ax1.legend()
        ax1.grid(alpha=0.3)

        # Subplot 2: Scatter plot
        ax2.scatter(df['y_true'], df['y_pred'], alpha=0.5, color='#3498db', s=20)

        # Perfect prediction line
        min_val = min(df['y_true'].min(), df['y_pred'].min())
        max_val = max(df['y_true'].max(), df['y_pred'].max())
        ax2.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Perfect Prediction')

        ax2.set_xlabel('Actual Value', fontsize=11)
        ax2.set_ylabel('Predicted Value', fontsize=11)
        ax2.set_title('Scatter: Predicted vs Actual', fontsize=12, fontweight='bold')
        ax2.legend()
        ax2.grid(alpha=0.3)

        # Add correlation coefficient
        correlation = np.corrcoef(df['y_true'], df['y_pred'])[0, 1]
        mae = np.abs(df['y_true'] - df['y_pred']).mean()
        ax2.text(0.05, 0.95, f'Correlation: {correlation:.3f}\nMAE: {mae:.2f}',
                 transform=ax2.transAxes, fontsize=10,
                 verticalalignment='top',
                 bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {save_path}")
        return fig

def plot_all_models_grid(save_path='outputs/all_models_accuracy.png'):
    """Create a 4x2 grid showing all 8 models"""
    categories = ['aqi', 'noise', 'litter', 'pollen']
    modes = ['api', 'community']

    fig, axes = plt.subplots(4, 2, figsize=(14, 16))

    # Load metrics for MAE
    with open('eval/aqi_api_metrics.json') as f:
        aqi_api_metrics = json.load(f)
    with open('eval/noise_api_metrics.json') as f:
        noise_api_metrics = json.load(f)
    with open('eval/litter_api_metrics.json') as f:
        litter_api_metrics = json.load(f)
    with open('eval/pollen_api_metrics.json') as f:
        pollen_api_metrics = json.load(f)
    with open('eval/aqi_community_metrics.json') as f:
        aqi_comm_metrics = json.load(f)
    with open('eval/noise_community_metrics.json') as f:
        noise_comm_metrics = json.load(f)
    with open('eval/litter_community_metrics.json') as f:
        litter_comm_metrics = json.load(f)
    with open('eval/pollen_community_metrics.json') as f:
        pollen_comm_metrics = json.load(f)

    metrics_map = {
        ('aqi', 'api'): aqi_api_metrics,
        ('noise', 'api'): noise_api_metrics,
        ('litter', 'api'): litter_api_metrics,
        ('pollen', 'api'): pollen_api_metrics,
        ('aqi', 'community'): aqi_comm_metrics,
        ('noise', 'community'): noise_comm_metrics,
        ('litter', 'community'): litter_comm_metrics,
        ('pollen', 'community'): pollen_comm_metrics,
    }

    for i, cat in enumerate(categories):
        for j, mode in enumerate(modes):
            ax = axes[i, j]
            df = pd.read_csv(f'outputs/{cat}_{mode}_predictions.csv')

            sample_size = min(150, len(df))
            predictions = df['y_pred'][:sample_size]

            ax.plot(predictions, label='Predicted', color='#e74c3c', linewidth=1.5, alpha=0.7)

            # Add confidence intervals
            if 'yhat_lower' in df.columns and 'yhat_upper' in df.columns:
                ax.fill_between(range(sample_size),
                               df['yhat_lower'][:sample_size],
                               df['yhat_upper'][:sample_size],
                               alpha=0.2, color='#3498db', label='95% CI')

            metrics = metrics_map[(cat, mode)]
            mae = metrics['mae']
            rmse = metrics['rmse']

            ax.set_title(f'{cat.upper()} ({mode.capitalize()}) - MAE: {mae:.2f}', fontsize=10, fontweight='bold')
            ax.set_xlabel('Time (hours)', fontsize=9)
            ax.set_ylabel('Value', fontsize=9)
            ax.legend(fontsize=7, loc='best')
            ax.grid(alpha=0.3)

            # Add RMSE in corner
            ax.text(0.02, 0.98, f'RMSE={rmse:.2f}',
                   transform=ax.transAxes, fontsize=8,
                   verticalalignment='top',
                   bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.3))

    plt.suptitle('All 8 Models: Predictions with Confidence Intervals', fontsize=16, fontweight='bold', y=0.995)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {save_path}")
    return fig

def plot_error_distribution(save_path='outputs/error_distribution.png'):
    """Plot error distribution for all API models"""
    categories = ['aqi', 'noise', 'litter', 'pollen']

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.flatten()

    for i, cat in enumerate(categories):
        df = pd.read_csv(f'outputs/{cat}_api_predictions.csv')

        # Check if we have actual test data
        if df['y_true'].isna().all() or df['y_pred'].isna().all():
            # Show prediction distribution instead
            predictions = df['y_pred'].dropna()

            ax = axes[i]
            ax.hist(predictions, bins=50, color='#3498db', alpha=0.7, edgecolor='black')

            mean_pred = predictions.mean()
            std_pred = predictions.std()

            ax.set_xlabel('Predicted Value', fontsize=11)
            ax.set_ylabel('Frequency', fontsize=11)
            ax.set_title(f'{cat.upper()} API - Prediction Distribution', fontsize=12, fontweight='bold')
            ax.grid(alpha=0.3)

            # Add statistics
            ax.text(0.02, 0.98, f'Mean: {mean_pred:.2f}\nStd: {std_pred:.2f}\nCount: {len(predictions)}',
                   transform=ax.transAxes, fontsize=9,
                   verticalalignment='top',
                   bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        else:
            errors = df['y_true'] - df['y_pred']
            errors = errors.dropna()

            ax = axes[i]
            ax.hist(errors, bins=50, color='#3498db', alpha=0.7, edgecolor='black')
            ax.axvline(0, color='red', linestyle='--', linewidth=2, label='Zero Error')

            mean_error = errors.mean()
            std_error = errors.std()

            ax.set_xlabel('Prediction Error', fontsize=11)
            ax.set_ylabel('Frequency', fontsize=11)
            ax.set_title(f'{cat.upper()} API - Error Distribution', fontsize=12, fontweight='bold')
            ax.legend()
            ax.grid(alpha=0.3)

            # Add statistics
            ax.text(0.02, 0.98, f'Mean: {mean_error:.2f}\nStd: {std_error:.2f}',
                   transform=ax.transAxes, fontsize=9,
                   verticalalignment='top',
                   bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    plt.suptitle('Prediction Distribution (API Models)', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {save_path}")
    return fig

def generate_performance_report():
    """Generate comprehensive performance report"""
    print("="*70)
    print("GENERATING MODEL ACCURACY VISUALIZATIONS")
    print("="*70)

    # Load metrics
    print("\n📊 Loading model metrics...")
    metrics = load_metrics()

    # Create visualizations
    print("\n🎨 Creating visualizations...")
    print("\n1. MAE Comparison Chart")
    plot_mae_comparison(metrics)

    print("\n2. RMSE Comparison Chart")
    plot_rmse_comparison(metrics)

    print("\n3. All Models Grid View")
    plot_all_models_grid()

    print("\n4. Error Distribution Analysis")
    plot_error_distribution()

    print("\n5. Individual Model Detailed Views")
    categories = ['aqi', 'noise', 'litter', 'pollen']
    for cat in categories:
        plot_predictions_vs_actual(cat, 'api')
        plot_predictions_vs_actual(cat, 'community')

    print("\n" + "="*70)
    print("📈 PERFORMANCE SUMMARY")
    print("="*70)

    # Print detailed metrics
    print("\n🎯 API Mode Performance:")
    print("-"*70)
    targets = {'aqi': 10, 'noise': 8, 'litter': 10, 'pollen': 15}

    for cat in categories:
        mae = metrics[cat]['api']['mae']
        rmse = metrics[cat]['api']['rmse']
        target = targets[cat]
        status = '✅ PASS' if mae < target else '❌ FAIL'

        train_samples = metrics[cat]['api']['train_samples']
        test_samples = metrics[cat]['api']['test_samples']

        print(f"{status} {cat.upper():8s}  MAE: {mae:6.2f} (target < {target:2d})  "
              f"RMSE: {rmse:6.2f}  Train: {train_samples}  Test: {test_samples}")

    print("\n🌐 Community Mode Performance:")
    print("-"*70)
    for cat in categories:
        mae = metrics[cat]['community']['mae']
        rmse = metrics[cat]['community']['rmse']
        train_samples = metrics[cat]['community']['train_samples']
        test_samples = metrics[cat]['community']['test_samples']

        print(f"✅ {cat.upper():8s}  MAE: {mae:6.2f}  RMSE: {rmse:6.2f}  "
              f"Train: {train_samples}  Test: {test_samples}")

    print("\n" + "="*70)
    print("✅ All visualizations saved to outputs/ directory!")
    print("="*70)

    print("\n📁 Generated Files:")
    viz_files = [
        'mae_comparison.png',
        'rmse_comparison.png',
        'all_models_accuracy.png',
        'error_distribution.png',
        'aqi_api_pred_vs_actual.png',
        'aqi_community_pred_vs_actual.png',
        'noise_api_pred_vs_actual.png',
        'noise_community_pred_vs_actual.png',
        'litter_api_pred_vs_actual.png',
        'litter_community_pred_vs_actual.png',
        'pollen_api_pred_vs_actual.png',
        'pollen_community_pred_vs_actual.png'
    ]

    for f in viz_files:
        print(f"  - outputs/{f}")

if __name__ == "__main__":
    generate_performance_report()
