# Deployment Guide — XAU/USD Live Signal Dashboard

Deploy the dashboard to a production host. The app is a standard Next.js 16 application with standalone output — works on any Node.js platform.

**Recommended order** (easiest to hardest):
1. **Vercel** (recommended) — official Next.js host, free tier, auto-deploy from GitHub
2. **Railway** — long-running process, good for background fetcher
3. **Render** — free plan has 512MB RAM limits
4. **Self-hosted** — VPS / Docker

---

## 🚀 Option 1: Vercel (Recommended — easiest, free, official Next.js host)

Vercel is the official host for Next.js and supports everything out of the box (SSE, serverless functions, auto-deploy from GitHub, global CDN).

### Deploy via Vercel Dashboard (recommended — 2 minutes)

1. **Go to Vercel**: https://vercel.com/new

2. **Import your GitHub repo**:
   - Click **"Import Git Repository"**
   - Find and select `pmuhammadagus-byte/xauusd-signal-dashboard`
   - (If not visible, click "Adjust GitHub App Permissions" to grant access)

3. **Configure project** (Vercel auto-detects Next.js — most fields pre-filled):
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected from package.json)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables** (optional — app works without any):
   - No env vars required. Click "Deploy" directly.

5. **Click "Deploy"** — Vercel will:
   - Pull repo from GitHub
   - Run `npm install`
   - Run `npm run build` (~30 seconds)
   - Deploy to global Edge Network
   - Assign URL: `https://xauusd-signal-dashboard.vercel.app` (or similar)

6. **Watch the build log** — you should see:
   ```
   Running "npm install"
   Running "npm run build"
   ▲ Next.js 16.2.10 (Turbopack)
   ✓ Compiled successfully
   ✓ Generating static pages (5/5)
   Build completed
   Deploying...
   Production: https://xauusd-signal-dashboard.vercel.app
   ```

7. **Verify** at the deployed URL:
   - Live signal banner shows "LIVE" with green pulse
   - Current price from `gold-api.com` (e.g., $4,019)
   - Status badge shows "WAITING FOR ENTRY"
   - Countdown timer ticking
   - Live chart with entry/SL/TP zones

### Deploy via Vercel CLI (alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login (one time)
vercel login

# Deploy from project directory
cd xauusd-signal-dashboard
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your username)
# - Link to existing project? N
# - Project name? xauusd-signal-dashboard
# - In which directory? ./
# - Want to modify settings? N

# Production deploy
vercel --prod
```

### Vercel Notes

- **SSE streaming**: Vercel supports SSE on Node.js runtime. `/api/signal/stream` has 60s max duration (free plan limit). The frontend auto-reconnects every 60s via the `useXauSignal` hook.
- **Background fetcher**: The signal service runs as an in-process singleton inside each serverless function. On Vercel, this means each function invocation has its own fetcher. For high-traffic production, consider moving the fetcher to Vercel Cron (every 60s) + Upstash Redis for shared state. For personal use, current setup works fine.
- **Cold starts**: First request after idle takes ~500ms. Subsequent requests are instant.
- **Free tier limits**: 100GB bandwidth/month, 100GB-Hours serverless execution, unlimited static requests. Plenty for personal use.
- **Auto-deploy**: Every push to `main` branch auto-deploys. PRs get preview URLs.

---

## 🚂 Option 2: Railway (good for long-running background fetcher)

Railway supports long-running Node.js processes — better for the background price fetcher that runs every 60s.

### Deploy via Railway Dashboard

1. **Go to Railway**: https://railway.app/new

2. **Connect GitHub repo**:
   - Click **"Deploy from GitHub repo"**
   - Select `pmuhammadagus-byte/xauusd-signal-dashboard`

3. **Configure** (Railway auto-detects Next.js):
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:simple`
   - **Port**: Railway auto-injects `PORT` env var

4. **Environment Variables**:
   - `HOSTNAME` = `0.0.0.0` (so server binds to all interfaces)
   - `NODE_ENV` = `production`

5. **Deploy** — Railway assigns URL like `https://xauusd-signal-dashboard.up.railway.app`

### Railway Notes

- **Always-on**: Railway keeps the service running 24/7 (no cold starts like Vercel/Render free)
- **Pricing**: $5/month starter plan (includes $5 of usage). Free trial available.
- **Better for background fetcher**: The signal service runs continuously without sleeping.
- **SSE**: Fully supported on Railway.

---

## 🎨 Option 3: Render (free plan with cold starts)

Render free plan works but has 512MB RAM limits and 15-min idle sleep.

### Deploy via Render Dashboard

1. **Go to Render**: https://dashboard.render.com

2. **Create Web Service**:
   - Click **New +** → **Web Service**
   - Select repo `pmuhammadagus-byte/xauusd-signal-dashboard`

3. **Configure**:
   - **Name**: `xauusd-signal-dashboard`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:simple` (NOT `npm start` — avoids standalone dependency)
   - **Instance Type**: Free

4. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `HOSTNAME` = `0.0.0.0`
   - `DATABASE_URL` = `file:./db/custom.db` (optional)

5. **Deploy** — URL: `https://xauusd-signal-dashboard.onrender.com`

### Render Notes (warnings)

- **Free plan limitations**:
  - 512MB RAM (may cause OOM during build with Turbopack)
  - Service sleeps after 15 min idle → 30s cold start on next visit
  - No persistent disk (SQLite DB resets on each deploy)
- **If build fails with OOM**: Upgrade to Starter plan ($7/month, 2GB RAM)
- **For always-on**: Upgrade to Starter plan

---

## 🐳 Option 4: Self-hosted (VPS / Docker)

### Using Node directly on a VPS

```bash
git clone https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
npm install
npm run build
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production npm run start:simple
```

### Using PM2 (process manager, keeps server alive)

```bash
npm install
npm run build
pm2 start "npm run start:simple" --name xauusd-signal
pm2 save
pm2 startup    # auto-restart on reboot
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start:simple"]
```

Build and run:

```bash
docker build -t xauusd-signal .
docker run -p 3000:3000 -d --name xauusd-signal xauusd-signal
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | ✅ Yes | — | Set to `production` |
| `HOSTNAME` | ✅ Yes | — | Set to `0.0.0.0` (bind to all interfaces) |
| `PORT` | ❌ No | `3000` | Server port — Vercel/Railway/Render auto-inject |
| `DATABASE_URL` | ❌ No | `file:./db/custom.db` | SQLite path or Postgres URL |

The app **does not require any API keys** — it uses the free `gold-api.com` public endpoint.

---

## Post-Deployment Verification

### 1. Health check
```bash
curl https://your-deployed-url.vercel.app/api/signal
```
Expected: JSON with `status: "WAITING"`, `currentPrice: <number>`, `source: "gold-api.com"`.

### 2. SSE stream check
```bash
curl -N https://your-deployed-url.vercel.app/api/signal/stream
```
Expected: Continuous `data: {...}` lines every second.

### 3. Page load
Open the deployed URL in a browser. Verify:
- ✅ Live signal banner shows "LIVE" with green pulse
- ✅ Current price displayed (updates every 60s)
- ✅ Status badge shows "WAITING FOR ENTRY"
- ✅ Countdown timer ticking
- ✅ Live chart shows price line with entry/SL/TP zones
- ✅ All sections show data freshness badges
- ✅ No console errors (F12 → Console)

---

## Updating the Deployment

**Vercel/Railway/Render**: Every push to `main` branch auto-deploys.

```bash
git add .
git commit -m "your update"
git push origin main
```

---

## Troubleshooting

### "Build failed" on Vercel
- Check build logs in Vercel dashboard
- Common: missing env var, syntax error. Vercel shows exact error.

### "SSE stream disconnects after 60s" on Vercel
- Vercel free plan limits serverless functions to 60s. The frontend `useXauSignal` hook auto-reconnects.
- For longer sessions, upgrade to Vercel Pro ($20/month) for 300s max duration.

### "Cold start delays" on Render free plan
- Service sleeps after 15 min idle. Visit URL → 30s spin-up → page loads.
- For always-on, upgrade to Starter plan ($7/month).

### "Live price not updating"
- Check `/api/signal` endpoint returns valid JSON
- Check `gold-api.com` is up: `curl https://api.gold-api.com/price/XAU`
- If API down, app uses simulated prices (mean-reverting random walk) as fallback

---

## License

MIT — educational project; trade at your own risk.
