# Volunteers + Teams — Technical Documentation

## 1. Overview
The Volunteers + Teams module powers community self-organization at BPS Twin Towers. It allows society administrators and team coordinators to establish volunteer teams, publish event/activity shifts with defined capacities, and allows residents to discover, sign up, and participate in community service without creating redundant user models.

---

## 2. Core Architecture Principle

```
AUTHENTICATED RESIDENT
          │
          ▼
VOLUNTEER SIGN-UP (signup_volunteer RPC)
          │ (Atomic FOR UPDATE Lock on capacity)
          ▼
VOLUNTEER ASSIGNMENT
  ├── Team (e.g. Decoration, Food Distribution, Puja, Crowd Management)
  ├── Event (e.g. Ganesh Utsav 2026, Sports Day)
  ├── Role (e.g. Lead, Registration Desk, Distribution, Decoration)
  └── Attendance (Pending ──> Attended / No Show)
```

---

## 3. Database Data Model

### 1. `public.volunteer_teams`
- Manages community volunteer divisions (*Festival, Cultural, Sports, Security, Maintenance, Medical, General*).
- References `coordinator_id` -> `public.profiles(id)` for lead coordinator assignments.
- Status: `Active`, `Inactive`, `Archived`.

### 2. `public.volunteer_opportunities`
- Stores individual volunteer shifts/requests.
- Linked to `team_id` (foreign key) and optional `event_id`.
- Defines `role_name`, `required_volunteers` (numeric capacity), `start_date`, `end_date`, `start_time`, `end_time`, `venue`.
- Status: `Draft`, `Published`, `Open`, `Full`, `Closed`, `Completed`, `Cancelled`.

### 3. `public.volunteer_assignments`
- Represents a confirmed resident assignment to a specific shift.
- Unique constraint: `UNIQUE (opportunity_id, user_id)` (prevents double volunteering).
- Status: `Pending`, `Confirmed`, `Waitlisted`, `Cancelled`.
- Attendance: `Pending`, `Attended`, `No Show`.

---

## 4. Server-Side Security Definer Functions & Secure RPCs

| RPC / Function | Purpose | Security |
|---|---|---|
| `is_volunteer_admin()` | Checks if caller has Admin/Culture/Event Coordinator roles or is a designated `coordinator_id` of an active team. | STABLE SECURITY DEFINER |
| `signup_volunteer(...)` | Acquires row-level `FOR UPDATE` lock on `volunteer_opportunities`, validates capacity and duplicate signups, inserts `'Confirmed'` assignment, automatically flips status to `'Full'` if capacity reached, dispatches notification, and records audit trail. | SECURITY DEFINER |
| `cancel_volunteer_assignment(...)` | Verifies user ownership or admin rights, cancels assignment, restores opportunity status from `'Full'` to `'Open'`, and writes audit log. | SECURITY DEFINER |
| `admin_mark_volunteer_attendance(...)` | Allows authorized coordinators/admins to mark volunteers as `'Attended'` or `'No Show'` with audit tracking. | SECURITY DEFINER |
| `get_volunteer_summary()` | Computes server-side database aggregation: Total Teams, Open Opportunities, Confirmed Volunteers, Attended count, and Today's Shifts. | SECURITY DEFINER |

---

## 5. RLS Policies

| Table | Operation | Policy Rule |
|---|---|---|
| `volunteer_teams` | `SELECT` | `status = 'Active' OR is_volunteer_admin()` |
| `volunteer_teams` | `INSERT` / `UPDATE` | `is_volunteer_admin()` |
| `volunteer_opportunities` | `SELECT` | `status IN ('Published', 'Open', 'Full', 'Completed') OR is_volunteer_admin()` |
| `volunteer_opportunities` | `INSERT` / `UPDATE` | `is_volunteer_admin()` |
| `volunteer_assignments` | `SELECT` | `user_id = auth.uid() OR is_volunteer_admin()` (Resident privacy preserved) |
| `volunteer_assignments` | `INSERT` | Authenticated users via `signup_volunteer` RPC |
| `volunteer_assignments` | `UPDATE` | `is_volunteer_admin()` (via attendance RPC) |

---

## 6. Frontend Routes & Components

| Route / View | Component | Description |
|---|---|---|
| `/volunteers` | `VolunteerList` | Resident portal with category pill filters, live capacity progress bars, and "My Volunteering" schedule. |
| Modal | `VolunteerSignupModal` | 1-Click volunteer registration dialog with shift briefing and profile auto-fill. |
| `/admin` (Tab 6) | `AdminVolunteers` | Management console: summary cards, opportunities manager, team coordinator manager, and live attendance sheet. |
| Modal | `OpportunityFormModal` | Form to create and update volunteer shifts with team and event associations. |
| `/` | `ResidentDashboard` | Added "Volunteers & Teams" quick action tile. |
