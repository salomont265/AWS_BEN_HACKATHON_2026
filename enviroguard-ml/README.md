# EnviroGuard ML Backend

Machine learning backend for EnviroGuard environmental sensing system. Serves 3 models via FastAPI: YOLOv8-nano litter detector, Prophet noise predictor (24h), Prophet fill predictor (48h + overflow).

**Current Status:** Code complete, ready for training on EC2. Models must be trained before endpoints are functional.

---

## Quick Start

```bash
# 1. Install dependencies
cd enviroguard-ml
pip install -r requirements.txt

# 2. Generate synthetic data (local, ~5 seconds)
python data/generate_data.py

# 3. Copy entire folder to EC2
scp -r enviroguard-ml/ ec2-user@<ec2-ip>:/app/

# 4. On EC2: Train all models (~3 hours total)
ssh ec2-user@<ec2-ip>
cd /app/enviroguard-ml
python models/noise/train_noise.py      # ~5 min, CPU
python models/fill/train_fill.py        # ~5 min, CPU
python data/download_taco.py            # ~30 min download
python models/litter/train.py           # ~2 hours, GPU required

# 5. On EC2: Start server
uvicorn main:app --host 0.0.0.0 --port 8000

# 6. Test endpoints
curl http://<ec2-ip>:8000/health
```

---

## The Three Models

### 1. Litter Detector (YOLOv8-nano)

**What it does:** Detects litter in camera frames, returns severity 1-5

**Input:** JPEG/PNG image (multipart file upload)

**Output:**
```json
{
  "severity": 3,
  "litter_count": 7,
  "detections": [
    {"class": "plastic", "confidence": 0.85, "bbox": [120, 240, 50, 80]},
    {"class": "paper", "confidence": 0.72, "bbox": [200, 180, 40, 60]}
  ],
  "summary": "Detected 7 items: 5 plastic, 2 paper",
  "processing_time_ms": 187.3
}
```

**Training:** TACO dataset (1,500 images), 60 classes → 5 super-classes  
**Target:** mAP@50 > 0.45  
**Endpoint:** `POST /detect-litter`

### 2. Noise Predictor (Prophet)

**What it does:** 24-hour ambient dB forecast with confidence intervals

**Input:** Station ID

**Output:**
```json
{
  "station_id": "STATION_001",
  "generated_at": "2026-05-14T10:30:00",
  "forecast": [
    {"hour": "2026-05-14T11:00:00", "predicted": 68.5, "lower": 62.1, "upper": 74.9},
    {"hour": "2026-05-14T12:00:00", "predicted": 72.3, "lower": 65.8, "upper": 78.8}
    // ... 22 more hours
  ],
  "peak_hour": "2026-05-14T18:00:00",
  "peak_db": 78.2
}
```

**Training:** 90 days of synthetic hourly dB readings  
**Target:** MAE < 8 dB, RMSE < 12 dB  
**Endpoint:** `GET /predict-noise/{station_id}`

### 3. Fill Predictor (Prophet)

**What it does:** 48-hour bin fill forecast + overflow time prediction

**Input:** Station ID

**Output:**
```json
{
  "station_id": "STATION_001",
  "generated_at": "2026-05-14T10:30:00",
  "forecast": [
    {"time": "2026-05-14T10:45:00", "predicted": 67.2, "lower": 62.5, "upper": 71.9},
    // ... 191 more (15-min intervals)
  ],
  "overflow_predicted": true,
  "overflow_time": "2026-05-15T14:30:00",
  "hours_until_overflow": 28,
  "current_fill_pct": 65.8
}
```

**Training:** 90 days of synthetic 15-min fill % readings  
**Target:** MAE < 5%, overflow accuracy within 2 hours  
**Endpoint:** `GET /predict-fill/{station_id}`

---

## Training the Models

### Prerequisites

**For Noise & Fill (CPU):**
- Any EC2 instance (t3.medium recommended, ~$0.04/hr)
- Python 3.9+
- ~2GB RAM

**For Litter Detector (GPU):**
- EC2 g4dn.xlarge (~$0.16/hr spot, ~$0.53/hr on-demand)
- NVIDIA T4 GPU (16GB VRAM)
- Deep Learning AMI (Ubuntu 22.04) recommended

### Training Steps

#### 1. Prophet Models (Noise & Fill)

```bash
# On any EC2 instance
cd /app/enviroguard-ml

# Train noise models (3 stations)
python models/noise/train_noise.py
# Output: 3 PKL files in models/noise/
# Time: ~5 minutes
# Disk: ~2MB per model

# Train fill models (3 stations)
python models/fill/train_fill.py
# Output: 3 PKL files in models/fill/
# Time: ~5 minutes
# Disk: ~2MB per model

# Check results
cat models/noise/STATION_001_eval.txt
cat models/fill/STATION_001_eval.txt
```

**Expected Metrics:**
- Noise: MAE < 8 dB, RMSE < 12 dB, Coverage > 75%
- Fill: MAE < 5%, RMSE < 7%, Coverage > 75%

#### 2. YOLOv8 Litter Detector

```bash
# On EC2 g4dn.xlarge with GPU
cd /app/enviroguard-ml

# Download TACO dataset (~1.2GB)
python data/download_taco.py
# Time: ~30 minutes
# Disk: ~2GB (images + annotations)

# Train YOLOv8-nano
python models/litter/train.py
# Time: ~2 hours on T4 GPU
# Output: models/litter/best.pt (~6MB)

# Check results
cat models/litter/eval_results.txt
```

**Expected Metrics:**
- mAP@50: > 0.45
- mAP@50-95: ~0.30
- Precision: ~0.60
- Recall: ~0.55

**If mAP too low:**
1. Reduce to 3 classes (plastic, organic, other)
2. Train for more epochs (100)
3. Use YOLOv8s instead of nano (more capacity, slower inference)

---

## Running the Server

### Local (for development)

```bash
cd enviroguard-ml
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/docs for interactive API documentation.

### EC2 (production)

#### Option A: nohup (simple)

```bash
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
```

#### Option B: systemd (recommended)

Create `/etc/systemd/system/enviroguard-ml.service`:

```ini
[Unit]
Description=EnviroGuard ML API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/app/enviroguard-ml
ExecStart=/usr/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable enviroguard-ml
sudo systemctl start enviroguard-ml
sudo systemctl status enviroguard-ml
```

---

## API Reference

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "models_loaded": 3,
  "models": {
    "litter": "loaded",
    "noise_stations": ["STATION_001", "STATION_002", "STATION_003"],
    "fill_stations": ["STATION_001", "STATION_002", "STATION_003"]
  }
}
```

### POST /detect-litter

Detect litter in uploaded image.

**Request:** Multipart form data with `file` field (JPEG/PNG)

**Response:** See "Litter Detector" section above

**cURL Example:**
```bash
curl -X POST http://localhost:8000/detect-litter \
  -F "file=@test_image.jpg"
```

### GET /predict-noise/{station_id}

Generate 24-hour noise forecast.

**Parameters:**
- `station_id` (path): Station identifier (e.g., "STATION_001")

**Response:** See "Noise Predictor" section above

**cURL Example:**
```bash
curl http://localhost:8000/predict-noise/STATION_001
```

### GET /predict-fill/{station_id}

Generate 48-hour fill forecast with overflow detection.

**Parameters:**
- `station_id` (path): Station identifier (e.g., "STATION_001")

**Response:** See "Fill Predictor" section above

**cURL Example:**
```bash
curl http://localhost:8000/predict-fill/STATION_001
```

---

## Testing

### Run Tests

```bash
# Terminal 1: Start server
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Run tests
pytest test_models.py -v

# With coverage report
pytest test_models.py -v --cov=. --cov-report=html
open htmlcov/index.html
```

### Test Coverage

13 tests covering:
- ✅ Health check
- ✅ Litter detection (clean/cluttered images, validation)
- ✅ Noise forecasting (24h, confidence intervals, peak detection)
- ✅ Fill forecasting (48h, overflow detection, bounds check)
- ✅ Error handling (invalid inputs, station IDs)
- ✅ Concurrency (parallel requests)

---

## Replacing Synthetic Data with Real Sensors

Currently, models train on synthetic CSV files (`noise_synthetic.csv`, `fill_synthetic.csv`). When real Raspberry Pi sensors are deployed:

### Step 1: Collect Real Data

Sensors should POST readings to DynamoDB:
- Noise: Every 5 seconds (aggregate to hourly for training)
- Fill: Every 60 seconds (use 15-min intervals)

### Step 2: Export Training Data

```python
# Export last 90 days from DynamoDB
import boto3
import pandas as pd

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('enviroguard-readings')

# Query and export to CSV
# Format: columns 'ds' (datetime), 'station_id' (str), 'y' (float)
df.to_csv('data/noise_real.csv', index=False)
```

### Step 3: Retrain Models

```bash
# Update training scripts to use real data
sed -i 's/noise_synthetic.csv/noise_real.csv/g' models/noise/train_noise.py
sed -i 's/fill_synthetic.csv/fill_real.csv/g' models/fill/train_fill.py

# Retrain (set up cron for weekly retraining)
python models/noise/train_noise.py
python models/fill/train_fill.py

# Restart server to load new models
sudo systemctl restart enviroguard-ml
```

### Step 4: Weekly Retraining (cron)

Add to `/etc/cron.weekly/retrain-models.sh`:

```bash
#!/bin/bash
cd /app/enviroguard-ml
python models/noise/train_noise.py
python models/fill/train_fill.py
sudo systemctl restart enviroguard-ml
```

---

## Deploying to EC2

### Instance Recommendations

**Training (one-time, ~4 hours):**
- Instance: g4dn.xlarge
- vCPU: 4
- RAM: 16GB
- GPU: 1x NVIDIA T4 (16GB VRAM)
- Cost: ~$0.16/hr spot, ~$0.53/hr on-demand
- Total cost: ~$0.64 spot, ~$2.12 on-demand

**Serving (24/7):**
- Instance: t3.medium
- vCPU: 2
- RAM: 4GB
- Cost: ~$0.042/hr = ~$30/month
- Storage: 20GB gp3 EBS

### Setup Steps

```bash
# 1. Launch EC2 instance
# Use Deep Learning AMI (Ubuntu 22.04) for GPU instance
# Use Ubuntu 22.04 for CPU serving instance

# 2. Connect via SSH
ssh -i your-key.pem ubuntu@<ec2-ip>

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install Python dependencies
sudo apt install python3-pip -y
pip3 install -r requirements.txt

# 5. Copy project files
# (From local machine)
scp -r enviroguard-ml/ ubuntu@<ec2-ip>:/app/

# 6. Train models (see "Training the Models" section)

# 7. Set up systemd service (see "Running the Server" section)

# 8. Configure security group
# Allow inbound: Port 8000 (HTTP) from mobile app IP
# Allow inbound: Port 22 (SSH) from your IP
```

### Security Checklist

- ✅ Use IAM roles instead of access keys
- ✅ Restrict security group to known IPs
- ✅ Enable CloudWatch logging
- ✅ Set up auto-shutdown for training instances
- ✅ Use spot instances for training (60% savings)
- ✅ Encrypt EBS volumes

---

## For AI Tools

### Stack Summary

- **Language:** Python 3.9+
- **Framework:** FastAPI (async web framework)
- **ML Libraries:** ultralytics (YOLOv8), prophet (time-series)
- **Dependencies:** torch, pandas, numpy, scikit-learn, matplotlib

### File Organization

```
enviroguard-ml/
├── main.py                 # FastAPI app with all endpoints
├── requirements.txt        # Pinned dependencies
├── data/
│   ├── generate_data.py    # Synthetic data generator (RUN THIS)
│   ├── download_taco.py    # TACO dataset downloader (EC2 only)
│   ├── noise_synthetic.csv # Generated by generate_data.py
│   └── fill_synthetic.csv  # Generated by generate_data.py
├── models/
│   ├── litter/
│   │   ├── train.py        # YOLOv8 training script (EC2 GPU)
│   │   ├── infer.py        # Inference + severity logic
│   │   └── best.pt         # Trained weights (after training)
│   ├── noise/
│   │   ├── train_noise.py  # Prophet training (EC2 CPU)
│   │   ├── infer_noise.py  # 24h forecast generation
│   │   └── *_model.pkl     # Trained models (after training)
│   └── fill/
│       ├── train_fill.py   # Prophet training (EC2 CPU)
│       ├── infer_fill.py   # 48h forecast + overflow
│       └── *_model.pkl     # Trained models (after training)
├── test_models.py          # Pytest suite (13 tests)
└── README.md               # This file
```

### Migration Checklist

**Locally (zero compute):**
- [x] Write all Python code
- [x] Generate synthetic CSVs
- [ ] Push to GitHub

**On EC2 (all compute):**
- [ ] Copy folder to EC2
- [ ] Run `python data/generate_data.py`
- [ ] Run `python models/noise/train_noise.py`
- [ ] Run `python models/fill/train_fill.py`
- [ ] Run `python data/download_taco.py`
- [ ] Run `python models/litter/train.py`
- [ ] Start server: `uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] Run tests: `pytest test_models.py -v`

**Integration:**
- [ ] Update mobile app `.env` with EC2 IP
- [ ] Test endpoints from mobile app
- [ ] Wire Health tab to `/predict-noise` and `/predict-fill`
- [ ] Wire Report tab to `/detect-litter`

### Known Limitations

1. **TACO mAP:** Dataset is challenging, mAP@50 ~0.45-0.55 is realistic
2. **Overflow accuracy:** ±2 hours is target, depends on fill rate variability
3. **Single model per station:** No ensemble, no A/B testing
4. **No authentication:** Add JWT middleware before production
5. **No rate limiting:** Add in production

---

## Troubleshooting

### "Model not loaded" error

**Symptom:** `/health` shows `models_loaded: 0`

**Fix:**
```bash
# Check if model files exist
ls -lh models/litter/best.pt
ls -lh models/noise/*.pkl
ls -lh models/fill/*.pkl

# If missing, train models first
python models/noise/train_noise.py
python models/fill/train_fill.py
python models/litter/train.py
```

### CUDA out of memory (YOLOv8 training)

**Symptom:** `RuntimeError: CUDA out of memory`

**Fix:**
```bash
# Reduce batch size in models/litter/train.py
# Change: batch=16 → batch=8
# Or use larger GPU instance (g4dn.2xlarge)
```

### Prophet import error

**Symptom:** `ModuleNotFoundError: No module named 'prophet'`

**Fix:**
```bash
# Prophet requires pystan
pip install prophet pandas matplotlib
```

### Port 8000 already in use

**Symptom:** `OSError: [Errno 98] Address already in use`

**Fix:**
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

## License

[Your License Here]

---

**Built for AWS Hackathon 2026**  
Code written by Claude Code based on EnviroGuard ML PRD
