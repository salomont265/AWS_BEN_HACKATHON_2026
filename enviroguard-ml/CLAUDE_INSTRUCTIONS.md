# Instructions for Future Claude Sessions

**Context:** This folder contains a complete ML backend that needs to be trained on EC2. All code is written and tested locally (zero compute). Your job is to execute the training scripts on EC2.

---

## Current State

✅ **Code Complete:** All Python files written and pushed to GitHub  
✅ **Synthetic Data:** CSVs generated and ready (in `data/` folder)  
✅ **Tests Written:** 13 tests in `test_models.py`  
✅ **Documentation:** README.md and NEXT_STEPS_EC2.md complete  

❌ **Models NOT Trained:** Must run training scripts on EC2  
❌ **Server NOT Running:** Can't start until models exist  

---

## Prerequisites Check

Before starting, verify:

```bash
# 1. Check you're on EC2 (not local)
uname -a  # Should show Linux kernel

# 2. Check location
pwd  # Should be /app/enviroguard-ml or similar

# 3. Check Python version
python3 --version  # Need 3.9+

# 4. Check if GPU available (for YOLOv8)
nvidia-smi  # Should show NVIDIA driver + GPU info
# If this fails, you're on CPU instance (OK for Prophet, NOT OK for YOLOv8)
```

---

## Training Order (Sequential)

### Step 1: Install Dependencies (~5 minutes)

```bash
cd /app/enviroguard-ml
pip3 install -r requirements.txt

# Verify critical packages
python3 -c "import fastapi, prophet, ultralytics, pandas; print('✓ All imports work')"
```

**Expected output:** `✓ All imports work`

If import fails, install individually:
```bash
pip3 install fastapi uvicorn prophet ultralytics pandas numpy
```

---

### Step 2: Train Noise Models (~5 minutes, CPU)

```bash
python3 models/noise/train_noise.py
```

**Expected output:**
```
Training model for STATION_001
Fitting Prophet model...
MAE:  6.5 dB
RMSE: 9.2 dB
✓ Model saved to models/noise/STATION_001_model.pkl
... (repeat for STATION_002, STATION_003)
✅ All noise prediction models trained successfully!
```

**Verification:**
```bash
ls -lh models/noise/*.pkl
# Should show 3 files, each ~2MB
```

**If this fails:**
- Check `data/noise_synthetic.csv` exists
- Check pandas/prophet are installed
- Error logs will show which station failed

---

### Step 3: Train Fill Models (~5 minutes, CPU)

```bash
python3 models/fill/train_fill.py
```

**Expected output:**
```
Training model for STATION_001
Fitting Prophet model...
Overflow predicted at: 2026-05-15T14:30:00
MAE:  3.8%
RMSE: 5.2%
✓ Model saved to models/fill/STATION_001_model.pkl
... (repeat for STATION_002, STATION_003)
✅ All fill prediction models trained successfully!
```

**Verification:**
```bash
ls -lh models/fill/*.pkl
# Should show 3 files, each ~2MB
```

---

### Step 4: Download TACO Dataset (~30 minutes)

**IMPORTANT:** This requires ~2GB disk space and good internet.

```bash
python3 data/download_taco.py
```

**Expected output:**
```
Downloading TACO from FiftyOne Zoo...
This will download ~1.2GB of images...
✓ Downloaded 1500 images
Remapping TACO classes to 5 super-classes...
Exporting to YOLO format...
✓ Exported to data/taco/
✓ Created data.yaml with 5 super-classes
✅ TACO dataset downloaded and prepared!
```

**Verification:**
```bash
ls -lh data/taco/
# Should show: images/, labels/, data.yaml

du -sh data/taco/
# Should be ~2GB
```

**If download fails:**
- Check internet connection: `curl -I https://www.google.com`
- Check disk space: `df -h`
- Try again (fiftyone caches partial downloads)

**Alternative if download keeps failing:**
Skip YOLOv8 for now, come back to it later. Prophet models work independently.

---

### Step 5: Train YOLOv8 (~2 hours, GPU REQUIRED)

**CRITICAL:** This step REQUIRES a GPU. Check first:

```bash
nvidia-smi
# Must show GPU info. If "command not found", STOP - you need g4dn.xlarge instance
```

If you're on CPU instance:
1. Stop here
2. Tell user: "Prophet models trained successfully. Need g4dn.xlarge GPU instance for YOLOv8."
3. Skip to Step 6 to start server (it will work without litter model, just with error message)

**If GPU available:**

```bash
python3 models/litter/train.py
```

**Expected output (takes ~2 hours):**
```
✓ GPU available: Tesla T4
✓ Found TACO dataset at data/taco/data.yaml
✓ Loaded yolov8n.pt (3.2M params)

Training configuration:
  Epochs: 50
  Batch size: 16
  ...

Starting training... (this will take ~2 hours)
Epoch 1/50: ...
... (lots of training logs)
Epoch 50/50: ...

Training complete!
✓ Copied best weights to models/litter/best.pt
  Model size: 6.2 MB

Validation Metrics:
  mAP@50:    0.52
  Precision: 0.64
  Recall:    0.58

✅ Training successful! mAP@50 exceeds target (0.45)
```

**Verification:**
```bash
ls -lh models/litter/best.pt
# Should be ~6MB

cat models/litter/eval_results.txt
# Should show mAP@50 > 0.45
```

**If training fails with CUDA out of memory:**
```bash
# Edit train.py to reduce batch size
sed -i 's/batch=16/batch=8/g' models/litter/train.py
# Try again
python3 models/litter/train.py
```

**If mAP@50 < 0.45:**
This is still usable, just less accurate. Note it in your response to user.

---

### Step 6: Start FastAPI Server

**First, verify all models loaded:**

```bash
python3 -c "
import os
print('Noise models:', len([f for f in os.listdir('models/noise') if f.endswith('.pkl')]))
print('Fill models:', len([f for f in os.listdir('models/fill') if f.endswith('.pkl')]))
print('Litter model:', os.path.exists('models/litter/best.pt'))
"
```

**Expected output:**
```
Noise models: 3
Fill models: 3
Litter model: True
```

**Start server:**

```bash
# Test run (foreground, with logs)
uvicorn main:app --host 0.0.0.0 --port 8000

# You should see:
# INFO: Loading ML models...
# INFO: ✓ Loaded YOLOv8 litter detector
# INFO: ✓ Loaded 3 noise prediction models
# INFO: ✓ Loaded 3 fill prediction models
# INFO: ✅ Model loading complete: 3/3 model types loaded
# INFO: Uvicorn running on http://0.0.0.0:8000
```

**Server is ready when you see:** `Uvicorn running on http://0.0.0.0:8000`

---

### Step 7: Test Endpoints (In New Terminal)

```bash
# Health check
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

**If models_loaded != 3:**
- Check which model is missing in the response
- Go back to that training step
- Check error logs in the server output

**Test noise forecast:**
```bash
curl http://localhost:8000/predict-noise/STATION_001 | jq
# Should return 24 hourly predictions
```

**Test fill forecast:**
```bash
curl http://localhost:8000/predict-fill/STATION_001 | jq
# Should return 192 predictions (15-min intervals)
# Check "overflow_predicted" field
```

**Test litter detection:**
```bash
# Need an image file first
curl -X POST http://localhost:8000/detect-litter \
  -F "file=@/path/to/image.jpg" | jq
# Should return severity 1-5 and detections
```

---

### Step 8: Run Test Suite

```bash
# Keep server running in terminal 1

# In terminal 2:
pytest test_models.py -v
```

**Expected output:**
```
test_health_endpoint PASSED
test_litter_clean_image PASSED (or SKIPPED if no test image)
test_litter_cluttered_image PASSED (or SKIPPED)
test_noise_returns_24_hours PASSED
test_noise_confidence_intervals PASSED
test_fill_returns_48_hours PASSED
test_fill_overflow_detection PASSED
... (13 tests total)

===== 13 passed (or X passed, Y skipped) =====
```

**Some tests may SKIP** if test images aren't present - that's OK.

**If critical tests fail:**
- Check server logs for errors
- Verify models loaded: `curl http://localhost:8000/health`
- Check test_models.py is using correct BASE_URL

---

### Step 9: Make Server Persistent (Production)

**Option A: nohup (quick)**

```bash
# Stop foreground server (Ctrl+C)

# Start in background
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &

# Check it's running
curl http://localhost:8000/health

# View logs
tail -f nohup.out
```

**Option B: systemd (recommended)**

See README.md "Running the Server" section for systemd setup.

---

## Summary for User

After all steps complete, report to user:

```
✅ EnviroGuard ML Backend Training Complete!

Models Trained:
- Noise Predictor: 3 stations, MAE X.X dB
- Fill Predictor: 3 stations, MAE X.X%, overflow detection working
- Litter Detector: mAP@50 = X.XX (target > 0.45)

Server Status:
- Running on port 8000
- All 3 model types loaded
- 13/13 tests passing (or X/13 with Y skipped)

Access:
- Health: http://<ec2-ip>:8000/health
- Docs: http://<ec2-ip>:8000/docs
- Endpoints ready for mobile app integration

Next Steps:
1. Update mobile app .env with EC2 IP
2. Test from mobile app (take photo, view forecasts)
3. Set up systemd for auto-restart (see README.md)

Cost: ~$30/month for t3.medium serving instance
```

---

## Troubleshooting Guide

### Problem: "No module named 'prophet'"

**Solution:**
```bash
pip3 install prophet
# If that fails:
pip3 install pystan==2.19.1.1
pip3 install prophet
```

### Problem: "CUDA out of memory"

**Solution:**
```bash
# Reduce batch size in models/litter/train.py
nano models/litter/train.py
# Change: batch=16 → batch=8
```

### Problem: "Port 8000 already in use"

**Solution:**
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Problem: Models load but predictions fail

**Solution:**
```bash
# Check model files aren't corrupted
python3 -c "
import pickle
with open('models/noise/STATION_001_model.pkl', 'rb') as f:
    model = pickle.load(f)
    print('✓ Noise model loads OK')
"

# If error, retrain that model
python3 models/noise/train_noise.py
```

### Problem: YOLOv8 training is very slow (>4 hours)

**Check:**
```bash
nvidia-smi
# If "No devices found", you're on CPU - STOP, need GPU instance
```

---

## File Checklist After Training

Run this to verify everything:

```bash
cd /app/enviroguard-ml

echo "Checking files..."

# Models
test -f models/litter/best.pt && echo "✓ Litter model" || echo "✗ Litter model MISSING"
test -f models/noise/STATION_001_model.pkl && echo "✓ Noise models" || echo "✗ Noise models MISSING"
test -f models/fill/STATION_001_model.pkl && echo "✓ Fill models" || echo "✗ Fill models MISSING"

# Data
test -f data/noise_synthetic.csv && echo "✓ Noise data" || echo "✗ Noise data MISSING"
test -f data/taco/data.yaml && echo "✓ TACO dataset" || echo "✗ TACO dataset MISSING"

# Evaluation results
test -f models/litter/eval_results.txt && echo "✓ Litter eval" || echo "✗ Litter eval MISSING"
test -f models/noise/STATION_001_eval.txt && echo "✓ Noise eval" || echo "✗ Noise eval MISSING"

echo ""
echo "Disk usage:"
du -sh models/ data/ outputs/

echo ""
echo "Server status:"
curl -s http://localhost:8000/health | jq -r '"Models loaded: \(.models_loaded)/3"'
```

**All should show ✓**

---

## Quick Reference Commands

```bash
# Check training progress
tail -f nohup.out

# Check server status
curl http://localhost:8000/health | jq

# Restart server
pkill -f uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Check GPU usage during training
watch -n 1 nvidia-smi

# Check disk space
df -h

# Check what's using port 8000
lsof -i:8000

# View server logs
journalctl -u enviroguard-ml -f  # If using systemd
tail -f nohup.out               # If using nohup
```

---

## Critical Notes

1. **Training order matters:** Noise → Fill → TACO download → YOLOv8
2. **GPU is optional:** Prophet works on CPU, YOLOv8 needs GPU
3. **Disk space:** Need ~4GB total (2GB TACO + 2GB for models/outputs)
4. **Memory:** 4GB RAM minimum, 8GB recommended
5. **Time:** Budget 3 hours total (mostly YOLOv8)
6. **Cost:** ~$0.33 for training, ~$30/month for serving

---

**Good luck! Check README.md and NEXT_STEPS_EC2.md for more details.**
