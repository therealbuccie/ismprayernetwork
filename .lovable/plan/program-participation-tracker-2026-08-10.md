# Program Participation Tracker

Track how many ministers engage with each program, using the email dispatch as the starting signal: who was emailed, who opened, who clicked the program link, and who later submitted a report.

## How it works

1. When an admin composes a dispatch, they can attach it to a program (dropdown). If they don't, the system auto-detects the program by matching registration links found in the email body.
2. Every email sent gets an invisible open-tracking image and its program links rewritten to pass through a redirect that records the click before forwarding the minister to the real registration page.
3. Reports submitted through the existing reporting form are matched to a program by prayer date and minister email, counting as confirmed attendance.
4. A new "Program Tracker" page in the dashboard rolls all of this into per-program and per-minister numbers.

## What the tracker shows

- **Per program**: sent, delivered, opened, clicked, reports submitted, and a participation rate (unique ministers with any engagement / delivered).
- **Per minister**: history of which programs they were emailed about and which they engaged with, plus an engagement score.
- **Country breakdown**: participation grouped by the country already stored on each contact/profile record, shown as a ranked list with counts.
- **CSV export**: full participant list per program, and the per-minister history table.
- **Filters**: by program, date range, engagement type (opened / clicked / reported), and country.

## Technical notes

Database (new):
- `program_dispatches` — links a dispatch run to a `programs` row (program_id, subject, sent_at, recipient_count, detected_or_manual).
- `program_engagements` — one row per recipient per program with `email`, `program_id`, `dispatch_id`, `sent_at`, `opened_at`, `clicked_at`, `report_id`, `country`. Unique on (dispatch_id, email). Admin-only RLS via `is_admin()`, plus GRANTs; the tracking function writes with the service role.

Edge functions:
- New public `track-email` function: `GET /track-email?e=<token>&t=open` returns a 1x1 GIF and stamps `opened_at`; `?t=click&u=<url>` stamps `clicked_at` and 302s to the destination. Tokens are opaque row ids, no PII in the URL.
- `send-dispatch-email`: accepts an optional `program_id`, auto-detects program by matching `programs.registration_url` in the HTML when absent, creates the `program_dispatches` row plus one `program_engagements` row per recipient, injects the tracking pixel, and rewrites matched links to the tracker.
- Report matching runs on read: reports are joined to programs by nearest `event_date` to `prayer_date` and by contact email.

Frontend:
- `src/components/dashboard/ProgramTrackerManager.tsx` — stat cards, program table, minister history table, country chips, CSV export, filters.
- Program selector added to `MailDispatchManager.tsx`.
- New sidebar entry under the programs/communication group, plus a clickable stat card on the dashboard overview.

Caveat: open tracking is blocked by some inboxes (Gmail proxies images, Outlook may prefetch), so clicks and reports are treated as the stronger signals and the UI labels opens as indicative.
