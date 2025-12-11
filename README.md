# NC Business Atlas

A dynamic, D3-powered geospatial visualization tool for exploring business data in North Carolina.

## Server Installation

This repository contains a **single setup script** (`setup.sh`) that automates the deployment on **Ubuntu, Debian, Fedora, OpenSUSE, and Arch Linux**.

It performs the following:
1. Detects the Operating System.
2. Installs system dependencies (Node.js 20+, Git, Build Tools).
3. Prompts for your **Gemini API Key** (if not configured).
4. Installs project dependencies & builds the application.
5. Sets up an **Express.js** server managed by **PM2**.
6. Serves the app on port **3030** (Host: `0.0.0.0`).

### Instructions

1.  **Upload** the project files to your server.
2.  **Run** the following command in the project directory:

```bash
# Create the script
cat << 'EOF' > setup.sh
#!/bin/bash
set -e

# --- Configuration ---
PORT=3030
SERVICE_NAME="nc-atlas"
APP_DIR=$(pwd)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting NC Business Atlas Installer...${NC}"

# --- 1. OS Detection & System Deps ---
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}❌ Cannot detect OS. /etc/os-release not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}👉 Detected OS: $OS${NC}"
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"

if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    sudo apt-get update
    sudo apt-get install -y curl git unzip build-essential
    # Install Node.js 20.x
    if ! command -v node &> /dev/null; then
        echo "   Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

elif [[ "$OS" == "fedora" ]]; then
    sudo dnf install -y git nodejs unzip make gcc-c++ findutils

elif [[ "$OS" == "opensuse" || "$OS" == "opensuse-leap" || "$OS" == "opensuse-tumbleweed" ]]; then
    sudo zypper refresh
    sudo zypper install -y git nodejs npm unzip patterns-devel-base-devel_basics

elif [[ "$OS" == "arch" ]]; then
    sudo pacman -Syu --noconfirm git nodejs npm unzip base-devel

else
    echo -e "${RED}❌ OS '$OS' not directly supported by this script.${NC}"
    echo "Please install Node.js (v20+), NPM, and Git manually, then run this script again."
    exit 1
fi

# Verify Node installation
NODE_VER=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VER installed.${NC}"

# --- 2. API Key Configuration ---
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}🔑 No .env file found.${NC}"
    echo -n "👉 Please enter your Google Gemini API Key: "
    read API_KEY
    
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ API Key is required for the build process.${NC}"
        exit 1
    fi
    
    echo "VITE_API_KEY=$API_KEY" > .env
    echo -e "${GREEN}✅ .env file created.${NC}"
else
    echo -e "${GREEN}✅ .env file exists.${NC}"
fi

# --- 3. App Setup & Build ---
echo -e "${YELLOW}🛠️  Installing NPM dependencies...${NC}"
npm install

echo -e "${YELLOW}➕ Installing Express server...${NC}"
npm install express

echo -e "${YELLOW}⚙️  Installing PM2 (Process Manager)...${NC}"
sudo npm install -g pm2

echo -e "${YELLOW}🏗️  Building Application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. 'dist' directory missing.${NC}"
    exit 1
fi

# --- 4. Start Server ---
echo -e "${YELLOW}🚀 Starting Server on Port $PORT...${NC}"

# Stop existing if any
pm2 delete $SERVICE_NAME 2>/dev/null || true

# Start
pm2 start server.js --name "$SERVICE_NAME"

# Save list
pm2 save

echo -e "${YELLOW}🔄 Setting up PM2 Startup Hook...${NC}"
# Generate startup script and execute it
# This handles the sudo requirement for systemd integration
PM2_STARTUP=$(pm2 startup | grep "sudo env" || true)
if [ ! -z "$PM2_STARTUP" ]; then
    eval $PM2_STARTUP
fi

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}✅ INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "👉 App is running internally on: ${YELLOW}http://0.0.0.0:$PORT${NC}"
echo -e "👉 Configure your Nginx/Reverse Proxy to forward to this address."
echo -e "👉 View logs with: ${YELLOW}pm2 logs $SERVICE_NAME${NC}"

EOF

# Make executable and run
chmod +x setup.sh
sudo ./setup.sh
```
