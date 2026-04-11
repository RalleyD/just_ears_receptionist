# Northflank Migration Plan

Migrate the Node.js backend from Render to Northflank. The project was scaffolded from a Replit template that included a React frontend, but that frontend is empty scaffolding (no real pages). The goal is to strip out the Vite/React layer so the server is a pure API/WebSocket backend, then containerise it with Docker for Northflank.

---

## Overview of Changes

| # | What | File |
|---|------|------|
| 1 | Remove Vite/static-serving wiring | `server/index.ts` |
| 2 | Create Dockerfile | `Dockerfile` (repo root) |
| 3 | Create .dockerignore | `.dockerignore` (repo root) |
| 4 | Configure service on Northflank | (Northflank UI) |

---

## Step 1 — Clean up `server/index.ts`

Open [server/index.ts](../server/index.ts).

The file currently imports `setupVite` and `serveStatic` from `./vite`, and uses them like this:

```typescript
if (app.get("env") === "development") {
  await setupVite(app, server);    // runs Vite dev server in dev mode
} else {
  serveStatic(app);                // serves dist/public/ in production
}
```

**Think about this:** `serveStatic` looks for files in `dist/public/` — the output of `vite build`. We're removing `vite build` from the process entirely. What happens at startup if that directory doesn't exist?

**What to change:**

1. On the import line, remove `setupVite` and `serveStatic`, keep only `log`:
   ```typescript
   // Before
   import { setupVite, serveStatic, log } from "./vite";

   // After
   import { log } from "./vite";
   ```

2. Delete the entire `if/else` block (the 6 lines shown above, including the comment above it).

`log` is still used by the request logger middleware, so keep that import.

---

## Step 2 — Create `.dockerignore`

Create a new file called `.dockerignore` at the repo root (same level as `package.json`).

```
node_modules
dist
.git
.gitignore
.env
.DS_Store
.vscode
dashboard
client
```

**Think about this:** Why do we exclude `node_modules` if the app needs them to run? Where do they come from instead?

**Hint:** Docker installs them fresh inside the container during the build. If you copy them in from your machine, you risk shipping binaries compiled for the wrong OS (your Mac vs. the Linux container).

**Why `.env`?** Environment variables contain secrets (API keys, database passwords). They must never be baked into a Docker image — anyone who pulls the image would have your keys.

---

## Step 3 — Create `Dockerfile`

Create a new file called `Dockerfile` at the repo root.

This Dockerfile uses **two stages**. Here's why that matters:

`esbuild` (the tool that compiles `server/index.ts` into `dist/index.js`) is a **devDependency** in `package.json`. If you only install production dependencies, esbuild isn't available and you can't compile the server. But you also don't want to ship all your dev tools in the final image.

**Two-stage pattern:**
- **Stage 1 (builder):** install everything → compile the server → `dist/index.js` exists
- **Stage 2 (runner):** fresh start, install only prod deps, copy in `dist/` — no dev tools shipped

```dockerfile
# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
```

**Questions to think through as you write this:**

- **Why `COPY package.json package-lock.json ./` before `COPY . .`?**
  Docker builds images in layers. If you copy package files first and run `npm ci`, that layer is cached. On the next build, if your source code changed but `package.json` didn't, Docker reuses the cached deps layer and skips reinstalling — much faster.

- **What does `--packages=external` mean in the esbuild command?**
  It tells esbuild *not* to bundle npm packages into `dist/index.js`. They stay as `require()`/`import` calls. That's why Stage 2 still needs `node_modules/`.

- **Why `npm ci` instead of `npm install`?**
  `npm ci` installs exactly what's in `package-lock.json` and fails if there's a mismatch. It's deterministic and faster in CI/Docker contexts.

- **What does `--omit=dev` do in Stage 2?**
  Skips installing devDependencies. That's vite, esbuild, tsx, wrangler, TypeScript, etc. — easily hundreds of MB you don't need at runtime.

---

## Step 4 — Northflank Setup

### 4.1 Commit and push
Push `Dockerfile`, `.dockerignore`, and your `server/index.ts` change to GitHub.

### 4.2 Create a Northflank project
- Sign up at northflank.com
- Create a new **Project** (e.g. "just-ears-receptionist")

### 4.3 Create a Combined Service
- Choose **"Combined Service"** — this handles build + deploy in one place
- Connect your GitHub repo and select the branch
- Set **Build type** → **Dockerfile**
- Northflank will auto-detect the `Dockerfile` at the repo root

### 4.4 Configure the port
- Set **internal port** to `5000`

### 4.5 Set environment variables
In the service's **Environment** tab, add:

```
OPENAI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_NUMBER
N8N_WEBHOOK_BASE_URL
TRANSFER_NUMBER
DATABASE_URL
SESSION_SECRET
```

These come from `server/config.ts`. They are injected at runtime — never put them in the Dockerfile.

### 4.6 Deploy
- Trigger the first build and watch the build logs
- Confirm runtime logs show: `serving on port 5000`

### 4.7 Update Twilio webhook URL
Northflank gives you a public URL like `https://abc123.northflank.app`.

In the Twilio console:
- Phone Numbers → your number → Voice webhook
- Update to: `https://your-northflank-url/api/incoming-call`

---

## Verification

1. Build locally: `docker build -t just-ears .`
2. Run locally: `docker run -p 5000:5000 --env-file .env just-ears`
3. Confirm the API responds (e.g. `curl http://localhost:5000/api/health`)
4. Deploy to Northflank → check build + runtime logs
5. Make a test call to confirm Twilio reaches the new webhook URL
