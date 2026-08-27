# Phase 12: Deployment Runbook

Follow this step-by-step deployment guide to deploy the BPS Twin Towers Community PWA to Cloudflare Pages (or Vercel) at zero cost.

---

## 1. Pre-Deployment Validation (Local)
1. Run type check:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: 0 errors.*

2. Run production build:
   ```bash
   npm run build
   ```
   *Expected: Successful build in `/dist`.*

3. Run dependency security audit:
   ```bash
   npm audit
   ```
   *Expected: 0 vulnerabilities.*

---

## 2. Cloudflare Pages Deployment Steps

### Option A: GitHub Continuous Integration (Recommended)
1. Push local Git repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/<your-username>/bps-twin-towers-pwa.git
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select the `bps-twin-towers-pwa` repository.
4. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Configure Environment Variables:
   - `VITE_SUPABASE_URL`: `https://polyjkevdswpsllcgtsk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your_anon_key>`
6. Click **Save and Deploy**.

### Option B: Direct CLI Deployment (Wrangler)
```bash
npx wrangler pages deploy dist --project-name=bps-twin-towers-pwa
```

---

## 3. Google OAuth Production Redirect URL Configuration
1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/polyjkevdswpsllcgtsk) → **Authentication** → **URL Configuration**.
2. Set **Site URL**:
   - `https://bps-twin-towers-pwa.pages.dev` (or your custom domain `https://twintowerbps.com`)
3. Add to **Redirect URLs**:
   - `https://bps-twin-towers-pwa.pages.dev/**`
   - `https://twintowerbps.com/**`
   - `http://localhost:5173/**` (kept for local development)
4. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → Your OAuth 2.0 Client:
   - Add Authorized JavaScript Origins: `https://bps-twin-towers-pwa.pages.dev` and `https://twintowerbps.com`
   - Authorized redirect URI: `https://polyjkevdswpsllcgtsk.supabase.co/auth/v1/callback`

---

## 4. Custom Domain Setup (Optional)
1. In Cloudflare Pages project → **Custom domains** → **Set up a domain**.
2. Enter your custom domain (e.g. `twintowerbps.com`).
3. Point your DNS CNAME record: `twintowerbps.com` → `bps-twin-towers-pwa.pages.dev`.
4. Cloudflare automatically issues and renews Universal SSL / TLS certificates at zero cost.

---

## 5. Post-Deployment Verification
Execute the smoke test protocol in [`docs/production-smoke-test.md`](file:///c:/Users/Mathaiyan/.gemini/antigravity-ide/scratch/bps-twin-towers-pwa/docs/production-smoke-test.md).
