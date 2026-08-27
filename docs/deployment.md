# Disaster Recovery & Deployment Readiness

## 1. Environment Configuration
The frontend application requires only public client configuration:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key

> **Security Rule**: The `service_role` key must **NEVER** be committed or referenced in frontend build artifacts.

## 2. Backup & Recovery Expectations
- Database schemas are codified in version-controlled SQL migrations.
- Daily automated backups are maintained by Supabase PostgreSQL infrastructure.
- Point-in-time recovery (PITR) is available for staging/production database rollback if required.

## 3. Deployment Checklist
- [x] Run `npx tsc --noEmit` to verify type safety (0 errors).
- [x] Run `npx vite build` to generate production PWA artifacts in `/dist`.
- [x] Ensure `.env` is omitted from version control via `.gitignore`.
- [x] Enforce HTTPS on production hosting domain.
- [x] Verify Google OAuth redirect URIs match the production domain.
