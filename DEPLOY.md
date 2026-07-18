# Deployment Guide — XAU/USD Live Signal Dashboard

This guide walks you through deploying the XAU/USD Live Signal Dashboard to a production hosting provider. The app is a standard Next.js 16 application — it works on any platform that supports Node.js / Bun.

---

## ✅ Recommended: Vercel (easiest, free tier)

Vercel is the official host for Next.js and supports SSE streaming out of the box.

### Steps

1. **Push to GitHub** (already done — see `git remote -v`).

2. **Go to Vercel**: https://vercel.com/new

3. **Import the GitHub repo**:
   - Click "Import Git Repository"
   - Select the `xauusd-signal-dashboard` repo (or whatever you named it)

4. **Configure the project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `bun run build` (or leave default `next build`)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `bun install` (or `npm install`)
   - **Root Directory**: `./` (default)

5. **Environment Variables** (optional — the app works without any):
   - The app uses no required env vars. The SQLite DATABASE_URL is auto-set by Vercel's Postgres or you can leave it default.
   - If you want to use a real database, add `DATABASE_URL` pointing to a Vercel Postgres or external DB.

6. **Deploy**:
   - Click "Deploy"
   - Wait ~2-3 minutes for the build to complete
   - Vercel assigns a URL like `https://xauusd-signal-dashboard.vercel.app`

7. **Verify**:
   - Visit the deployed URL
   - The live signal banner should show "LIVE" with the current gold price from `gold-api.com`
   - SSE stream should push updates every second

### Notes for Vercel
- **SSE streaming**: Vercel supports SSE on Edge and Node.js runtimes. The `/api/signal/stream` route runs on Node.js with a 300s max duration (see `vercel.json`).
- **Background fetcher**: The signal service runs as an in-process singleton — every Vercel serverless instance has its own fetcher. This is fine for low-traffic use. For high-traffic production, consider moving the fetcher to a separate worker (Upstash QStash, Vercel Cron, or a dedicated service).
- **Cold starts**: The first request after idle may take ~1s extra. Subsequent requests are instant.

---

## Alternative: Railway

Railway supports long-running Node.js processes (better for the background fetcher).

1. Go to https://railway.app/new
2. Connect your GitHub repo
3. Railway auto-detects Next.js — accept defaults
4. Add environment variable `PORT=3000` (Railway sets this automatically)
5. Deploy

---

## Alternative: Render

1. Go to https://render.com → New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `bun run start` (after running `bun run build` once)
   - **Environment**: Node 20+ or Bun
4. Deploy

---

## Alternative: Self-hosted (VPS / Docker)

### Using Bun directly

```bash
# On your VPS:
git clone https://github.com/<your-username>/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
bun install
bun run build
bun run start    # starts production server on port 3000
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source and build
COPY . .
RUN bun run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["bun", "run", "start"]
```

Build and run:

```bash
docker build -t xauusd-signal .
docker run -p 3000:3000 -d --name xauusd-signal xauusd-signal
```

### Using PM2 (process manager)

```bash
bun install
bun run build
pm2 start "bun run start" --name xauusd-signal
pm2 save
pm2 startup    # enable auto-restart on reboot
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `file:./db/custom.db` | SQLite path (local) or Postgres URL (production) |
| `PORT` | No | `3000` | Server port |

The app **does not require any API keys** — it uses the free `gold-api.com` public endpoint for live gold prices.

---

## Post-Deployment Verification

After deploying, run these checks:

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
- ✅ Status badge shows "WAITING FOR ENTRY" (or current state)
- ✅ Countdown timer ticking down
- ✅ Live chart shows price line with entry/SL/TP zones
- ✅ No console errors (F12 → Console)

---

## Troubleshooting

### "No response from /api/signal/stream"
- The SSE endpoint may be buffered by a reverse proxy. Make sure your host supports streaming (Vercel and Railway do; some shared hosts don't).
- Workaround: The frontend auto-falls back to REST polling every 10s — the page still works.

### "Current price is 0" or "source: simulated"
- The `gold-api.com` fetch is failing. Check:
  - Your host allows outbound HTTPS to `api.gold-api.com`
  - The API is up: `curl https://api.gold-api.com/price/XAU`
- The app will use simulated prices as fallback — page still renders.

### "Database connection error"
- The app uses SQLite by default. On serverless hosts (Vercel), SQLite won't persist across instances.
- Solution: Either ignore (the app works without DB — DB is only used if you extend it) or provision Vercel Postgres and set `DATABASE_URL`.

### Cold-start delays on Vercel
- Serverless functions have ~1s cold start after idle. For always-warm, use Railway or a VPS.

---

## Updating the Deployment

Any push to the `main` branch auto-deploys on Vercel/Railway/Render.

```bash
git add .
git commit -m "your update"
git push origin main
```

---

## License

MIT — see `LICENSE` file if present. This is an educational project; trade at your own risk.
