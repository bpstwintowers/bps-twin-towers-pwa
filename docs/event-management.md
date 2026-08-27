# Event Management & Festival Bookings — Technical Documentation

## 1. Overview
The Event Management & Festival Bookings module enables BPS Twin Towers society admins and coordinators to organize community programs and festivals, while giving residents an intuitive way to explore events, register themselves or household members (including children), and book specialized festival puja slots.

---

## 2. Architecture & Data Model

```
EVENT LIFECYCLE
+-----------+       +-------------------+       +----------+       +-----------+
|   DRAFT   | ----> |  PENDING APPROVAL | ----> | APPROVED | ----> | PUBLISHED |
+-----------+       +-------------------+       +----------+       +-----------+
                                                                         |
                                                                         v
                                                                   +-----------+
                                                                   | CANCELLED |
                                                                   +-----------+
```

### Core Database Tables:
1. **`public.events`**:
   - Stores metadata, schedules, capacity constraints, status, and categories:
     - Categories: `Festival`, `Cultural`, `Sports`, `Community`, `Kids`, `Religious`, `Workshop`, `Meeting`, `Other`.
     - Status: `Draft`, `Pending Approval`, `Approved`, `Published`, `Registration Open`, `Registration Closed`, `Completed`, `Cancelled`.
2. **`public.event_registrations`**:
   - Records participant bookings tied to `user_id`, `flat_id`, and optional `flat_member_id` (for household members and children).
   - Unique Constraint: `(event_id, user_id, flat_member_id)` prevents accidental double registrations.
3. **`public.pooja_bookings`**:
   - Reused table for festival puja slot bookings with time slot selection and reference code generation.

---

## 3. Server-Side Security & Concurrency Protection

### Atomic Registration RPC (`register_for_event`)
- **Row Locking**: Acquires a `FOR UPDATE` lock on the event row during registration to eliminate race-condition overbooking.
- **Capacity Enforcement**: Ensures that total confirmed participants do not exceed `capacity`.
- **Status & Date Validation**: Rejects registrations if the event is not in `Published` / `Registration Open` status or if registration deadlines have passed.
- **Audit & Notification**: Automatically creates an entry in `audit_logs` and sends an alert in `notifications`.

### Event Cancellation RPC (`admin_cancel_event`)
- Updates the event status to `Cancelled` with a mandatory reason.
- Automatically dispatches cancellation notifications to all confirmed participants.
- Logs the cancellation in `audit_logs`.

---

## 4. Role-Based Access & RLS Policies

| Table | Operation | Policy Rule |
|---|---|---|
| `events` | `SELECT` | `status IN ('Published', 'Registration Open', 'Registration Closed', 'Completed') OR is_event_admin()` |
| `events` | `INSERT` / `UPDATE` | `is_event_admin()` |
| `event_registrations` | `SELECT` | `user_id = auth.uid() OR is_event_admin()` |
| `event_registrations` | `INSERT` | Authenticated users with active flat access (`register_for_event` RPC) |
| `event_registrations` | `UPDATE` | `user_id = auth.uid() OR is_event_admin()` |

---

## 5. Frontend Interfaces

| Route | Component | Description |
|---|---|---|
| `/events` | `EventList` | Filter by category pills, search bar, capacity badges, Puja booking modal trigger |
| `/events/:id` | `EventDetails` | Event overview, capacity progress bar, household/child participant selector, atomic registration & cancellation |
| `/admin` (Tab: Events) | `AdminPortal` / `AdminEvents` | Event CRUD, approval queue, publishing, cancellation dialog, and registered participants table |
| `/` | `ResidentDashboard` | Added "Events & Festivals" quick action tile in resident dashboard |
