# Centralized Notification System — Technical Documentation

## 1. Overview
The BPS Twin Towers Centralized Notification System serves as the single unified message dispatch and reception pipeline for all application modules (*Events, Bookings, Donations, Finance, Volunteers, Teams, Sponsors, Registration, Security, and System*). It guarantees that no module implements an isolated notification silo.

---

## 2. Architecture Diagram

```
EVENT / FINANCE / VOLUNTEER / SPONSOR / REGISTRATION / ADMIN MODULES
                               │
                               ▼
            CENTRAL NOTIFICATION SERVICE & RPC PIPELINE
             ├── In-App Notification (Stored in public.notifications)
             ├── Priority Check (LOW, NORMAL, HIGH, URGENT)
             ├── Preference Evaluation (notification_preferences)
             └── PWA Browser Web Push (push_subscriptions)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   NOTIFICATION CENTER                  NOTIFICATION BELL
  (/notifications)                     (Real-Time Unread Badge)
```

---

## 3. Database Schema

### `public.notifications`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `recipient`: `uuid NOT NULL REFERENCES public.profiles(id)`
- `notification_type`: `text NOT NULL` (e.g. `'EVENT_REGISTRATION_CONFIRMED'`, `'DONATION_VERIFIED'`, `'VOLUNTEER_ASSIGNED'`, `'ANNOUNCEMENT_BROADCAST'`)
- `category`: `text NOT NULL DEFAULT 'GENERAL'` (`'SYSTEM'`, `'REGISTRATION'`, `'EVENT'`, `'BOOKING'`, `'FINANCE'`, `'DONATION'`, `'VOLUNTEER'`, `'SPONSOR'`, `'ANNOUNCEMENT'`, `'SECURITY'`, `'GENERAL'`)
- `title`: `text NOT NULL`
- `message`: `text NOT NULL`
- `priority`: `text NOT NULL DEFAULT 'NORMAL'` (`'LOW'`, `'NORMAL'`, `'HIGH'`, `'URGENT'`)
- `action_url`: `text` (e.g. `'/events/123'`, `'/donations'`, `'/volunteers'`, `'/announcements'`)
- `reference_type`: `text`
- `reference_id`: `text`
- `is_read`: `boolean DEFAULT false`
- `created_at`: `timestamp with time zone DEFAULT now()`
- `expires_at`: `timestamp with time zone`

### `public.notification_preferences`
- `user_id`: `uuid PRIMARY KEY REFERENCES public.profiles(id)`
- In-App category toggles: `in_app_events`, `in_app_finance`, `in_app_volunteers`, `in_app_sponsors`, `in_app_announcements`.
- Push category toggles: `push_enabled`, `push_events`, `push_finance`, `push_volunteers`, `push_announcements`.
- Critical system/security alerts are always enabled and non-disableable.

### `public.push_subscriptions`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id`: `uuid NOT NULL REFERENCES public.profiles(id)`
- `endpoint`: `text NOT NULL UNIQUE`
- `p256dh`: `text NOT NULL`
- `auth`: `text NOT NULL`
- `user_agent`: `text`

---

## 4. Server-Side Security Definer RPCs

| RPC / Function | Purpose | Security |
|---|---|---|
| `mark_all_notifications_read()` | Atomically marks all unread notifications for `auth.uid()` as `is_read = true`. | SECURITY DEFINER |
| `get_unread_notification_count()` | Returns integer count of unread notifications for caller. | STABLE SECURITY DEFINER |
| `get_communication_summary()` | Aggregates Total Notifications, Unread Count, Active Notices, Urgent Alerts, and Today's Broadcasts. | SECURITY DEFINER |

---

## 5. RLS Security Model

| Table | Operation | Policy Rule |
|---|---|---|
| `notifications` | `SELECT` | `recipient = auth.uid()` (Residents view only their own alerts) |
| `notifications` | `UPDATE` | `recipient = auth.uid()` (Only owner can mark read) |
| `notifications` | `INSERT` | `is_communication_admin()` or server-side RPC |
| `notification_preferences` | `SELECT` / `UPDATE` | `user_id = auth.uid()` |
| `push_subscriptions` | `ALL` | `user_id = auth.uid()` |
