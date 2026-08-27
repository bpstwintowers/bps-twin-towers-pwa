# BPS Twin Towers Community PWA — Zero-Cost Architecture Guide

## 1. Zero-Cost Architecture Topology

```
                   INTERNET (HTTPS)
                          │
                          ▼
            [ CLOUDFLARE PAGES / VERCEL ]
                 (Free Static CDN & SPA)
                          │
                          ▼
            [ React 19 + TypeScript PWA ]
            ├── Workbox Service Worker
            ├── Dynamic Route Code Splitting
            └── ErrorBoundary & Offline Banner
                          │
                          ▼ (HTTPS / WSS)
               [ SUPABASE FREE TIER ]
         ┌────────────────┼────────────────┐
         │                │                │
    Supabase Auth     PostgreSQL        Storage
    (Google OAuth)    (40 RLS Tables)  (Private Buckets)
         │                │                │
         └────────────────┼────────────────┘
                          │
                   Supabase Realtime
                          │
                          ▼
                   Community Users
```

---

## 2. Infrastructure Components (100% Free Tier)

| Component | Provider & Tier | Purpose | Cost |
|---|---|---|---|
| **Frontend Hosting** | Cloudflare Pages / Vercel (Free Tier) | Static asset CDN, PWA Service Worker, SPA routing | $0.00 / month |
| **Authentication** | Supabase Auth (Free Tier) | Google OAuth 2.0, JWT token rotation, session management | $0.00 / month |
| **Database** | Supabase PostgreSQL (Free Tier) | Relational database (500 MB quota), 40 RLS tables, 61 RPCs | $0.00 / month |
| **File Storage** | Supabase Storage (Free Tier) | Private file storage (1 GB quota), signed temporary URLs | $0.00 / month |
| **Security & SSL** | Cloudflare / Let's Encrypt | Automatic Universal SSL / TLS certificate | $0.00 / month |
| **PWA & Offline** | Browser Web Standards | Service worker precaching, local app shell | $0.00 / month |

---

## 3. Provider Free-Tier Limits & Capacity Planning

> **Note**: All capabilities are subject to current provider free-tier limits.

- **Cloudflare Pages**:
  - Unlimited bandwidth & requests on free plan.
  - 500 builds per month.
- **Supabase Free Tier**:
  - Up to 500 MB PostgreSQL database storage.
  - Up to 1 GB file storage.
  - Up to 50,000 monthly active users (MAU).
  - 500 MB egress bandwidth.
  - Inactivity pause after 7 days of inactivity (prevented by regular resident/admin access).

---

## 4. Scaling Strategy
For a 2-tower residential community of ~200–500 flats:
- Total active residents: ~300–800 users.
- Database storage growth: ~10–20 MB / year (text records).
- Attachment storage growth: ~100–300 MB / year (compressed photos & parking PDFs).
- **Conclusion**: The entire BPS Twin Towers society runs comfortably within the free tier limits without requiring any paid infrastructure or subscriptions.
