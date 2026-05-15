# Next Steps: Training on EC2

This file contains the exact commands to run on EC2 after copying this folder there.

## Prerequisites

- EC2 instance running (t3.medium for Prophet, g4dn.xlarge for YOLOv8)
- Python 3.9+ installed
- This folder copied to EC2 at `/app/enviroguard-ml/`

## Step 1: Copy Folder to EC2

```bash
# From your local machine
cd /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026
scp -r enviroguard-ml/ ec2-user@<your-ec2-ip>:/app/
```

## Step 2: Install Dependencies on EC2

```bash
# SSH into EC2
ssh ec2-user@<your-ec2-ip>

# Navigate to project
cd /app/enviroguard-ml

# Install dependencies
pip3 install -r requirements.txt
```

## Step 3: Train Prophet Models (~10 minutes total)

```bash
# Train noise prediction models
python3 models/noise/train_noise.py

# Expected output:
# ✓ 3 PKL files in models/noise/
# ✓ MAE < 8 dB, RMSE < 12 dB
# ✓ Graphs in outputs/

# Train fill prediction models
python3 models/fill/train_fill.py

# Expected output:
# ✓ 3 PKL files in models/fill/
# ✓ MAE < 5%, overflow detection working
# ✓ Graphs in outputs/
```

## Step 4: Download TACO Dataset (~30 minutes)

**Only needed for litter detector. Skip if using pre-trained weights.**

```bash
python3 data/download_taco.py

# Expected output:
# ✓ ~1,500 images downloaded to data/taco/
# ✓ ~2GB disk space used
# ✓ data.yaml created with 5 classes
```

## Step 5: Train YOLOv8 (~2 hours on GPU)

**Requires GPU instance (g4dn.xlarge recommended)**

```bash
# Check GPU is available
nvidia-smi

# Train YOLOv8-nano
python3 models/litter/train.py

# Expected output:
# ✓ models/litter/best.pt (~6MB)
# ✓ mAP@50 > 0.45
# ✓ Training takes ~2 hours
```

## Step 6: Start Server

```bash
# Test run (foreground)
uvicorn main:app --host 0.0.0.0 --port 8000

# Or production run (background)
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &

# Or with systemd (recommended - see README.md)
```

## Step 7: Verify Server is Running

```bash
# From EC2
curl http://localhost:8000/health

# Expected:
# {
#   "status": "ok",
#   "models_loaded": 3,
#   "models": {
#     "litter": "loaded",
#     "noise_stations": ["STATION_001", "STATION_002", "STATION_003"],
#     "fill_stations": ["STATION_001", "STATION_002", "STATION_003"]
#   }
# }
```

## Step 8: Test Endpoints

```bash
# Noise forecast
curl http://localhost:8000/predict-noise/STATION_001 | jq

# Fill forecast
curl http://localhost:8000/predict-fill/STATION_001 | jq

# Litter detection (need image)
curl -X POST http://localhost:8000/detect-litter \
  -F "file=@test_image.jpg" | jq
```

## Step 9: Run Tests

```bash
# Terminal 1: Server should already be running

# Terminal 2: Run tests
pytest test_models.py -v

# Expected: 13/13 tests pass
```

## Step 10: Update Mobile App

```bash
# In enviroguard/.env
EXPO_PUBLIC_ML_API_URL=http://<ec2-ip>:8000

# Test from mobile app:
# - Take photo → see severity
# - Open Health tab → see 24h forecast
# - Check for overflow alerts
```

## Cost Estimate

**Training (one-time):**
- t3.medium (Prophet): ~$0.04/hr × 0.25hr = $0.01
- g4dn.xlarge spot (YOLOv8): ~$0.16/hr × 2hr = $0.32
- **Total: ~$0.33**

**Serving (24/7):**
- t3.medium: ~$0.042/hr × 730hr/month = **~$30/month**

## Troubleshooting

**"Model not found" errors:**
- Make sure all training scripts completed successfully
- Check that PKL and PT files exist in models/ folders

**CUDA out of memory:**
- Reduce batch size in models/litter/train.py (change batch=16 to batch=8)
- Or use larger GPU instance (g4dn.2xlarge)

**Port 8000 already in use:**
- Kill existing process: `lsof -ti:8000 | xargs kill -9`
- Or use different port

**Slow training:**
- Prophet should take ~5 min on CPU
- YOLOv8 should take ~2 hours on T4 GPU
- If slower, check GPU is being used: `nvidia-smi`

## Files Created After Training

```
enviroguard-ml/
├── models/
│   ├── litter/
│   │   ├── best.pt              # 6MB, YOLOv8 weights
│   │   └── eval_results.txt     # mAP, precision, recall
│   ├── noise/
│   │   ├── STATION_001_model.pkl  # ~2MB each
│   │   ├── STATION_002_model.pkl
│   │   ├── STATION_003_model.pkl
│   │   └── *_eval.txt            # MAE, RMSE metrics
│   └── fill/
│       ├── STATION_001_model.pkl  # ~2MB each
│       ├── STATION_002_model.pkl
│       ├── STATION_003_model.pkl
│       └── *_eval.txt            # MAE, overflow accuracy
└── outputs/
    ├── noise_forecast_*.png      # Forecast plots
    ├── noise_components_*.png    # Seasonality decomposition
    ├── fill_forecast_*.png       # With overflow threshold line
    └── fill_components_*.png
```

**Total disk space:** ~20MB (models) + ~2GB (TACO dataset)

---

Good luck with training! Check README.md for detailed documentation.
