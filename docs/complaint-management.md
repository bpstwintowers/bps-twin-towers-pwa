# Helpdesk & Complaint Management Documentation

## 1. Overview
The Helpdesk & Complaint Management module provides an end-to-end ticketing and SLA-driven maintenance tracking system for BPS Twin Towers. Residents can report electrical, plumbing, lift, water, or facility issues with photos, track SLA countdowns, converse with technicians, and verify resolutions.

## 2. Database Schema
- `public.complaint_categories`: Configurable categories with default SLA response targets and assigned teams.
- `public.complaints`: Tickets with human-readable numbers (`CMP-YYYY-XXXXXX`), priorities (`Low`, `Medium`, `High`, `Urgent`), location types (`My Flat`, `Common Area`, `Facility`, `Parking`), server-calculated `due_at` SLA timers, and lifecycle statuses (`Open`, `Acknowledged`, `Assigned`, `In Progress`, `Waiting for Resident`, `Resolved`, `Closed`, `Reopened`, `Rejected`, `Cancelled`).
- `public.complaint_comments`: Conversation log with `is_internal` flag hiding internal staff discussions from residents.
- `public.complaint_attachments`: Metadata for files uploaded to the private `complaint-attachments` Supabase storage bucket.

## 3. SLA Model
- **Urgent**: 4 hours
- **High**: 24 hours
- **Medium**: 48 hours
- **Low**: 72 hours
- Overdue tickets are automatically highlighted with visual badges and metric counters in the admin triage console.

## 4. Privacy & RLS
- **No Public Board**: Residents can only view complaints logged by themselves or members of their flat.
- **Internal Staff Notes**: Hidden from resident view via RLS checks on `is_internal = false`.
- **Private Attachments**: Accessible only via authenticated signed URLs.

## 5. Resident Experience
- **`/complaints`**: Hub with tabs for *Open & In Progress* vs *Resolved & Closed*.
- **`/complaints/new`**: Category selection, priority, location details, and photo upload.
- **`/complaints/:id`**: Real-time SLA countdown, ticket timeline, comments conversation, and 1-click **Confirm Resolved & Close** or **Reopen Issue** actions.

## 6. Admin Console (Tab 11)
- Triage console with live counters for Open, Urgent, Overdue, and Resolved tickets.
- Filter by priority, status, and category.
- Modal to assign departments/technicians, update statuses, post resolution summaries, and append internal staff notes.
