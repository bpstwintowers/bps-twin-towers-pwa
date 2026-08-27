# Deployment Rollback Strategy

## 1. Frontend Application Rollback
- **Hosting Platform Rollback**: Free-tier hosting platforms (Cloudflare Pages, Vercel, Netlify) support instant 1-click rollback to any previous successful Git commit deployment.
- **Service Worker Invalidation**: If an older client version is cached, updating `sw.js` with a higher build revision automatically prompts clients to fetch the latest bundle on next launch.

## 2. Database Rollback Protocol
- **Forward-Fix Principle**: Database schemas and data are additive. Do NOT drop production tables or delete historical records.
- **Additive Migrations**: If an RPC requires adjustment, deploy a new migration with `CREATE OR REPLACE FUNCTION` rather than destructive drops.
- **Point-in-Time Recovery (PITR)**: For critical database recovery scenarios, utilize Supabase dashboard backup restoration points.
