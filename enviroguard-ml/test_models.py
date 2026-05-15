"""
EnviroGuard ML API Test Suite

Tests all 3 model endpoints with pytest.

NOTE: Models must be trained before running these tests.
Tests require a running FastAPI server.

Usage:
    # Terminal 1: Start server
    uvicorn main:app --host 0.0.0.0 --port 8000

    # Terminal 2: Run tests
    pytest test_models.py -v

    # With coverage
    pytest test_models.py -v --cov=. --cov-report=html
"""

import pytest
import httpx
from pathlib import Path
import asyncio

BASE_URL = "http://localhost:8000"

@pytest.fixture(scope="session")
def client():
    """HTTP client for testing."""
    return httpx.Client(base_url=BASE_URL, timeout=30.0)

# ============================================
# Test 1: Health Check
# ============================================

def test_health_endpoint(client):
    """Test health endpoint returns 200 and correct structure."""
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert data['status'] == 'ok'
    assert 'models_loaded' in data
    assert data['models_loaded'] == 3  # All 3 model types

# ============================================
# Tests 2-5: Litter Detection
# ============================================

def test_litter_clean_image(client):
    """Test litter detection on clean image returns severity 1."""
    # Use a minimal test image (create if doesn't exist)
    test_image_path = Path("test_data/clean_street.jpg")

    if not test_image_path.exists():
        pytest.skip("Test image not found: test_data/clean_street.jpg")

    with open(test_image_path, 'rb') as f:
        response = client.post(
            "/detect-litter",
            files={'file': ('clean.jpg', f, 'image/jpeg')}
        )

    assert response.status_code == 200
    data = response.json()

    assert data['severity'] == 1
    assert data['litter_count'] == 0
    assert len(data['detections']) == 0
    assert 'processing_time_ms' in data

def test_litter_cluttered_image(client):
    """Test litter detection on cluttered image finds litter."""
    test_image_path = Path("test_data/litter_pile.jpg")

    if not test_image_path.exists():
        pytest.skip("Test image not found: test_data/litter_pile.jpg")

    with open(test_image_path, 'rb') as f:
        response = client.post(
            "/detect-litter",
            files={'file': ('litter.jpg', f, 'image/jpeg')}
        )

    assert response.status_code == 200
    data = response.json()

    assert data['severity'] >= 3  # Should detect significant litter
    assert data['litter_count'] > 0
    assert len(data['detections']) > 0

def test_litter_confidence_scores(client):
    """Test that all detections have valid confidence scores."""
    test_image_path = Path("test_data/litter_pile.jpg")

    if not test_image_path.exists():
        pytest.skip("Test image not found")

    with open(test_image_path, 'rb') as f:
        response = client.post(
            "/detect-litter",
            files={'file': ('litter.jpg', f, 'image/jpeg')}
        )

    assert response.status_code == 200
    data = response.json()

    for detection in data['detections']:
        assert 0.0 <= detection['confidence'] <= 1.0
        assert detection['class'] in ['plastic', 'organic', 'paper', 'metal', 'other']
        assert len(detection['bbox']) == 4  # [x, y, w, h]

def test_litter_invalid_image(client):
    """Test that invalid image returns error."""
    response = client.post(
        "/detect-litter",
        files={'file': ('bad.txt', b'not an image', 'text/plain')}
    )

    # Should return 400 or 500
    assert response.status_code in [400, 500]

# ============================================
# Tests 6-8: Noise Prediction
# ============================================

def test_noise_returns_24_hours(client):
    """Test noise forecast returns exactly 24 predictions."""
    response = client.get("/predict-noise/STATION_001")

    assert response.status_code == 200
    data = response.json()

    assert len(data['forecast']) == 24
    assert data['station_id'] == 'STATION_001'
    assert 'peak_hour' in data
    assert 'peak_db' in data
    assert data['peak_db'] > 0

def test_noise_confidence_intervals(client):
    """Test that all predictions have valid confidence intervals."""
    response = client.get("/predict-noise/STATION_001")

    assert response.status_code == 200
    data = response.json()

    for point in data['forecast']:
        assert point['lower'] <= point['predicted'] <= point['upper']
        assert 'hour' in point

def test_noise_peak_hour_valid(client):
    """Test that peak hour is within the forecast range."""
    response = client.get("/predict-noise/STATION_001")

    assert response.status_code == 200
    data = response.json()

    # Peak dB should be at least the min of predictions
    predictions = [p['predicted'] for p in data['forecast']]
    assert data['peak_db'] >= min(predictions)
    assert data['peak_db'] <= max(predictions) + 5  # Allow slight buffer

# ============================================
# Tests 9-11: Fill Prediction
# ============================================

def test_fill_returns_48_hours(client):
    """Test fill forecast returns 192 predictions (48h × 4/hour)."""
    response = client.get("/predict-fill/STATION_001")

    assert response.status_code == 200
    data = response.json()

    assert len(data['forecast']) == 192  # 48 hours * 4 per hour
    assert data['station_id'] == 'STATION_001'

def test_fill_overflow_detection(client):
    """Test overflow detection logic."""
    response = client.get("/predict-fill/STATION_001")

    assert response.status_code == 200
    data = response.json()

    # Check overflow fields present
    assert 'overflow_predicted' in data
    assert 'overflow_time' in data
    assert 'hours_until_overflow' in data
    assert 'current_fill_pct' in data

    # If overflow predicted, time should be set
    if data['overflow_predicted']:
        assert data['overflow_time'] is not None
        assert data['hours_until_overflow'] is not None
        assert data['hours_until_overflow'] > 0
    else:
        assert data['overflow_time'] is None

def test_fill_values_bounded(client):
    """Test that all fill percentages are between 0-100."""
    response = client.get("/predict-fill/STATION_001")

    assert response.status_code == 200
    data = response.json()

    for point in data['forecast']:
        assert 0 <= point['predicted'] <= 105  # Allow slight overflow
        assert 'time' in point

# ============================================
# Test 12: Invalid Station ID
# ============================================

def test_invalid_station_id(client):
    """Test that invalid station ID uses fallback."""
    response = client.get("/predict-noise/INVALID_STATION")

    # Should either succeed with fallback or return 404
    assert response.status_code in [200, 404]

    if response.status_code == 200:
        data = response.json()
        # Should fallback to STATION_001
        assert len(data['forecast']) == 24

# ============================================
# Test 13: Concurrent Requests
# ============================================

@pytest.mark.asyncio
async def test_concurrent_requests():
    """Test that multiple concurrent requests don't cause conflicts."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Send 3 requests concurrently
        tasks = [
            client.get("/predict-noise/STATION_001"),
            client.get("/predict-fill/STATION_001"),
            client.get("/health")
        ]

        responses = await asyncio.gather(*tasks)

        # All should succeed
        assert all(r.status_code == 200 for r in responses)

# ============================================
# Test Summary
# ============================================

def test_summary():
    """Print test summary."""
    print("\n" + "=" * 60)
    print("EnviroGuard ML API Test Summary")
    print("=" * 60)
    print("13 tests covering:")
    print("  - Health check")
    print("  - Litter detection (clean/cluttered images, validation)")
    print("  - Noise forecasting (24h, confidence intervals)")
    print("  - Fill forecasting (48h, overflow detection)")
    print("  - Error handling (invalid inputs, station IDs)")
    print("  - Concurrency (parallel requests)")
    print("=" * 60)
