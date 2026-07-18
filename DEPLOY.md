# Deployment Guide — XAU/USD Live Signal Dashboard

This guide walks you through deploying the XAU/USD Live Signal Dashboard to a production hosting provider. The app is a standard Next.js 16 application — it works on any platform that supports Node.js / Bun.

---

## ✅ Recommended: Render (one-click deploy)

The repo includes a `render.yaml` blueprint for one-click deployment.

### Steps

1. **One-click deploy link** — click this URL (login to Render first if needed):

   👉 **https://render.com/deploy?repo=https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard**

   Or manually: open https://dashboard.render.com → **New +** → **Blueprint** → select the `xauusd-signal-dashboard` repo.

2. **Render reads `render.yaml`** and auto-fills:
   - **Name**: `xauusd-signal-dashboard`
   - **Runtime**: Node.js
   - **Plan**: Free
   - **Region**: Singapore
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `GET /api/signal`

3. **Review and click "Apply"** — Render will:
   - Pull the repo
   - Run `npm install`
   - Run `npm run build` (Next.js standalone build — ~2 minutes)
   - Start `npm start` (Node.js serving the standalone build)
   - Issue a URL like `https://xauusd-signal-dashboard.onrender.com`

4. **First deploy takes ~3-5 minutes** (free plan builds are slower than paid). Watch the build logs — you should see:
   ```
   ✓ Compiled successfully in 15.4s
   ✓ Generating static pages using 1 worker (5/5) in 377.5ms
   [signal] starting in-process signal service (60s interval)
   [signal] price=$4019.30 src=gold-api.com status=WAITING dist=$35.70 subs=0
   ```

5. **Verify** at the deployed URL:
   - Live signal banner shows "LIVE" with green pulse
   - Current price $4,019+ from `gold-api.com`
   - Status badge shows "WAITING FOR ENTRY" (or current state)
   - Countdown timer ticking down (60s → 0s → refresh)
   - Live chart shows price line with entry/SL/TP zones

### Notes for Render
- **Free plan limitations**: Service spins down after 15 minutes of inactivity. First request after idle takes ~30s to spin up (cold start). For always-on, upgrade to the Starter plan ($7/month).
- **SSE streaming**: Render supports SSE on Node.js runtime — no special config needed.
- **Background fetcher**: The signal service runs as an in-process singleton — every Render instance has its own fetcher. Free plan = 1 instance, so this works perfectly.
- **SQLite persistence**: The free plan uses an ephemeral filesystem. The SQLite DB resets on each deploy. For the live signal dashboard this is fine (the app doesn't require persistent DB). If you extend the app to store trade history, upgrade to Render Postgres.

### Troubleshooting Render
- **Build fails with "Cannot find module"**: Make sure `npm install` runs first. The `render.yaml` build command is `npm install && npm run build` — both run in sequence.
- **SSE returns 502**: Render's load balancer may time out long connections. The `/api/signal/stream` route has a 5-minute max lifetime per connection (set in code) — clients auto-reconnect.
- **Cold start delays**: Free plan services sleep after 15 min idle. Visit the URL → 30s spin-up → page loads normally.
- **Want always-on?** Upgrade to Starter plan ($7/month) — service stays warm, no cold starts.

---

## Alternative: Vercel

Vercel is the official host for Next.js and supports SSE streaming out of the box.

1. Go to https://vercel.com/new
2. Import the GitHub repo `xauusd-signal-dashboard`
3. Framework preset auto-detects Next.js — accept defaults
4. Click "Deploy"
5. Vercel issues a URL like `https://xauusd-signal-dashboard.vercel.app`

The repo includes `vercel.json` with SSE-compatible function config (300s max duration for `/api/signal/stream`).

---

## Alternative: Railway

Railway supports long-running Node.js processes (better for the background fetcher).

1. Go to https://railway.app/new
2. Connect your GitHub repo
3. Railway auto-detects Next.js — accept defaults
4. Add environment variable `PORT=3000` (Railway sets this automatically)
5. Deploy

---

## Alternative: Self-hosted (VPS / Docker)

### Using Node directly

```bash
# On your VPS:
git clone https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
npm install
npm run build
npm start    # starts production server on port 3000
```

### Using Bun directly

```bash
git clone https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
bun install
bun run build
bun run start:bun    # uses bun runtime (faster startup)
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
