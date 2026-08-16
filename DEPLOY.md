# Deployment Guide

## Quick Start: Deploy Frontend to Vercel

The frontend (React app) is configured to deploy to [Vercel](https://vercel.com) with zero extra configuration.

### Prerequisites
- Push this repository to GitHub (or GitLab/Bitbucket — Vercel supports all)
- Have a Vercel account (free tier is fine)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Nisos app ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/projectbank.git
git push -u origin main
```

### Step 2: Import into Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Click **Import**
5. Vercel will auto-detect the build command from `vercel.json`
6. Click **Deploy**

Your app will be live at `https://isos-six.vercel.app` (or your project's default domain).

---

## Backend Configuration

### Option A: Keep Backend Local (Demo/Testing)

The deployed frontend will try to reach your backend at the fallback URL `http://localhost:3001`. This only works if you're running the backend on your development machine and accessing the app from the same machine.

**For live presentations:** Run both servers locally:
```bash
npm run demo
```

### Option B: Deploy Backend to Railway (Production)

The backend is a plain Express server with file-based storage — it needs a host that keeps a
process running (not a serverless platform like Vercel functions, which would lose the JSON
"database" between requests). [Railway](https://railway.app) fits this and has a free tier.

**Steps (all in Railway's dashboard, no CLI needed):**

1. Push this repo to GitHub (see Step 1 above) if you haven't already.
2. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → pick this repo.
3. In the new service's **Settings**:
   - **Root Directory**: `server`
   - Railway auto-detects Node and reads `server/railway.json` for the build/start config.
4. Railway assigns a public URL automatically (Settings → Networking → **Generate Domain**), e.g.
   `https://nisos-backend-production.up.railway.app`.
5. **Attach a Volume** (Settings → Volumes → **New Volume**, mount path `/app/data`). Without this,
   every redeploy wipes the accounts/users/transactions JSON files — Railway's container
   filesystem is not persistent across deploys on its own.
6. Copy the generated URL, then on **Vercel** (your frontend project):
   - Project Settings → **Environment Variables**
   - Add `VITE_API_URL` = `https://your-backend.up.railway.app`
   - Redeploy the frontend so it picks up the new variable.

Render.com works the same way (also needs a persistent disk add-on for the same reason). Avoid
purely serverless hosts (Vercel Functions, AWS Lambda, Cloudflare Workers) for this backend as-is —
they'd need the file storage swapped for a real database first.

---

## What Gets Deployed

✅ **Frontend (React app)** — deployed to Vercel  
❓ **Backend (server/index.js)** — stays on your machine or needs separate deployment  

---

## Local Development

For local development with both servers:

```bash
npm run demo
```

This starts:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

Both will use each other automatically.

---

## Environment Variables

Vercel will automatically use `VITE_API_URL` if set. If not set, the app falls back to `http://localhost:3001`.

### For the Presidential Demo

If presenting on a single machine with both servers running:
1. Start both servers: `npm run demo`
2. Open http://localhost:5173 in a browser
3. Login with `citizen@nisos.cy` / PIN `1234`
4. All real data flows from the local backend

**No deployment needed for demo.** Just run locally.

---

## Troubleshooting

**"Cannot reach backend"**
- Check backend is running: `curl http://localhost:3001/health`
- Verify CORS allows your domain (see server/index.js)

**"Build fails on Vercel"**
- Check build logs in Vercel dashboard
- Run `npm run build` locally and verify it passes

**"Old data showing in production"**
- Clear browser cache or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Service worker caches aggressively — update cache version in public/sw.js if needed
