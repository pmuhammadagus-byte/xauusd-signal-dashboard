# Deployment Guide — XAU/USD Live Signal Dashboard

Manual deployment guide for Render (and other hosts). The app is a standard Next.js 16 application with standalone output — works on any Node.js host.

---

## ✅ Render — Manual Web Service (no blueprint)

### Steps

1. **Go to Render**: https://dashboard.render.com

2. **Create new web service**:
   - Click **New +** (top right)
   - Select **Web Service** (NOT Blueprint)
   - Connect your GitHub account if not already connected
   - Select the repo: `pmuhammadagus-byte/xauusd-signal-dashboard`

3. **Configure the service** (fill in these exact values):

   | Field | Value |
   |---|---|
   | **Name** | `xauusd-signal-dashboard` |
   | **Runtime** | **Node** (default) |
   | **Region** | Singapore (or closest to you) |
   | **Branch** | `main` |
   | **Root Directory** | (leave blank) |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free (`$0/month`) |

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value | Required |
   |---|---|---|
   | `NODE_ENV` | `production` | ✅ Yes |
   | `HOSTNAME` | `0.0.0.0` | ✅ Yes (so server binds to all interfaces) |
   | `DATABASE_URL` | `file:./db/custom.db` | Optional (SQLite, default works) |

   **Do NOT set `PORT`** — Render injects it automatically.

5. **Click "Create Web Service"** — Render will:
   - Pull the repo
   - Run `npm install` (~30-60s)
   - Run `npm run build` (~15-30s)
   - Start `npm start` (Node.js serves `.next/standalone/server.js`)
   - Issue a URL like `https://xauusd-signal-dashboard.onrender.com`

6. **Watch the build logs** — you should see:
   ```
   ==> Running build command 'npm install && npm run build'...
   [...] npm install completed
   [...] > next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
   [...] ▲ Next.js 16.1.3 (Turbopack)
   [...] ✓ Compiled successfully in 14.0s
   [...] ✓ Generating static pages using 1 worker (5/5) in 293.3ms
   [...] ==> Deploying...
   [...] ==> Deployment successful
   ```

7. **Verify** at the deployed URL:
   - Live signal banner shows "LIVE" with green pulse
   - Current price ($4,019+) from `gold-api.com`
   - Status badge shows "WAITING FOR ENTRY"
   - Countdown timer ticking down (60s → 0s → refresh)
   - Live chart shows price line with entry/SL/TP zones

### Notes for Render
- **Free plan limitations**: Service spins down after 15 minutes of inactivity. First request after idle takes ~30s to spin up (cold start). For always-on, upgrade to the Starter plan ($7/month).
- **SSE streaming**: Render supports SSE on Node.js runtime — `/api/signal/stream` works out of the box.
- **Background fetcher**: The signal service runs as an in-process singleton — runs continuously while the service is awake.
- **SQLite**: The free plan uses an ephemeral filesystem. DB resets on each deploy — fine for this app since it doesn't require persistence.

### Troubleshooting Render

**"Build failed"**
- Check build logs for the actual error
- Common cause: missing `npm install` — make sure Build Command is `npm install && npm run build` (not just `npm run build`)

**"Application failed to bind to port"**
- Make sure `HOSTNAME=0.0.0.0` is set in env vars
- Do NOT set `PORT` — Render injects it automatically

**"502 Bad Gateway"**
- Service may be spinning down (free plan). Wait 30s and reload.
- Or upgrade to Starter plan ($7/month) for always-on

**"SSE stream disconnects"**
- Render's load balancer has a timeout. The `/api/signal/stream` route auto-reconnects every 5 minutes (or on disconnect).
- The frontend hook auto-falls back to REST polling every 10s if SSE fails.

---

## Alternative: Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repo `xauusd-signal-dashboard`
3. Framework preset auto-detects Next.js — accept defaults
4. Click "Deploy"
5. URL: `https://xauusd-signal-dashboard.vercel.app`

`vercel.json` is included with SSE-compatible function config.

---

## Alternative: Railway

1. Go to https://railway.app/new
2. Connect your GitHub repo
3. Railway auto-detects Next.js — accept defaults
4. Add env var `HOSTNAME=0.0.0.0` (Railway injects PORT automatically)
5. Deploy

---

## Alternative: Self-hosted (VPS / Docker)

### Using Node directly

```bash
git clone https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
npm install
npm run build
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production npm start
```

### Using Bun directly

```bash
git clone https://github.com/pmuhammadagus-byte/xauusd-signal-dashboard.git
cd xauusd-signal-dashboard
bun install
bun run build
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production bun run start:bun
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy source and build
COPY . .
RUN npm run build

# Expose port
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
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
| `NODE_ENV` | ✅ Yes | — | Set to `production` for deploy |
| `HOSTNAME` | ✅ Yes | — | Set to `0.0.0.0` (bind to all interfaces) |
| `PORT` | ❌ No | `3000` (or auto-injected by host) | Server port — Render/Vercel/Railway inject automatically |
| `DATABASE_URL` | ❌ No | `file:./db/custom.db` | SQLite path or Postgres URL |

The app **does not require any API keys** — it uses the free `gold-api.com` public endpoint for live gold prices.

---

## Post-Deployment Verification

### 1. Health check
```bash
curl https://your-deployed-url.onrender.com/api/signal
```
Expected: JSON with `status: "WAITING"`, `currentPrice: <number>`, `source: "gold-api.com"`.

### 2. SSE stream check
```bash
curl -N https://your-deployed-url.onrender.com/api/signal/stream
```
Expected: Continuous `data: {...}` lines every second.

### 3. Page load
Open the deployed URL in a browser. Verify:
- ✅ Live signal banner shows "LIVE" with green pulse
- ✅ Current price displayed (updates every 60s)
- ✅ Status badge shows "WAITING FOR ENTRY"
- ✅ Countdown timer ticking down
- ✅ Live chart shows price line with entry/SL/TP zones
- ✅ No console errors (F12 → Console)

---

## Updating the Deployment

Any push to the `main` branch auto-deploys on Render (if auto-deploy is enabled).

```bash
git add .
git commit -m "your update"
git push origin main
```

---

## License

MIT — see `LICENSE` file. This is an educational project; trade at your own risk.
