# Facility Management & Amenities Booking Documentation

## 1. Overview
The Facility Management module provides residents of BPS Twin Towers with an on-demand booking portal for sports, recreation, and community amenities (Clubhouse, Badminton Courts, Swimming Pool, Gym, Rooftop Terrace). It enforces strict concurrency conflict protection, operating hours, advance booking limits, and maintenance blocks.

## 2. Database Schema
- `public.facilities`: Facility catalog with capacity, operating hours, slot durations, advance booking windows, approval requirements, and usage rules.
- `public.facility_bookings`: Booking records linked to resident profile and flat, with time slots, purpose, and lifecycle states (`Pending`, `Confirmed`, `Rejected`, `Cancelled`, `Completed`).
- `public.facility_blocks`: Maintenance and closure windows preventing resident slot reservations.

## 3. Concurrency Protection
Sensitive booking operations are handled via the `book_facility(...)` PostgreSQL RPC using `pg_advisory_xact_lock` and `OVERLAPS` checks:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.facility_bookings
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND status IN ('Confirmed', 'Pending')
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
);
```

## 4. Resident User Experience
- **`/facilities`**: Catalogue with category filters (*Sports, Recreation, Community, Fitness, Kids*) and search.
- **`/facilities/:id`**: Facility specifications, operating hours, capacity tags, usage rules, and issue reporting.
- **`FacilityBookingModal`**: Live slot availability grid, capacity validator, and terms agreement.
- **`/my-bookings`**: Active and past booking passes with 1-click cancellation.

## 5. Admin Console (Tab 10)
- Add/Edit facility specifications.
- Approve or reject pending bookings with custom feedback.
- Schedule maintenance blocks and emergency closures.
