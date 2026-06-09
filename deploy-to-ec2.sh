#!/bin/bash
# Deploy EnviroGuard Frontend to EC2

set -e

EC2_HOST="44.204.121.129"
EC2_USER="ec2-user"
SSH_KEY="~/Downloads/tech.pem"
WEB_DIR="/home/ec2-user/enviroguard-web"

echo "🚀 Deploying EnviroGuard to EC2..."

# 1. Upload the dist archive
echo "📦 Uploading web build..."
scp -i $SSH_KEY /tmp/enviroguard-web-dist.tar.gz $EC2_USER@$EC2_HOST:/tmp/

# 2. SSH in and deploy
echo "🔧 Extracting and deploying on EC2..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
  # Backup old version
  if [ -d ~/enviroguard-web ]; then
    echo "📂 Backing up old version..."
    mv ~/enviroguard-web ~/enviroguard-web.backup.$(date +%Y%m%d_%H%M%S)
  fi

  # Create new directory
  mkdir -p ~/enviroguard-web

  # Extract new build
  echo "📂 Extracting new build..."
  tar -xzf /tmp/enviroguard-web-dist.tar.gz -C ~/enviroguard-web/

  # Clean up
  rm /tmp/enviroguard-web-dist.tar.gz

  # Check if serve is installed
  if ! command -v serve &> /dev/null; then
    echo "⚠️  'serve' not found. Installing..."
    npm install -g serve
  fi

  # Kill old serve process if running
  echo "🛑 Stopping old server..."
  pkill -f "serve.*enviroguard-web" || true

  # Start new server in background
  echo "✅ Starting new server..."
  cd ~/enviroguard-web
  nohup serve -s . -l 80 > ~/enviroguard-web.log 2>&1 &

  echo "✅ Deployment complete!"
  echo "📊 Server running on port 80"
  echo "📝 Logs: ~/enviroguard-web.log"
EOF

echo ""
echo "✅ Deployment successful!"
echo "🌐 App is live at: http://$EC2_HOST"
echo ""
echo "To check logs:"
echo "  ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'tail -f ~/enviroguard-web.log'"
