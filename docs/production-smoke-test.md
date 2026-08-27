# Production Smoke Test Protocol

Follow this exact sequence to verify production deployments:

## 1. Authentication & Session Flow
1. Navigate to production URL (e.g. `https://production-domain/login`).
2. Click **Sign in with Google** → Verify OAuth callback and redirect to `/`.
3. Check session persistence upon browser tab refresh.
4. Click **Log Out** → Verify return to `/login` and clearance of cached session.

## 2. Resident Dashboard & Household
1. Open Resident Dashboard at `/`.
2. Verify assigned flat card display (e.g. `Flat A810 (Block A)`).
3. Click **Manage Household** → Verify family members list.
4. Click **Community Directory** → Verify masked resident directory.
5. Click **Registration Status** (`/registration-status`) → Verify application tracker.

## 3. Events & Festival Bookings
1. Navigate to `/events`.
2. Filter by category (e.g. *Festival, Pooja, Sports*).
3. Open event detail page (`/events/:id`).
4. Click **Register for Event** → Confirm participant count.
5. Click **Book Pooja Slot** → Verify token pass generation.
6. Cancel registration → Verify status changes to *Cancelled*.

## 4. Community Finance & Donations
1. Navigate to `/donations`.
2. View active campaigns and target progress bars.
3. Click **Donate Now** → Select payment method and enter transaction reference.
4. Verify donation receipt submission in *Pending Verification* state.

## 5. Volunteers & Teams
1. Navigate to `/volunteers`.
2. View volunteer teams (*Puja, Cultural, Security, Logistics*).
3. Click **Sign Up to Volunteer** on an open shift → Confirm shift registration.

## 6. Sponsors & Partnerships
1. Navigate to `/sponsors`.
2. View sponsor tiers (*Platinum, Gold, Silver, Community Partner*).
3. Submit a sponsorship application with branding details.

## 7. Communications & Notifications
1. Navigate to `/announcements` → Verify published emergency bulletins.
2. Click top header **NotificationBell** or `/notifications`.
3. Verify unread badge count and mark notifications as read.
4. Navigate to `/settings/notifications` → Toggle preferences.

## 8. Visitor & Gate Management
1. Navigate to `/my-visitors`.
2. Click **+ Pre-Approve Visitor** → Enter name, phone, purpose.
3. Generate and copy gate pass code (`BPS-XXXX`).
4. Navigate to `/security` (Gate Console).
5. Search visitor by pass code or flat number.
6. Click **Check In** → Verify host resident alert.
7. Click **Check Out** → Verify visit moves to *Completed*.

## 9. Facilities & Amenities
1. Navigate to `/facilities`.
2. View facility catalogue (*Clubhouse, Badminton Courts, Swimming Pool, Gym*).
3. Open facility detail (`/facilities/:id`).
4. Click **Book a Slot Now** → Select date and available time slot.
5. Confirm booking → Verify pass appears in `/my-bookings`.

## 10. Helpdesk & Complaints
1. Navigate to `/complaints`.
2. Click **+ Log Complaint** (`/complaints/new`).
3. Select category, priority, flat/common location, and optional photo.
4. Submit ticket → Verify reference number (`CMP-YYYY-XXXXXX`) and SLA due time.
5. Post a conversation update on the ticket timeline.

## 11. Admin Portal Console
1. Login as authorized Admin → Navigate to `/admin`.
2. **Tab 1: Registrations** → Review, approve, or request corrections.
3. **Tab 2: Residents** → Manage flat memberships.
4. **Tab 3: Flats** → Inspect society inventory.
5. **Tab 4: Events** → Create events, pooja slots, and track participants.
6. **Tab 5: Finance** → Verify donation receipts and download statements.
7. **Tab 6: Volunteers** → Mark volunteer shift attendance.
8. **Tab 7: Sponsors** → Approve sponsor applications and verify contributions.
9. **Tab 8: Communications** → Broadcast society announcements.
10. **Tab 9: Visitors** → Inspect Emergency Occupancy Manifest and gate logs.
11. **Tab 10: Facilities** → Approve booking queue and schedule maintenance blocks.
12. **Tab 11: Helpdesk** → Triage complaints, assign teams, and resolve tickets.
