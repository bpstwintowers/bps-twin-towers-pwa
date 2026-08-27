# BPS Twin Towers RLS & Role Access Matrix

This matrix defines authorization across application resources for all user roles:

| Resource / Table | Anonymous (`anon`) | Verified Resident (`authenticated`) | Gate Security (`Security`) | Maintenance / Staff | Society Admin (`Admin`) |
|---|---|---|---|---|---|
| **`profiles`** | NO ACCESS | Own profile (Read/Update) | Read for gate passes | Read for tickets | Full Access |
| **`flats` & `blocks`** | Read structure | Read structure | Read structure | Read structure | Full Access |
| **`flat_members`** | NO ACCESS | Own flat members only | NO ACCESS | NO ACCESS | Full Access |
| **`registration_requests`** | NO ACCESS | Own requests only | NO ACCESS | NO ACCESS | Full Review & Approval |
| **`events`** | NO ACCESS | View Published | View Published | View Published | Manage / Approve / Publish |
| **`event_registrations`** | NO ACCESS | Own registrations only | NO ACCESS | NO ACCESS | View / Manage |
| **`donations` & `campaigns`** | NO ACCESS | View Campaigns, Own Donations | NO ACCESS | NO ACCESS | Finance Review & Verification |
| **`volunteers` & `teams`** | NO ACCESS | View Teams, Own Signups | NO ACCESS | NO ACCESS | Manage & Attendance |
| **`sponsors` & `tiers`** | NO ACCESS | View Approved, Own Application | NO ACCESS | NO ACCESS | Manage & Verification |
| **`announcements`** | NO ACCESS | View Published | View Published | View Published | Author & Broadcast |
| **`notifications`** | NO ACCESS | Own notifications only | Own notifications | Own notifications | Dispatch / System |
| **`visitors` & `invitations`** | NO ACCESS | Own flat visitors only | Operational Gate Console | NO ACCESS | Emergency Manifest / Audit |
| **`visits`** | NO ACCESS | Own flat visits only | Check In / Check Out | NO ACCESS | Society Visits Ledger |
| **`gates`** | NO ACCESS | View Active Gates | View Active Gates | View Active Gates | Manage Gate Config |
| **`facilities` & `blocks`** | NO ACCESS | View Active & Availability | View Active | View Maintenance | Full Catalogue Management |
| **`facility_bookings`** | NO ACCESS | Own flat bookings (Read/Cancel) | NO ACCESS | NO ACCESS | Review & Approve Queue |
| **`complaints`** | NO ACCESS | Own complaints only | NO ACCESS | Assigned department | Full Triage & Management |
| **`complaint_comments`** | NO ACCESS | Own public comments only | NO ACCESS | Public + Internal Notes | Public + Internal Notes |
| **`complaint_attachments`** | NO ACCESS | Own attachments (Signed URL) | NO ACCESS | Permitted (Signed URL) | Permitted (Signed URL) |
| **`audit_logs`** | NO ACCESS | NO ACCESS | NO ACCESS | NO ACCESS | View System Audit Logs |
