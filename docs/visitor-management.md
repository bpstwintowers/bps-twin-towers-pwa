# Visitor & Gate Management — Technical Documentation

## 1. Overview
The BPS Twin Towers Visitor & Gate Management module acts as the physical access control pipeline for the community. It protects resident privacy while empowering security personnel with high-speed check-in, real-time resident approval workflows, and emergency occupancy tracking without paid SaaS integrations or biometric hardware dependencies.

---

## 2. Access Control Lifecycle & Architecture

```
                       RESIDENT INITIATION
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       PRE-APPROVED INVITATION          GATE WALK-IN / DELIVERY
     (Resident generates BPS-XXXX)     (Security creates Pending request)
                │                             │
                ▼                             ▼
      SECURITY PASS LOOKUP            RESIDENT ALERT / APPROVE
       (Search at /security)           (1-Click in /my-visitors)
                │                             │
                └──────────────┬──────────────┘
                               ▼
                    GATE CHECK-IN ATOMIC RPC
                      ├── Validates Gate is Active
                      ├── Acquires Lock on Invitation
                      ├── Creates Visit (status: Inside)
                      ├── Sends In-App Arrival Alert
                      └── Logs to audit_logs
                               │
                               ▼
                   CURRENTLY INSIDE SOCIETY
                               │
                               ▼
                    GATE CHECK-OUT ATOMIC RPC
                      ├── Records exit_time & exit_gate
                      ├── Transitions Visit to Completed
                      └── Updates live occupancy counter
```

---

## 3. Database Schema

### `public.gates`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `name`: `text NOT NULL UNIQUE` (e.g. `'Main Gate (Tower A & B Entry)'`, `'Tower A Service Gate'`)
- `code`: `text NOT NULL UNIQUE` (e.g. `'GATE-1'`, `'GATE-2'`, `'GATE-3'`, `'GATE-4'`)
- `location`: `text`
- `gate_type`: `text CHECK (gate_type IN ('Main', 'Service', 'Pedestrian', 'Emergency'))`
- `status`: `text CHECK (status IN ('Active', 'Inactive', 'Maintenance'))`
- `created_at`, `updated_at`: `timestamptz`

### `public.visitors` (Person Entity)
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `name`: `text NOT NULL`
- `phone`: `text NOT NULL`
- `visitor_type`: `Guest`, `Delivery`, `Cab`, `Service Provider`, `Vendor`, `Domestic Help`, `Other`
- `company`: `text` (e.g. `'Swiggy'`, `'Uber'`, `'Urban Company'`, `'Amazon'`)
- `vehicle_number`: `text` (uppercase normalized, e.g. `'TN01AB1234'`)
- `vehicle_type`: `2-Wheeler`, `4-Wheeler`, `Auto/3-Wheeler`, `Commercial/Van`, `None`
- `notes`: `text`

### `public.visitor_invitations` (Pre-registration / Approval Record)
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `visitor_id`: `uuid NOT NULL REFERENCES public.visitors(id)`
- `host_flat_id`: `uuid NOT NULL REFERENCES public.flats(id)`
- `invited_by`: `uuid REFERENCES public.profiles(id)`
- `pass_code`: `text NOT NULL UNIQUE` (Unguessable 6-character code, e.g. `'BPS-8921'`)
- `expected_date`: `date NOT NULL DEFAULT CURRENT_DATE`
- `expected_time`: `time without time zone`
- `valid_until`: `timestamptz NOT NULL`
- `purpose`: `text`
- `status`: `Pending`, `Approved`, `Declined`, `Checked In`, `Checked Out`, `Expired`, `Cancelled`

### `public.visits` (Physical Access Control / Entry & Exit Log)
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `visitor_id`: `uuid NOT NULL REFERENCES public.visitors(id)`
- `flat_id`: `uuid NOT NULL REFERENCES public.flats(id)`
- `invitation_id`: `uuid REFERENCES public.visitor_invitations(id)`
- `entry_gate_id`: `uuid NOT NULL REFERENCES public.gates(id)`
- `exit_gate_id`: `uuid REFERENCES public.gates(id)`
- `entry_time`: `timestamptz NOT NULL DEFAULT now()`
- `exit_time`: `timestamptz`
- `entry_by`: `uuid REFERENCES public.profiles(id)` (Security guard operator)
- `exit_by`: `uuid REFERENCES public.profiles(id)`
- `status`: `Inside`, `Completed`, `Overstayed`
- `purpose`, `notes`: `text`

---

## 4. Server-Side Security Definer Functions & RPCs

| Function / RPC | Type | Purpose |
|---|---|---|
| `is_security_or_admin()` | `STABLE SECURITY DEFINER` | Checks if caller has Admin, Super Admin, Community Admin, Security, or Gate Operator role. |
| `create_visitor_invitation(...)` | `SECURITY DEFINER` | Validates host flat membership, upserts visitor record, generates random pass code, sets status to Approved, and logs to `audit_logs`. |
| `cancel_visitor_invitation(...)` | `SECURITY DEFINER` | Validates caller owns the invitation; cancels pre-approved pass. |
| `gate_request_walkin_entry(...)` | `SECURITY DEFINER` | Security initiates entry for unscheduled delivery/guest; creates Pending invitation and dispatches urgent in-app alert to host flat residents. |
| `resident_respond_visitor_request(...)` | `SECURITY DEFINER` | Host resident approves or declines walk-in entry; updates status and notifies gate staff. |
| `gate_check_in_visitor(...)` | `SECURITY DEFINER` | Concurrency-locked check-in validating active gate, approved status, and non-duplicate entry. Creates visit record with `status = 'Inside'`. |
| `gate_check_out_visitor(...)` | `SECURITY DEFINER` | Concurrency-locked check-out recording `exit_time`, `exit_gate`, and transitioning visit to `'Completed'`. |
| `get_gate_summary()` | `SECURITY DEFINER` | Aggregates Currently Inside count, Expected Today, Waiting Approval, Today's Entries, and Today's Exits. |

---

## 5. RLS Security Model

| Table | Operation | Policy Rule |
|---|---|---|
| `gates` | `SELECT` | `status = 'Active' OR is_security_or_admin()` |
| `gates` | `INSERT` / `UPDATE` | `is_security_or_admin()` |
| `visitors` | `SELECT` | `is_security_or_admin()` OR linked to caller's flat invitations/visits |
| `visitors` | `INSERT` / `UPDATE` | Authenticated users (via invitation RPC) |
| `visitor_invitations` | `SELECT` | Host flat members OR `is_security_or_admin()` |
| `visitor_invitations` | `INSERT` / `UPDATE` | Host flat members OR `is_security_or_admin()` |
| `visits` | `SELECT` | Host flat members OR `is_security_or_admin()` |
| `visits` | `INSERT` / `UPDATE` | `is_security_or_admin()` |

---

## 6. Frontend Routes & Views

| Route | Component | Purpose |
|---|---|---|
| `/my-visitors` | `VisitorManagement` | Resident portal for creating pre-invitations (`VisitorInviteModal`), approving pending gate requests, and reviewing visit history. |
| `/security` & `/gate` | `SecurityConsole` | High-contrast touch-friendly tablet console for guards: live search across pass codes, names, vehicles, flats; 1-click Check In / Check Out; walk-in logging (`WalkinEntryModal`). |
| `/admin` (Tab 9) | `AdminVisitors` | Administrative console with live emergency occupancy manifest, gate infrastructure manager, and complete society visits ledger. |
