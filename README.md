# NC Business Atlas

A dynamic, D3-powered geospatial visualization tool for exploring business data in North Carolina. Features an interactive SVG map with zoom-dependent detail levels, hierarchical navigation (State -> County -> Zip -> Business), and AI-driven business insights.

## Deployment Guide (Debian/Ubuntu)

This guide details how to deploy the application on a Debian 11/12 or Ubuntu 20.04/22.04 LTS server using Nginx as a web server.

### Prerequisites

- A server running Debian or Ubuntu.
- Root or sudo privileges.
- A Google Gemini API Key.
- A domain name (optional, but recommended for SSL).

### Step 1: Update System & Install Basics

Connect to your server via SSH and update the package repositories.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx unzip
```

### Step 2: Install Node.js (Version 18+)

This project requires Node.js to build the static assets.

```bash
# Download and setup the NodeSource repo (Node v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

### Step 3: Clone or Upload the Project

Navigate to the web directory.

```bash
cd /var/www
```

**Option A: Git Clone (Recommended)**
```bash
# Replace with your actual repository URL
sudo git clone https://github.com/yourusername/nc-business-atlas.git
sudo chown -R $USER:$USER nc-business-atlas
cd nc-business-atlas
```

**Option B: Upload Manually**
If you don't have a git repo, you can upload your project files via SFTP (FileZilla) or SCP to `/var/www/nc-business-atlas`.

### Step 4: Install Dependencies & Build

Install the required npm packages.

```bash
npm install
```

Create an environment file for your API Key.

```bash
nano .env
```

Add the following line inside the file:
```env
# If using Vite
VITE_API_KEY=your_actual_google_gemini_api_key_here
# If using Create React App
REACT_APP_API_KEY=your_actual_google_gemini_api_key_here
```
*(Save and exit: Press `Ctrl+O`, `Enter`, `Ctrl+X`)*

Build the production version of the app.

```bash
npm run build
```

This will create a `dist` (for Vite) or `build` (for CRA) directory containing the optimized HTML, CSS, and JS files.

### Step 5: Configure Nginx

Create a new Nginx server block configuration.

```bash
sudo nano /etc/nginx/sites-available/nc-atlas
```

Paste the following configuration. **Important:** Change `your_domain_or_ip` to your server's IP address or domain name. Ensure the `root` path points to your build folder (`/dist` or `/build`).

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Point this to the 'dist' folder created by 'npm run build'
    root /var/www/nc-business-atlas/dist; 
    index index.html;

    # Serve the React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets for better performance
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```
*(Save and exit: `Ctrl+O`, `Enter`, `Ctrl+X`)*

Enable the site configuration:

```bash
sudo ln -s /etc/nginx/sites-available/nc-atlas /etc/nginx/sites-enabled/
```

Remove the default Nginx page (optional):
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Test the Nginx configuration for errors:
```bash
sudo nginx -t
```

If the test is successful, restart Nginx:
```bash
sudo systemctl restart nginx
```

### Step 6: (Optional) Setup SSL with Certbot

If you are using a domain name, it is highly recommended to secure your site with HTTPS.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the on-screen prompts. Certbot will automatically modify your Nginx configuration to serve HTTPS.

---

### Troubleshooting

- **404 on Refresh**: If you refresh a specific page and get a 404, ensure the `try_files $uri $uri/ /index.html;` line exists in your Nginx config. This redirects all requests to React's router.
- **Permissions**: If Nginx returns a "403 Forbidden", ensure Nginx has read access to your folder:
  ```bash
  sudo chown -R www-data:www-data /var/www/nc-business-atlas/dist
  sudo chmod -R 755 /var/www/nc-business-atlas
  ```
