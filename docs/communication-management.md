# Community Communication & Announcements — Technical Documentation

## 1. Overview
The Community Communication module enables society administrators, estate managers, and festival coordinators to publish audience-targeted notices (*Water maintenance, Lift inspections, Emergency power disruptions, Festival committee announcements, Society AGMs*).

---

## 2. Audience Targeting Architecture

```
ANNOUNCEMENT CREATION
       │
       ▼
TARGET AUDIENCE SELECTION
  ├── ALL (All registered resident profiles)
  ├── BLOCK_A (Residents linked to Tower A flats)
  ├── BLOCK_B (Residents linked to Tower B flats)
  ├── OWNERS (Flat members with Owner status)
  └── TENANTS (Flat members with Tenant status)
       │
       ▼
SERVER-SIDE RESOLUTION (publish_announcement RPC)
  ├── Evaluates membership join with flats & blocks
  ├── Performs atomic batch notification insert
  └── Writes to audit_logs
```

---

## 3. Database Schema: `public.announcements`

- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `title`: `text NOT NULL`
- `message`: `text NOT NULL`
- `category`: `General`, `Maintenance`, `Festival`, `Emergency`, `Security`, `Meeting`, `Notice`
- `priority`: `Low`, `Normal`, `High`, `Urgent`
- `target_audience`: `ALL`, `BLOCK_A`, `BLOCK_B`, `OWNERS`, `TENANTS`
- `target_block`: `text` (e.g. `'A'` or `'B'`)
- `action_url`: `text` (optional internal route navigation)
- `status`: `Draft`, `Published`, `Archived`, `Cancelled`
- `published_at`: `timestamp with time zone`
- `expires_at`: `timestamp with time zone`
- `created_by`: `uuid REFERENCES public.profiles(id)`

---

## 4. Server-Side Security Definer RPCs

| RPC / Function | Purpose | Security |
|---|---|---|
| `is_communication_admin()` | Checks if caller has Admin, Super Admin, Community Admin, Event Admin, Festival Coordinator, or Culture Team role. | STABLE SECURITY DEFINER |
| `publish_announcement(p_announcement_id)` | Transitions status to `'Published'`, queries eligible audience profiles on the server, creates atomic batch notification entries, and writes to `audit_logs`. | SECURITY DEFINER |

---

## 5. RLS Policies

| Table | Operation | Policy Rule |
|---|---|---|
| `announcements` | `SELECT` | `status = 'Published' OR is_communication_admin()` |
| `announcements` | `INSERT` / `UPDATE` | `is_communication_admin()` |

---

## 6. Frontend Routes & Views

| Route / View | Component | Purpose |
|---|---|---|
| `/notifications` | `NotificationCenter` | Central resident notification hub with category pills, unread filtering, priority badges, and 1-click "Mark All Read". |
| `/announcements` | `AnnouncementList` | Community notice bulletin with emergency alert banner and category filters. |
| `/settings/notifications` | `NotificationPreferences` | Resident preference toggles for in-app categories and PWA push. |
| `/admin` (Tab 8) | `AdminCommunications` | Console for creating drafts, audience recipient estimator preview, broadcasting, and dispatch tracking. |
| Top Bar / Header | `NotificationBell` | Real-time badge counter and quick notification dropdown preview. |
