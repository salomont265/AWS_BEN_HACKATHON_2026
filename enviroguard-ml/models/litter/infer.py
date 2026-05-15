"""
YOLOv8 Litter Detection Inference

Runs inference on images and computes severity score (1-5).

Usage:
    python models/litter/infer.py <image_path>
"""

from ultralytics import YOLO
from PIL import Image
import sys
import os

# Class weights for severity calculation
# More hazardous litter types score higher
CLASS_WEIGHTS = {
    'plastic': 1.5,   # Most problematic
    'metal': 1.2,
    'paper': 0.8,
    'organic': 0.6,   # Least concern (biodegradable)
    'other': 1.0
}

def compute_severity(detections: list) -> int:
    """
    Map detection count + class weights to severity 1-5.

    Args:
        detections: List of detection dicts with 'class' and 'confidence'

    Returns:
        int: Severity score from 1 (clean) to 5 (severe)
    """
    if not detections:
        return 1  # Clean

    # Weighted score based on class hazard level
    score = sum(
        CLASS_WEIGHTS.get(d['class'], 1.0) * d['confidence']
        for d in detections
    )

    # Count-based severity thresholds
    total = len(detections)

    if total == 0:
        return 1
    elif total <= 2:
        return 2
    elif total <= 5:
        return 3
    elif total <= 10:
        return 4
    else:
        return 5

def detect_litter(image_path: str, model_path: str = 'models/litter/best.pt'):
    """
    Run litter detection on an image.

    Args:
        image_path: Path to input image
        model_path: Path to trained YOLOv8 model

    Returns:
        dict: Detection results with severity, detections, count, summary
    """
    # Check if model exists
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            "Train the model first: python models/litter/train.py"
        )

    # Load model
    model = YOLO(model_path)

    # Load image
    image = Image.open(image_path)

    # Run inference
    results = model(image)[0]

    # Parse detections
    detections = []
    for box in results.boxes:
        detections.append({
            'class': results.names[int(box.cls[0])],
            'confidence': float(box.conf[0]),
            'bbox': box.xywh[0].tolist()  # [x_center, y_center, width, height]
        })

    # Compute severity
    severity = compute_severity(detections)

    # Generate human-readable summary
    class_counts = {}
    for d in detections:
        class_counts[d['class']] = class_counts.get(d['class'], 0) + 1

    if not class_counts:
        summary = "No litter detected"
    else:
        items = ", ".join(f"{cnt} {cls}" for cls, cnt in class_counts.items())
        summary = f"Detected {len(detections)} items: {items}"

    return {
        'severity': severity,
        'detections': detections,
        'litter_count': len(detections),
        'summary': summary
    }

def main():
    """CLI interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python models/litter/infer.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        sys.exit(1)

    print(f"Running inference on {image_path}...")
    result = detect_litter(image_path)

    print("\nResults:")
    print(f"  Severity: {result['severity']}/5")
    print(f"  Litter count: {result['litter_count']}")
    print(f"  Summary: {result['summary']}")

    if result['detections']:
        print("\nDetections:")
        for i, det in enumerate(result['detections'], 1):
            print(f"  {i}. {det['class']} (confidence: {det['confidence']:.2f})")

if __name__ == '__main__':
    main()
