"""
Train YOLOv8-nano Litter Detector

Fine-tunes YOLOv8-nano on TACO dataset (5 super-classes).

NOTE: Run this on EC2 g4dn.xlarge with GPU. Takes ~2 hours.

Prerequisites:
    - TACO dataset downloaded (python data/download_taco.py)
    - GPU available (check with: nvidia-smi)

Usage:
    cd /app/enviroguard-ml
    python models/litter/train.py
"""

from ultralytics import YOLO
import torch
import os

print("=" * 60)
print("Training YOLOv8-nano Litter Detector")
print("=" * 60)

# Check for GPU
if torch.cuda.is_available():
    print(f"\n✓ GPU available: {torch.cuda.get_device_name(0)}")
    print(f"  Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    device = 0
else:
    print("\n⚠ WARNING: No GPU detected! Training will be VERY slow on CPU.")
    print("  Recommended: Use g4dn.xlarge on EC2 (~$0.16/hr spot)")
    device = 'cpu'

# Check if TACO dataset exists
data_yaml_path = 'data/taco/data.yaml'
if not os.path.exists(data_yaml_path):
    print(f"\n✗ ERROR: TACO dataset not found at {data_yaml_path}")
    print("  Run: python data/download_taco.py")
    exit(1)

print(f"✓ Found TACO dataset at {data_yaml_path}")

# Load pretrained YOLOv8-nano model
print("\nLoading YOLOv8-nano pretrained weights...")
model = YOLO('yolov8n.pt')  # Downloads automatically if not present
print("✓ Loaded yolov8n.pt (3.2M params)")

# Training configuration
print("\nTraining configuration:")
print("  Epochs: 50")
print("  Batch size: 16")
print("  Image size: 640×640")
print("  Patience: 10 (early stopping)")
print("  Classes: 5 (plastic, organic, paper, metal, other)")

# Train the model
print("\n" + "=" * 60)
print("Starting training... (this will take ~2 hours)")
print("=" * 60)

results = model.train(
    data=data_yaml_path,
    epochs=50,
    batch=16,
    imgsz=640,
    device=device,
    patience=10,  # Early stopping if no improvement for 10 epochs
    save=True,
    project='models/litter',
    name='exp',
    exist_ok=True,
    verbose=True
)

print("\n" + "=" * 60)
print("Training complete!")
print("=" * 60)

# Copy best weights to models/litter/
import shutil
best_weights_path = 'models/litter/exp/weights/best.pt'
target_path = 'models/litter/best.pt'

if os.path.exists(best_weights_path):
    shutil.copy(best_weights_path, target_path)
    print(f"✓ Copied best weights to {target_path}")

    # Get file size
    size_mb = os.path.getsize(target_path) / (1024 * 1024)
    print(f"  Model size: {size_mb:.2f} MB")
else:
    print(f"✗ ERROR: Best weights not found at {best_weights_path}")

# Run validation on test set
print("\nRunning validation on test set...")
metrics = model.val(split='test')

print("\nValidation Metrics:")
print(f"  mAP@50:    {metrics.box.map50:.3f}")
print(f"  mAP@50-95: {metrics.box.map:.3f}")
print(f"  Precision: {metrics.box.mp:.3f}")
print(f"  Recall:    {metrics.box.mr:.3f}")

# Save evaluation results
with open('models/litter/eval_results.txt', 'w') as f:
    f.write("YOLOv8-nano Litter Detector - Evaluation Results\n")
    f.write("=" * 50 + "\n\n")
    f.write(f"mAP@50:           {metrics.box.map50:.3f}\n")
    f.write(f"mAP@50-95:        {metrics.box.map:.3f}\n")
    f.write(f"Precision:        {metrics.box.mp:.3f}\n")
    f.write(f"Recall:           {metrics.box.mr:.3f}\n")
    f.write("\nPer-class mAP@50:\n")

    # Per-class metrics (if available)
    if hasattr(metrics.box, 'ap_class_index'):
        class_names = ['plastic', 'organic', 'paper', 'metal', 'other']
        for i, class_name in enumerate(class_names):
            if i < len(metrics.box.ap50):
                f.write(f"  {class_name:10s}: {metrics.box.ap50[i]:.3f}\n")

    f.write(f"\nTarget: mAP@50 > 0.45\n")
    f.write(f"Status: {'✓ PASS' if metrics.box.map50 > 0.45 else '✗ FAIL'}\n")

print("✓ Saved evaluation results to models/litter/eval_results.txt")

# Check if target mAP met
if metrics.box.map50 > 0.45:
    print("\n✅ Training successful! mAP@50 exceeds target (0.45)")
else:
    print(f"\n⚠ WARNING: mAP@50 ({metrics.box.map50:.3f}) is below target (0.45)")
    print("  Consider:")
    print("    - Training for more epochs")
    print("    - Reducing to 3 classes (plastic, organic, other)")
    print("    - Using YOLOv8s instead of nano (more capacity)")

print("\nNext steps:")
print("1. Check evaluation results: cat models/litter/eval_results.txt")
print("2. Integrate with FastAPI: Update main.py to load models")
print("3. Test inference: python models/litter/infer.py <image_path>")
