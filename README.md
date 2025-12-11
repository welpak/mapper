# NC Business Atlas

A dynamic, D3-powered geospatial visualization tool for exploring business data in North Carolina.

## Server Installation

This repository contains a **bootstrap setup script** that automates the deployment on **Ubuntu, Debian, Fedora, OpenSUSE, and Arch Linux**.

It performs the following:
1. Detects the Operating System.
2. Installs **Git** (if missing).
3. **Clones** this repository.
4. Installs system dependencies (Node.js 20+, Build Tools).
5. Prompts for your **Gemini API Key**.
6. Builds the app and starts the **Express.js** server via **PM2** on port **3030**.

### Instructions

1.  SSH into your server.
2.  Create the installer script:
    ```bash
    nano setup.sh
    ```
3.  Paste the code below into the file. **IMPORTANT:** Update the `REPO_URL` variable at the top with your actual repository URL.

```bash
#!/bin/bash
set -e

# --- Configuration ---
# REPLACE THIS WITH YOUR REPO URL
REPO_URL="https://github.com/your-username/nc-business-atlas.git" 

PORT=3030
SERVICE_NAME="nc-atlas"
TARGET_DIR="nc-business-atlas"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting NC Business Atlas Installer...${NC}"

# --- 1. OS Detection & Git Installation ---
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}❌ Cannot detect OS. /etc/os-release not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}👉 Detected OS: $OS${NC}"
echo -e "${YELLOW}📦 Checking for Git...${NC}"

if ! command -v git &> /dev/null; then
    echo "   Git not found. Installing..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo apt-get update && sudo apt-get install -y git
    elif [[ "$OS" == "fedora" ]]; then
        sudo dnf install -y git
    elif [[ "$OS" == "opensuse" || "$OS" == "opensuse-leap" || "$OS" == "opensuse-tumbleweed" ]]; then
        sudo zypper install -y git
    elif [[ "$OS" == "arch" ]]; then
        sudo pacman -Syu --noconfirm git
    else
        echo -e "${RED}❌ Cannot install Git automatically on $OS. Please install it manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Git is already installed.${NC}"
fi

# --- 2. Clone Repository ---
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}📂 Directory '$TARGET_DIR' already exists. Pulling latest changes...${NC}"
    cd "$TARGET_DIR"
    git pull
else
    echo -e "${YELLOW}wv Cloning repository...${NC}"
    git clone "$REPO_URL" "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# --- 3. System Dependencies (Node.js & Build Tools) ---
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"

if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    sudo apt-get update
    sudo apt-get install -y curl unzip build-essential
    # Install Node.js 20.x
    if ! command -v node &> /dev/null; then
        echo "   Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

elif [[ "$OS" == "fedora" ]]; then
    sudo dnf install -y nodejs unzip make gcc-c++ findutils

elif [[ "$OS" == "opensuse" || "$OS" == "opensuse-leap" || "$OS" == "opensuse-tumbleweed" ]]; then
    sudo zypper install -y nodejs npm unzip patterns-devel-base-devel_basics

elif [[ "$OS" == "arch" ]]; then
    sudo pacman -Syu --noconfirm nodejs npm unzip base-devel

fi

# Verify Node installation
NODE_VER=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VER installed.${NC}"

# --- 4. API Key Configuration ---
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

# --- 5. App Setup & Build ---
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

# --- 6. Start Server ---
echo -e "${YELLOW}🚀 Starting Server on Port $PORT...${NC}"

# Stop existing if any
pm2 delete $SERVICE_NAME 2>/dev/null || true

# Start
pm2 start server.js --name "$SERVICE_NAME"

# Save list
pm2 save

echo -e "${YELLOW}🔄 Setting up PM2 Startup Hook...${NC}"
# Generate startup script and execute it
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
```

4.  Make executable and run:
    ```bash
    chmod +x setup.sh
    sudo ./setup.sh
    ```
