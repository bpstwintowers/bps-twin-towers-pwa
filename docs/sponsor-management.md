# Sponsors + Contributions — Technical Documentation

## 1. Overview
The Sponsors + Contributions module enables BPS Twin Towers society management and festival coordinators to formalize, showcase, and account for commercial, local business, and community sponsorships. It cleanly separates resident donations from commercial sponsorships, supports monetary and in-kind valuations, and integrates seamlessly with the Phase 4 Finance dashboard.

---

## 2. Architecture & Data Model

```
SPONSOR ENTITY (Business / Individual / Resident Profile / External Vendor)
       │
       ▼
SPONSORSHIP RECORD
  ├── Target Event (e.g. Ganesh Utsav 2026) OR Campaign
  ├── Tier (Title, Platinum, Gold, Silver, Community Partner)
  ├── Visibility (Public, Community Only, Private)
  └── Approval Lifecycle (Draft ──> Pending Approval ──> Approved ──> Active)
       │
       ▼
CONTRIBUTION LEDGER
  ├── Monetary (Amount, UPI/Bank Transfer/Cash, Reference, Receipt: SPN-YYYYMM-XXXX)
  └── In-Kind (Item Description, Quantity, Unit, Estimated Value)
```

---

## 3. Database Data Model

### 1. `public.sponsor_tiers`
- Configurable sponsorship packages (*Title, Platinum, Gold, Silver, Community Partner, Food Sponsor, Decoration Sponsor, Prize Sponsor*).
- `minimum_amount` (`numeric(12,2)`), `benefits` (`text[]`), `display_order` (`integer`), `status` (`Active`, `Inactive`, `Archived`).

### 2. `public.sponsors`
- Stores organizational and individual partner profiles.
- `sponsor_type` (`Individual`, `Business`, `Organization`, `Community Member`, `Vendor`, `Other`).
- References `profile_id` if sponsor is an authenticated resident, or maintains external contact info.
- Status: `Draft`, `Pending Approval`, `Approved`, `Active`, `Inactive`, `Rejected`, `Cancelled`.

### 3. `public.sponsorships`
- Connects sponsor to `event_id` or `campaign_id` and assigned `tier_id`.
- `visibility`: `Public` (displayed on website/app), `Community Only`, `Private`.
- Status: `Draft`, `Pending Approval`, `Approved`, `Active`, `Completed`, `Rejected`, `Cancelled`.

### 4. `public.sponsor_contributions`
- Stores individual contribution tranches.
- `contribution_type`: `Monetary`, `In-Kind`, `Service`, `Other`.
- `amount` (`numeric(12,2)`), `receipt_number` (`SPN-YYYYMM-XXXXX`).
- `in_kind_description`, `in_kind_quantity`, `in_kind_unit`, `in_kind_estimated_value` (`numeric(12,2)`).
- Status: `Pending`, `Verified`, `Rejected`, `Cancelled`.

---

## 4. Server-Side Security Definer Functions & RPCs

| RPC / Function | Purpose | Security |
|---|---|---|
| `is_sponsor_admin()` | Validates caller has Admin, Event Admin, Festival Coordinator, Finance, or Sponsor Coordinator role. | STABLE SECURITY DEFINER |
| `submit_sponsor_application(...)` | Atomic RPC creating sponsor, sponsorship, and initial contribution records with auto-generated receipt (`SPN-YYYYMM-XXXXX`), notification dispatch, and audit logging. | SECURITY DEFINER |
| `admin_approve_sponsorship(...)` | Transitions sponsorship status to `'Approved'`, sets `approved_by` and `approved_at`, sends notification, and writes to `audit_logs`. | SECURITY DEFINER |
| `admin_reject_sponsorship(...)` | Transitions sponsorship status to `'Rejected'` with mandatory reason and dispatches alert notification. | SECURITY DEFINER |
| `admin_verify_sponsor_contribution(...)` | Transitions contribution to `'Verified'`, records `verified_by` and `verified_at`, sends confirmed receipt notification, and writes to `audit_logs`. | SECURITY DEFINER |
| `admin_reject_sponsor_contribution(...)` | Rejects contribution with mandatory reason and writes to `audit_logs`. | SECURITY DEFINER |
| `get_sponsor_summary()` | PostgreSQL aggregate function returning Total Sponsors, Active Sponsorships, Pending Approvals, Pending Contributions, Verified Cash Amount, Verified In-Kind Valuation, and Total Sponsorship Value. | SECURITY DEFINER |

---

## 5. RLS Security Model

| Table | Operation | Policy Rule |
|---|---|---|
| `sponsor_tiers` | `SELECT` | `status = 'Active' OR is_sponsor_admin()` |
| `sponsor_tiers` | `INSERT` / `UPDATE` | `is_sponsor_admin()` |
| `sponsors` | `SELECT` | Approved public sponsors visible to all residents; draft/private records restricted to creator or `is_sponsor_admin()`. |
| `sponsors` | `INSERT` | Authenticated residents or `is_sponsor_admin()`. |
| `sponsors` | `UPDATE` | `is_sponsor_admin()`. |
| `sponsorships` | `SELECT` | Approved public sponsorships visible to all; private restricted to creator or `is_sponsor_admin()`. |
| `sponsorships` | `INSERT` / `UPDATE` | Creator or `is_sponsor_admin()`. |
| `sponsor_contributions` | `SELECT` | Creator or `is_sponsor_admin()`. |
| `sponsor_contributions` | `INSERT` | Creator or `is_sponsor_admin()`. |
| `sponsor_contributions` | `UPDATE` | `is_sponsor_admin()`. |

---

## 6. Frontend Routes & Components

| Route / View | Component | Description |
|---|---|---|
| `/sponsors` | `SponsorList` | Resident portal showcasing sponsors by tier, sponsorship packages explorer, and "My Applications" ledger. |
| Modal | `SponsorApplicationModal` | Partner application form supporting monetary / in-kind contributions and instant receipt generation. |
| `/admin` (Tab 7) | `AdminSponsors` | Management console: financial metrics, approvals & verification queues, sponsorships manager, tiers manager, and contributions ledger. |
| Modal | `SponsorTierModal` | Form to create and update sponsorship tiers, minimum amounts, and benefits list. |
| `/` | `ResidentDashboard` | Added "Sponsors & Partners" quick action tile. |
