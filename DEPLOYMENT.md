# FarmDirect — Production Deployment Guide

FarmDirect is architected as a **unified full-stack production service**. The Flask backend directly serves the compiled high-performance React SPA bundle alongside all `/api/*` REST endpoints with client-side SPA routing support.

---

## 🌐 1. Live Public Link (24/7 Cloud Deployed)

The application is **officially deployed and running 24/7 on Render Cloud**:

🔗 **Permanent Live URL:** [https://farmdirect-bqe2.onrender.com](https://farmdirect-bqe2.onrender.com)

### Quick Demo Credentials (Password for all: `password123`)
| Role | Email | Features to Test |
| :--- | :--- | :--- |
| **Farmer** | `rajesh@farmer.in` | Manage produce listings, view incoming buyer requests, counter-offer in negotiation timeline, confirm orders. |
| **Buyer** | `priya@freshmart.in` | Browse marketplace, AI Smart Match recommendations with explainable scores, negotiate counter-offers, track 4-stage orders. |
| **Admin** | `admin@farmdirect.in` | Platform-wide analytics, manage all users, review dispute escalations, monitor active orders. |

---

## ☁️ 2. Free 24/7 Cloud Deployment (Render.com)

Deploy permanently to Render.com's free web service tier in **under 3 minutes**:

### Step 1: Push Code to GitHub
Open a terminal in `C:\Users\USER\.gemini\antigravity\scratch\farmdirect`:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/farmdirect.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and click **New +** ➔ **Web Service**.
2. Connect your GitHub account and select your `farmdirect` repository.
3. Configure the following settings:
   - **Name:** `farmdirect`
   - **Region:** Any (e.g. Oregon / Frankfurt / Singapore)
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `bash build.sh`
   - **Start Command:** `cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app`
   - **Plan:** Free
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.8`
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `generate-a-secure-random-key`
5. Click **Create Web Service**.

> **Note:** A pre-configured `render.yaml` blueprint is already included in the root directory. You can also deploy instantly using Render's **Blueprints** option!

---

## 🚂 3. Railway / Fly.io Deployment (Docker-Based)

Because FarmDirect includes a multi-stage `Dockerfile` (`node:20-alpine` for building React + `python:3.11-slim` with Gunicorn):

### Deploying to Railway.app:
1. Log in to [https://railway.app](https://railway.app).
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select your repository. Railway will detect `Dockerfile` automatically, build the frontend, run the database seed, and launch the service with zero configuration.

### Deploying to Fly.io:
```bash
fly launch
fly deploy
```

---

## 🐳 4. Self-Hosted Docker Deployment (VPS / DigitalOcean / AWS EC2)

To run the container on any Linux VPS, AWS EC2, or local Docker engine:

```bash
# Build the unified container
docker build -t farmdirect:latest .

# Run container on port 80 or 5000
docker run -d -p 80:5000 --name farmdirect_app --restart unless-stopped farmdirect:latest
```

Or using Docker Compose:
```bash
docker-compose up -d
```

---

## 🔒 5. Instant Tunnels (Running on Local Machine with Public Access)

If you want to host directly from your machine with a public HTTPS link at any time:

### Option A: Localhost.run (Built-in via SSH, No Account Required)
```bash
# In one terminal, start backend
cd backend
python app.py

# In another terminal, open the tunnel
ssh -o StrictHostKeyChecking=no -R 80:127.0.0.1:5000 nokey@localhost.run
```

### Option B: Cloudflare Quick Tunnel (Free & Fast)
```bash
cloudflared tunnel --url http://localhost:5000
```

### Option C: Localtunnel
```bash
npx -y localtunnel --port 5000
```
