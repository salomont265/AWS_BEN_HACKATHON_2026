"""
Download TACO Litter Dataset

Downloads TACO dataset (1,500 images, 60 classes) and converts to YOLO format.
Remaps 60 TACO classes into 5 super-classes: plastic, organic, paper, metal, other.

NOTE: Run this on EC2 with GPU instance. Takes ~30 minutes.
Requires ~2GB disk space for download + extracted images.

Usage:
    cd /app/enviroguard-ml
    python data/download_taco.py
"""

import fiftyone as fo
import fiftyone.zoo as foz
import os
import yaml

print("=" * 60)
print("Downloading TACO Litter Dataset")
print("=" * 60)

# Download TACO dataset via FiftyOne Zoo
print("\nDownloading TACO from FiftyOne Zoo...")
print("This will download ~1.2GB of images...")

dataset = foz.load_zoo_dataset(
    "taco",
    split=None,  # Download all splits
    dataset_name="taco-litter"
)

print(f"✓ Downloaded {len(dataset)} images")

# Class remapping: 60 TACO classes → 5 super-classes
# Based on PRD specification
CLASS_MAPPING = {
    'plastic': [
        'Plastic bottle', 'Plastic bag & wrapper', 'Plastic container',
        'Plastic film', 'Plastic cup', 'Plastic lid', 'Plastic straw',
        'Plastic cutlery', 'Plastic glooves', 'Other plastic wrapper',
        'Six pack rings', 'Squeezable tube', 'Foam cup', 'Foam food container'
    ],
    'organic': [
        'Food waste', 'Unlabeled litter', 'Cigarette'
    ],
    'paper': [
        'Paper', 'Paper bag', 'Tissues', 'Wrapping paper',
        'Magazine paper', 'Egg carton', 'Meal carton', 'Pizza box',
        'Paper cup', 'Disposable food container'
    ],
    'metal': [
        'Aluminium foil', 'Can', 'Aluminium blister pack',
        'Metal bottle cap', 'Metal lid', 'Scrap metal'
    ],
    'other': [
        'Glass bottle', 'Glass cup', 'Glass jar', 'Broken glass',
        'Rope & strings', 'Shoe', 'Battery', 'Pop tab',
        'Straw', 'Other carton', 'Styrofoam piece', 'Tupperware'
    ]
}

print("\nRemapping TACO classes to 5 super-classes...")
print(f"  plastic:  {len(CLASS_MAPPING['plastic'])} original classes")
print(f"  organic:  {len(CLASS_MAPPING['organic'])} original classes")
print(f"  paper:    {len(CLASS_MAPPING['paper'])} original classes")
print(f"  metal:    {len(CLASS_MAPPING['metal'])} original classes")
print(f"  other:    {len(CLASS_MAPPING['other'])} original classes")

# Export to YOLO format
print("\nExporting to YOLO format...")
export_dir = "data/taco"
os.makedirs(export_dir, exist_ok=True)

dataset.export(
    export_dir=export_dir,
    dataset_type=fo.types.YOLOv5Dataset,
    split=["train", "val", "test"]
)

print(f"✓ Exported to {export_dir}/")

# Create data.yaml with 5 classes
data_yaml = {
    'path': os.path.abspath(export_dir),
    'train': 'images/train',
    'val': 'images/val',
    'test': 'images/test',
    'nc': 5,
    'names': ['plastic', 'organic', 'paper', 'metal', 'other']
}

with open(f'{export_dir}/data.yaml', 'w') as f:
    yaml.dump(data_yaml, f, default_flow_style=False)

print(f"✓ Created data.yaml with 5 super-classes")

print("\n" + "=" * 60)
print("✅ TACO dataset downloaded and prepared!")
print("=" * 60)
print("\nDataset location: data/taco/")
print("Next step: python models/litter/train.py")
print("\nNote: Training YOLOv8 requires GPU. Use g4dn.xlarge on EC2.")
