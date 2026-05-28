"""
Create ACCURACY PERCENTAGE graphs (not MAE/RMSE)

Shows accuracy as percentages with 75% target clearly marked
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json

plt.style.use('seaborn-v0_8-darkgrid')

print("="*70)
print("CREATING ACCURACY PERCENTAGE VISUALIZATIONS")
print("="*70)

# Load all metrics
categories = ['aqi', 'noise', 'litter', 'pollen']
modes = ['api', 'community']

all_metrics = {}
for cat in categories:
    all_metrics[cat] = {}
    for mode in modes:
        with open(f'eval/{cat}_{mode}_metrics.json') as f:
            all_metrics[cat][mode] = json.load(f)

# =============================================================================
# 1. ACCURACY PERCENTAGE BAR CHART (Main Graph)
# =============================================================================
print("\n[1/5] Creating main accuracy percentage bar chart...")

fig, ax = plt.subplots(figsize=(14, 8))

categories_display = ['AQI', 'Noise', 'Litter', 'Pollen']
api_accuracy = [all_metrics[cat]['api']['accuracy_pct'] for cat in categories]
comm_accuracy = [all_metrics[cat]['community']['accuracy_pct'] for cat in categories]

x = np.arange(len(categories))
width = 0.35

bars1 = ax.bar(x - width/2, api_accuracy, width, label='API Mode', color='#2ecc71', alpha=0.8, edgecolor='black', linewidth=1.5)
bars2 = ax.bar(x + width/2, comm_accuracy, width, label='Community Mode', color='#3498db', alpha=0.8, edgecolor='black', linewidth=1.5)

# 75% target line
ax.axhline(75, color='#e74c3c', linestyle='--', linewidth=3, label='75% Target', alpha=0.7)

# Add value labels on bars
for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        label = f'{height:.1f}%'
        ax.text(bar.get_x() + bar.get_width()/2., height + 1.5,
               label,
               ha='center', va='bottom', fontsize=12, fontweight='bold')

ax.set_xlabel('Model Category', fontsize=14, fontweight='bold')
ax.set_ylabel('Accuracy Percentage (%)', fontsize=14, fontweight='bold')
ax.set_title('Model Accuracy Percentages - Target: 75%', fontsize=16, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(categories_display, fontsize=12)
ax.set_ylim(0, 105)
ax.legend(fontsize=12, loc='lower right')
ax.grid(axis='y', alpha=0.3, linewidth=0.8)

# Add "PASS" or "BELOW" annotations
for i, (api_acc, comm_acc) in enumerate(zip(api_accuracy, comm_accuracy)):
    if api_acc >= 75:
        ax.text(i - width/2, api_acc + 5, '✅', ha='center', fontsize=16)
    else:
        ax.text(i - width/2, api_acc + 5, '⚠️', ha='center', fontsize=16)

    if comm_acc >= 75:
        ax.text(i + width/2, comm_acc + 5, '✅', ha='center', fontsize=16)
    else:
        ax.text(i + width/2, comm_acc + 5, '⚠️', ha='center', fontsize=16)

plt.tight_layout()
plt.savefig('outputs/accuracy_percentage_chart.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: outputs/accuracy_percentage_chart.png")

# =============================================================================
# 2. R² SCORE COMPARISON
# =============================================================================
print("\n[2/5] Creating R² score comparison...")

fig, ax = plt.subplots(figsize=(14, 7))

api_r2 = [all_metrics[cat]['api']['r2'] * 100 for cat in categories]
comm_r2 = [all_metrics[cat]['community']['r2'] * 100 for cat in categories]

bars1 = ax.bar(x - width/2, api_r2, width, label='API Mode', color='#9b59b6', alpha=0.8, edgecolor='black', linewidth=1.5)
bars2 = ax.bar(x + width/2, comm_r2, width, label='Community Mode', color='#e67e22', alpha=0.8, edgecolor='black', linewidth=1.5)

# Add value labels
for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., max(height, 5) + 2,
               f'{height:.1f}%',
               ha='center', va='bottom', fontsize=11, fontweight='bold')

ax.set_xlabel('Model Category', fontsize=14, fontweight='bold')
ax.set_ylabel('R² Score (%)', fontsize=14, fontweight='bold')
ax.set_title('Model R² Scores (Coefficient of Determination)', fontsize=16, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(categories_display, fontsize=12)
ax.set_ylim(0, 110)
ax.legend(fontsize=12)
ax.grid(axis='y', alpha=0.3, linewidth=0.8)

plt.tight_layout()
plt.savefig('outputs/r2_score_comparison.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: outputs/r2_score_comparison.png")

# =============================================================================
# 3. MAPE (Error Percentage) - Lower is Better
# =============================================================================
print("\n[3/5] Creating MAPE (error) comparison...")

fig, ax = plt.subplots(figsize=(14, 7))

api_mape = [all_metrics[cat]['api']['mape'] for cat in categories]
comm_mape = [all_metrics[cat]['community']['mape'] for cat in categories]

bars1 = ax.bar(x - width/2, api_mape, width, label='API Mode', color='#e74c3c', alpha=0.7, edgecolor='black', linewidth=1.5)
bars2 = ax.bar(x + width/2, comm_mape, width, label='Community Mode', color='#f39c12', alpha=0.7, edgecolor='black', linewidth=1.5)

# Add value labels
for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.5,
               f'{height:.1f}%',
               ha='center', va='bottom', fontsize=11, fontweight='bold')

ax.set_xlabel('Model Category', fontsize=14, fontweight='bold')
ax.set_ylabel('MAPE - Mean Absolute Percentage Error (%)', fontsize=14, fontweight='bold')
ax.set_title('Model Error Rates (MAPE) - Lower is Better', fontsize=16, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(categories_display, fontsize=12)
ax.legend(fontsize=12)
ax.grid(axis='y', alpha=0.3, linewidth=0.8)

plt.tight_layout()
plt.savefig('outputs/mape_error_comparison.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: outputs/mape_error_comparison.png")

# =============================================================================
# 4. COMPREHENSIVE METRICS DASHBOARD
# =============================================================================
print("\n[4/5] Creating comprehensive metrics dashboard...")

fig = plt.figure(figsize=(16, 12))
gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)

# Subplot 1: Accuracy %
ax1 = fig.add_subplot(gs[0, :])
x_pos = np.arange(len(categories) * 2)
all_accuracies = []
all_labels = []
colors = []

for i, cat in enumerate(categories):
    all_accuracies.append(all_metrics[cat]['api']['accuracy_pct'])
    all_labels.append(f"{cat.upper()}\nAPI")
    colors.append('#2ecc71')

    all_accuracies.append(all_metrics[cat]['community']['accuracy_pct'])
    all_labels.append(f"{cat.upper()}\nComm")
    colors.append('#3498db')

bars = ax1.bar(x_pos, all_accuracies, color=colors, alpha=0.8, edgecolor='black', linewidth=1)
ax1.axhline(75, color='red', linestyle='--', linewidth=2, label='75% Target')
ax1.set_ylabel('Accuracy %', fontsize=12, fontweight='bold')
ax1.set_title('Accuracy Percentage - All 8 Models', fontsize=14, fontweight='bold')
ax1.set_xticks(x_pos)
ax1.set_xticklabels(all_labels, fontsize=9)
ax1.set_ylim(0, 105)
ax1.legend()
ax1.grid(axis='y', alpha=0.3)

# Add values on bars
for bar, val in zip(bars, all_accuracies):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height + 1,
            f'{val:.1f}%',
            ha='center', va='bottom', fontsize=9, fontweight='bold')

# Subplot 2: R² Scores
ax2 = fig.add_subplot(gs[1, 0])
api_r2_vals = [all_metrics[cat]['api']['r2'] for cat in categories]
comm_r2_vals = [all_metrics[cat]['community']['r2'] for cat in categories]

ax2.bar(np.arange(4) - 0.2, api_r2_vals, 0.4, label='API', color='#9b59b6', alpha=0.8)
ax2.bar(np.arange(4) + 0.2, comm_r2_vals, 0.4, label='Community', color='#e67e22', alpha=0.8)
ax2.set_ylabel('R² Score', fontsize=11, fontweight='bold')
ax2.set_title('R² Scores', fontsize=12, fontweight='bold')
ax2.set_xticks(np.arange(4))
ax2.set_xticklabels(categories_display, fontsize=10)
ax2.legend()
ax2.grid(axis='y', alpha=0.3)

# Subplot 3: MAE
ax3 = fig.add_subplot(gs[1, 1])
api_mae = [all_metrics[cat]['api']['mae'] for cat in categories]
comm_mae = [all_metrics[cat]['community']['mae'] for cat in categories]

ax3.bar(np.arange(4) - 0.2, api_mae, 0.4, label='API', color='#1abc9c', alpha=0.8)
ax3.bar(np.arange(4) + 0.2, comm_mae, 0.4, label='Community', color='#16a085', alpha=0.8)
ax3.set_ylabel('MAE', fontsize=11, fontweight='bold')
ax3.set_title('Mean Absolute Error', fontsize=12, fontweight='bold')
ax3.set_xticks(np.arange(4))
ax3.set_xticklabels(categories_display, fontsize=10)
ax3.legend()
ax3.grid(axis='y', alpha=0.3)

# Subplot 4: Summary Table
ax4 = fig.add_subplot(gs[2, :])
ax4.axis('off')

table_data = []
table_data.append(['Model', 'MAE', 'RMSE', 'R²', 'MAPE %', 'Accuracy %', 'Status'])

for cat in categories:
    for mode in ['api', 'community']:
        m = all_metrics[cat][mode]
        status = '✅ PASS' if m['accuracy_pct'] >= 75 else '⚠️ BELOW'
        table_data.append([
            f"{cat.upper()} {mode.capitalize()}",
            f"{m['mae']:.2f}",
            f"{m['rmse']:.2f}",
            f"{m['r2']:.3f}",
            f"{m['mape']:.1f}",
            f"{m['accuracy_pct']:.1f}",
            status
        ])

table = ax4.table(cellText=table_data, cellLoc='center', loc='center',
                  colWidths=[0.2, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15])
table.auto_set_font_size(False)
table.set_fontsize(9)
table.scale(1, 2)

# Header styling
for i in range(7):
    table[(0, i)].set_facecolor('#34495e')
    table[(0, i)].set_text_props(weight='bold', color='white')

# Alternate row colors
for i in range(1, len(table_data)):
    for j in range(7):
        if i % 2 == 0:
            table[(i, j)].set_facecolor('#ecf0f1')

plt.savefig('outputs/comprehensive_metrics_dashboard.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: outputs/comprehensive_metrics_dashboard.png")

# =============================================================================
# 5. ACCURACY vs TARGET (Pass/Fail Visual)
# =============================================================================
print("\n[5/5] Creating accuracy pass/fail visualization...")

fig, ax = plt.subplots(figsize=(12, 8))

# Create pass/fail data
model_names = []
accuracies = []
pass_fail = []

for cat in categories:
    for mode in ['api', 'community']:
        model_names.append(f"{cat.upper()}\n{mode.capitalize()}")
        acc = all_metrics[cat][mode]['accuracy_pct']
        accuracies.append(acc)
        pass_fail.append('pass' if acc >= 75 else 'fail')

colors = ['#2ecc71' if pf == 'pass' else '#e74c3c' for pf in pass_fail]

bars = ax.barh(model_names, accuracies, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)

# Target line
ax.axvline(75, color='#34495e', linestyle='--', linewidth=3, label='75% Target', alpha=0.7)

# Add value labels
for bar, val in zip(bars, accuracies):
    width = bar.get_width()
    label = f'{val:.1f}%'
    ax.text(width + 1, bar.get_y() + bar.get_height()/2,
           label,
           ha='left', va='center', fontsize=11, fontweight='bold')

ax.set_xlabel('Accuracy Percentage (%)', fontsize=14, fontweight='bold')
ax.set_title('Model Accuracy: Pass (≥75%) vs Below Target', fontsize=16, fontweight='bold')
ax.set_xlim(0, 105)
ax.legend(fontsize=12)
ax.grid(axis='x', alpha=0.3, linewidth=0.8)

# Add pass/fail count
passing = sum(1 for pf in pass_fail if pf == 'pass')
total = len(pass_fail)
ax.text(0.02, 0.98, f'PASSING: {passing}/{total} models',
       transform=ax.transAxes, fontsize=14, fontweight='bold',
       verticalalignment='top',
       bbox=dict(boxstyle='round', facecolor='lightgreen' if passing == total else 'yellow', alpha=0.8))

plt.tight_layout()
plt.savefig('outputs/accuracy_pass_fail.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: outputs/accuracy_pass_fail.png")

# =============================================================================
# SUMMARY
# =============================================================================
print("\n" + "="*70)
print("SUMMARY")
print("="*70)

passing = sum(1 for cat in categories for mode in modes
              if all_metrics[cat][mode]['accuracy_pct'] >= 75)
total = len(categories) * len(modes)

print(f"\n✅ {passing}/{total} models meet 75% accuracy target")
print(f"\n📊 API Mode Accuracies:")
for cat in categories:
    acc = all_metrics[cat]['api']['accuracy_pct']
    status = '✅' if acc >= 75 else '⚠️'
    print(f"   {status} {cat.upper():8s}: {acc:.1f}%")

print(f"\n📊 Community Mode Accuracies:")
for cat in categories:
    acc = all_metrics[cat]['community']['accuracy_pct']
    status = '✅' if acc >= 75 else '⚠️'
    print(f"   {status} {cat.upper():8s}: {acc:.1f}%")

print("\n" + "="*70)
print("✅ ALL GRAPHS SAVED TO outputs/ DIRECTORY!")
print("="*70)

print("\n📁 Generated Files:")
print("   - accuracy_percentage_chart.png (MAIN GRAPH)")
print("   - r2_score_comparison.png")
print("   - mape_error_comparison.png")
print("   - comprehensive_metrics_dashboard.png")
print("   - accuracy_pass_fail.png")
