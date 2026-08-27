# Production Incident Checklist & Triage Guide

## 1. Incident Classification
- **P0 (Critical)**: Application outage, login failure, data corruption, unauthorized data exposure.
- **P1 (High)**: Major functional domain unavailable (e.g. Visitor gate check-in or booking system down).
- **P2 (Medium)**: Non-critical feature degradation (e.g. photo upload delay).
- **P3 (Low)**: Minor cosmetic display defect.

---

## 2. Common Scenarios & Triage Procedures

### Scenario A: Google OAuth Login Fails
1. Check browser console for OAuth redirection error code.
2. Verify Supabase Dashboard → **Auth** → **URL Configuration** contains the active production domain in **Redirect URLs**.
3. Verify Google Cloud Console OAuth Client has `https://<supabase-project-ref>.supabase.co/auth/v1/callback` listed in Authorized Redirect URIs.

### Scenario B: Cloudflare Deployment Serves Old Version
1. Hard refresh browser (`Ctrl + Shift + R` or `Cmd + Shift + R`).
2. Cloudflare Dashboard → Pages Project → **Manage deployments** → Check latest commit hash.
3. In Workbox service worker: `sw.js` automatically invalidates previous caches on build revision increment.

### Scenario C: Database Unavailable / Paused
1. Free-tier Supabase projects may enter inactivity pause if no traffic occurs for 7 days.
2. Log into Supabase Dashboard → Click **Restore project** (takes ~60 seconds to resume).
3. Verify connection by running a query in Supabase SQL Editor.

### Scenario D: Storage Attachment Upload Fails
1. Check file size (enforced max: 5 MB).
2. Check file MIME type (allowed: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
3. Verify authenticated resident session is active.
