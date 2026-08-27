# Community Donations & Finance — Technical Documentation

## 1. Overview
The Community Donations & Finance module provides a transparent, secure, zero-cost mechanism for BPS Twin Towers society administration to launch fundraising campaigns (festivals, emergency funds, facility improvements) and for residents to record and track voluntary monetary contributions.

---

## 2. Architecture & Data Model

```
FUNDRAISING CAMPAIGN
+-------------+        +------------+        +----------+
|    DRAFT    | -----> |   ACTIVE   | -----> |  CLOSED  |
+-------------+        +------------+        +----------+
                             |
                             v
                    DONATION CONTRIBUTION
                    +--------------------+
                    |      PENDING       |
                    +--------------------+
                             |
                   +---------+---------+
                   |                   |
                   v                   v
            +--------------+   +---------------+
            |   VERIFIED   |   |   REJECTED    |
            | (With e-Rec) |   | (With Reason) |
            +--------------+   +---------------+
```

### Core Database Tables:
1. **`public.donation_campaigns`**:
   - Stores campaign titles, categories (`Festival`, `Cultural`, `Charity`, `Emergency Fund`, `Infrastructure`, `Puja`, `Sports`, `Other`), financial targets (`numeric(12,2)`), schedules, and lifecycle status (`Draft`, `Active`, `Closed`, `Cancelled`).
2. **`public.donations`**:
   - Stores donor contributions with precise currency handling (`numeric(12,2)`), payment methods (`UPI`, `Bank Transfer`, `Cash`, `Cheque`, `Other`), transaction reference IDs, unique receipt numbers (`REC-YYYYMM-XXXXX`), and verification timestamps.

---

## 3. Server-Side Security & Integrity RPCs

### 1. `submit_donation(...)`
- **Zero-Cost Recording Flow**: Accepts user donation without requiring upfront third-party payment gateway integration.
- **Validation**: Enforces `amount > 0`, validates donor name, and verifies that the target campaign is currently `'Active'`.
- **Receipt Generation**: Generates a cryptographically unique formatted receipt code.
- **Audit & Notification**: Automatically inserts an entry into `public.audit_logs` and sends an acknowledgment to `public.notifications`.

### 2. `admin_verify_donation(p_donation_id)`
- Verifies caller has `is_finance_admin()`.
- Transitions donation status to `'Verified'` and records `verified_by` and `verified_at`.
- Sends a verification receipt notification to the resident donor and writes to `audit_logs`.

### 3. `admin_reject_donation(p_donation_id, p_reason)`
- Verifies caller has `is_finance_admin()`.
- Transitions status to `'Rejected'` with mandatory reason.
- Dispatches alert notification to the resident donor.

### 4. `get_finance_summary()`
- Database-level aggregation function computing:
  - Total Active & Total Campaigns
  - Total Target Amount
  - Total Verified Collections
  - Total Pending Verification Amount
  - Verified and Pending Donation Counts

---

## 4. Role-Based Access & RLS Policies

| Table | Operation | Policy Rule |
|---|---|---|
| `donation_campaigns` | `SELECT` | `status IN ('Active', 'Closed') OR is_finance_admin()` |
| `donation_campaigns` | `INSERT` / `UPDATE` | `is_finance_admin()` |
| `donations` | `SELECT` | `user_id = auth.uid() OR is_finance_admin()` (Donor privacy guaranteed) |
| `donations` | `INSERT` | `user_id = auth.uid() OR is_finance_admin()` via `submit_donation` RPC |
| `donations` | `UPDATE` | `is_finance_admin()` |

---

## 5. Frontend Interfaces

| Route | Component | Description |
|---|---|---|
| `/donations` | `DonationList` | Active campaigns with financial progress bars + "My Contributions" receipt ledger |
| Modal | `DonationModal` | Quick amount chips, payment mode selector, transaction reference entry, instant receipt code |
| `/admin` (Tab 5) | `AdminFinance` | Finance dashboard metrics, verification queue with 1-click verify & reject, campaign manager, donations ledger |
| `/admin` (Modal) | `CampaignFormModal` | Form to create and update fundraising campaigns |
| `/` | `ResidentDashboard` | Added "Donations & Funds" quick action tile |
