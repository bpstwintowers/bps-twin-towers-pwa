# BPS Twin Towers Community PWA — Final Architecture

## 1. High-Level Architecture Overview

```
[ Resident / Admin / Security Clients ]
                 │
                 ▼ (HTTPS / Mobile PWA)
      [ React 19 Frontend Shell ]
      ├── Workbox Service Worker
      ├── Route Code Splitting (React.lazy)
      ├── Glassmorphism Design System
      └── ErrorBoundary + Offline Banner
                 │
                 ▼ (Supabase JS SDK)
       [ Supabase PostgreSQL Backend ]
       ├── Authentication (Google OAuth)
       ├── Row Level Security (106 Policies on 40 Tables)
       ├── 61 Security Definer Functions / RPCs
       ├── Private Storage (Parking & Complaints)
       └── Audit Logging & Notifications
```

## 2. Core Functional Domains
1. **Foundation & Auth**: Google OAuth, Profiles, Auto-onboarding.
2. **Resident Management**: Flats, Blocks, Household Members, Approvals, Masked Directory.
3. **Events & Festivals**: Registration caps, Pooja booking passes, Cancellation.
4. **Finance & Donations**: Campaigns, UPI/Bank verification, Donor receipts, Financial summaries.
5. **Volunteers & Teams**: Department shifts, Capacity signup, Attendance logging.
6. **Sponsors & Contributions**: Partnership tiers, Application workflows, Verifications.
7. **Communications & Notices**: Emergency broadcasts, Centralized in-app notification center.
8. **Visitor & Gate Management**: Pre-invite pass codes (`BPS-XXXX`), Security gate console, Walk-in entry, Emergency occupancy manifest.
9. **Facilities Management**: Sports courts, Clubhouse, Pool, Concurrency conflict protection, Maintenance blocks.
10. **Helpdesk & Complaints**: Ticketing (`CMP-YYYY-XXXXXX`), SLA countdown timers, Internal notes, Signed attachment URLs, 1-click Resolution/Reopen.
11. **Production Hardening**: Error boundaries, Route lazy loading, Offline indicators, Security audits.
