# 🌿 EnviroGuard - AWS Hackathon 2026

> **AI-Powered Environmental Health Monitoring & Civic Engagement Platform**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20API%20Gateway-orange)
![ML](https://img.shields.io/badge/ML-TensorFlow%20%7C%20LSTM-blue)
![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%204.5-purple)

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Team](#team)

---

## 🎯 Overview

EnviroGuard is a comprehensive environmental health monitoring platform that combines:

- **Real-time ML predictions** for noise, air quality, pollen, and litter
- **AI-powered civic engagement** with automated petition generation
- **Community reporting** with photo analysis using Claude Vision
- **Interactive maps** and data visualization
- **Social features** for community organizing

**Problem:** Citizens lack tools to monitor environmental health and organize civic action.

**Solution:** EnviroGuard provides predictive insights and automates the path from community concern to government petition.

---

## 🚀 Live Demo

**Frontend (Web):** http://44.204.121.129  
**API Gateway:** https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2  
**ML Server:** http://44.204.121.129:8000

### Test Credentials
```
Email: test@enviroguard.com
Password: test123
```

### Try These Features:
1. **View ML Predictions** → Home Tab → See 24hr forecasts
2. **Submit Report** → Report Tab → Upload photo, get AI analysis
3. **Create Petition** → Community Tab → Get 10 agreements on a post
4. **Interactive Map** → Map Tab → View all reports geographically

---

## ✨ Key Features

### 🤖 AI & Machine Learning

- **LSTM Time-Series Forecasting** (4 environmental metrics)
  - Noise levels (dB)
  - Air Quality Index (AQI)
  - Pollen count
  - Litter density
  - 24-hour predictions with confidence intervals

- **Claude Vision Analysis**
  - Photo analysis for environmental reports
  - Automatic category detection
  - Severity assessment
  - Location verification

- **AI Petition Generation**
  - Automatically creates formal petitions when posts reach 10 agreements
  - Claude identifies correct NYC officials to send to
  - Generates professional petition text

### 📊 Real-Time Monitoring

- Live environmental data dashboard
- Historical trends and charts
- Neighborhood-level granularity
- Color-coded severity indicators

### 🗺️ Interactive Mapping

- Geospatial visualization of all reports
- Heat maps for environmental issues
- Cluster detection
- Filter by category and severity

### 👥 Community Features

- Instagram-like feed of environmental reports
- Comment system
- "I Have This Too" agreement buttons
- Social sharing
- User profiles

### ⚖️ Civic Engagement

- Automatic petition creation at 10 agreements
- Petition signature collection
- Direct routing to NYC officials
- Status tracking (Active → Submitted → Resolved)

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React Native  │ ← Frontend (Web/iOS/Android)
│   + Expo        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Gateway    │ ← AWS API Gateway (REST)
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌───────┐  ┌───────────┐
│Lambda │  │  DynamoDB │ ← Serverless Backend
│(Node) │→ │  Tables   │
└───┬───┘  └───────────┘
    │
    ↓
┌───────────┐
│  EC2 ML   │ ← Flask + TensorFlow LSTM
│  Server   │
└───────────┘
    │
    ↓
┌───────────┐
│  Claude   │ ← Anthropic API
│    API    │
└───────────┘
```

### Data Flow

1. **User Action** → React Native Frontend
2. **API Call** → API Gateway → Lambda Function
3. **ML Prediction** → Lambda → EC2 ML Server → LSTM Model
4. **AI Analysis** → Lambda → Claude API → Vision/Text Generation
5. **Data Storage** → DynamoDB Tables
6. **Response** → Frontend Updates UI

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native (Expo)
- **Navigation:** React Navigation
- **State:** React Hooks + Context
- **Animations:** Reanimated 3
- **Maps:** react-native-maps
- **Charts:** react-native-svg + custom

### Backend
- **API:** AWS API Gateway (REST)
- **Compute:** AWS Lambda (Node.js 18)
- **Database:** DynamoDB (7 tables)
- **Auth:** JWT tokens
- **Storage:** S3 (for photos - planned)

### Machine Learning
- **Framework:** TensorFlow 2.x
- **Model:** LSTM (Long Short-Term Memory)
- **Server:** Flask on EC2
- **Training:** Jupyter Notebooks
- **Data:** NYC Open Data + Synthetic

### AI
- **Provider:** Anthropic Claude
- **Models:** Claude Sonnet 4.5
- **Features:** Vision analysis, text generation

### Infrastructure
- **Cloud:** AWS
- **CDN:** CloudFront (planned)
- **Monitoring:** CloudWatch
- **CI/CD:** Manual deployment (GitOps planned)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS CLI configured
- Anthropic API key (for AI features)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/enviroguard.git
cd AWS_BEN_HACKATHON_2026
```

### 2. Frontend Setup

```bash
cd enviroguard
npm install
cp .env.example .env
# Edit .env with your API endpoints
npm start
```

Open http://localhost:8081 in your browser.

### 3. Lambda Functions Setup

Each Lambda function has its own folder:

```bash
# Example: posts-fn
cd posts-fn
zip posts-fn.zip index.js
# Upload to AWS Lambda console
```

### 4. ML Server Setup

```bash
cd enviroguard-ml
pip install -r requirements.txt
python ml_server.py
# Server runs on port 8000
```

### 5. Database Setup

Run the DynamoDB table creation scripts in `docs/technical/`.

Tables needed:
- users
- posts
- petitions
- petition_signatures
- agreement
- comments
- env_readings

---

## 📁 Project Structure

```
AWS_BEN_HACKATHON_2026/
├── enviroguard/              # React Native Frontend
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API clients
│   │   ├── utils/            # Helpers
│   │   └── navigation/       # Navigation config
│   ├── assets/               # Images, fonts
│   └── package.json
│
├── Lambda Functions/         # Backend serverless functions
│   ├── posts-fn/             # Posts CRUD + AI analysis
│   ├── petitions-fn/         # Petition management
│   ├── users-fn/             # Auth + user management
│   ├── messages-fn/          # Direct messaging
│   ├── env-data-fn/          # Environmental data
│   └── ml-proxy-fn/          # ML prediction proxy
│
├── enviroguard-ml/           # Machine Learning
│   ├── models/               # Trained LSTM models
│   ├── notebooks/            # Jupyter notebooks
│   ├── ml_server.py          # Flask API server
│   └── requirements.txt
│
├── docs/                     # Documentation
│   ├── technical/            # API, deployment guides
│   ├── archive/              # Development notes
│   ├── EnviroGuard_PRD.pdf   # Product requirements
│   └── EnviroGuard_ML_PRD.pdf
│
└── README.md                 # This file
```

---

## 📡 API Documentation

### Base URL
```
https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2
```

### Key Endpoints

#### Authentication
```
POST /users              # Sign up
POST /login              # Log in
GET /users/{user_id}     # Get user profile
```

#### Posts
```
GET /posts                      # List posts
POST /posts                     # Create post (with AI analysis)
GET /posts/{post_id}            # Get post details
DELETE /posts/{post_id}         # Delete post (owner only)
POST /agree/{post_id}           # Agree with post
GET /agree/{post_id}            # Check agreement status
```

#### Petitions
```
GET /petitions?status=active    # List petitions
POST /petitions/{id}/sign       # Sign petition
GET /petitions/{id}             # Get petition details
```

#### ML Predictions
```
GET /predict-noise/{neighborhood}?mode=ml   # 24hr noise forecast
GET /predict-aqi/{neighborhood}?mode=ml     # Air quality forecast
GET /predict-pollen/{neighborhood}?mode=ml  # Pollen forecast
GET /predict-litter/{neighborhood}?mode=ml  # Litter forecast
```

#### Comments
```
GET /posts/{post_id}/comments          # List comments
POST /posts/{post_id}/comments         # Add comment
DELETE /posts/{post_id}/comments/{id}  # Delete comment
```

See `docs/technical/TEST_API_ENDPOINTS.md` for full API documentation.

---

## 🚢 Deployment

### Frontend (EC2 + Nginx)

```bash
# Build
cd enviroguard
npx expo export --platform web

# Deploy to EC2
scp -i ~/tech.pem -r dist/* ec2-user@44.204.121.129:/usr/share/nginx/html/
ssh -i ~/tech.pem ec2-user@44.204.121.129 'sudo systemctl reload nginx'
```

### Lambda Functions

```bash
# Example: Update posts-fn
cd posts-fn
zip posts-fn.zip index.js
# Upload via AWS Lambda Console or CLI:
aws lambda update-function-code --function-name posts-fn --zip-file fileb://posts-fn.zip
```

### ML Server (EC2)

```bash
# Already running as background process
ssh -i ~/tech.pem ec2-user@44.204.121.129
cd ~/ml\ model/enviroguard-ml/
python3 ml_server.py &
```

Full deployment guide: `docs/technical/DEPLOYMENT_INSTRUCTIONS.md`

---

## 📊 Project Status

### ✅ Completed Features

- [x] Frontend (React Native web + mobile-ready)
- [x] Backend API (6 Lambda functions)
- [x] Database schema (7 DynamoDB tables)
- [x] ML predictions (4 environmental metrics)
- [x] Claude Vision integration
- [x] AI petition generation
- [x] User authentication (JWT)
- [x] Community feed & interactions
- [x] Interactive maps
- [x] Comment system
- [x] Delete posts functionality
- [x] Expandable petition UI
- [x] Claude finds correct officials

### 🚧 In Progress / Future

- [ ] S3 photo storage
- [ ] SNS push notifications
- [ ] SES email for petitions
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Multi-city expansion
- [ ] Mobile app deployment (iOS/Android)

---

## 🎓 Key Learnings

### AWS Services Mastery
- Serverless architecture with Lambda + API Gateway
- DynamoDB single-table design patterns
- EC2 for ML workloads
- IAM permissions and security

### AI Integration
- Claude API for vision and text generation
- Prompt engineering for consistent outputs
- Fallback strategies for AI failures

### Machine Learning
- LSTM time-series forecasting
- Model deployment and serving
- Confidence interval prediction

### Full-Stack Development
- React Native cross-platform development
- Expo for rapid iteration
- RESTful API design
- JWT authentication

---

## 👥 Team

**Developer:** Salomon  
**Event:** AWS BEN Hackathon 2026  
**Dates:** May 14 - June 9, 2026  
**AI Pair Programmer:** Claude Code (Sonnet 4.5)  

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- AWS for cloud infrastructure
- Anthropic for Claude API
- NYC Open Data for environmental datasets
- React Native & Expo communities

---

## 📞 Support

**Issues:** GitHub Issues  
**Documentation:** See `/docs` folder  
**Demo:** http://44.204.121.129  

---

**Built with ❤️ for healthier communities**
