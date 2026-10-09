# Mail Dispatch UX and Live Status

## Changes
- Fix the visual email composer so typing remains left-to-right and the cursor is not reset after each keystroke.
- Replace legacy “queued/pending” wording with accurate managed-delivery states.
- Add an automatically refreshed recent-dispatch summary so the admin sees current sent, failed, suppressed, and in-progress counts.
- Keep manual refresh and recipient-level details available.

## Technical details
- Stop re-rendering the editable email body from its HTML value while the user types; synchronize external content only when it truly changes.
- Extend the existing mail function’s status action to return recent mail-dispatch events, using the latest event for each message.
- Refresh status on a short interval while the Mail Dispatch screen is open and after each send.
- Preserve the existing recipient selection, formatting tools, tracking, and 500-recipient limit.

## Verification
- Type a sentence in the visual composer and confirm characters appear in normal order with a stable cursor.
- Send or inspect a dispatch and confirm status counts update without reloading the dashboard.
- Confirm the app builds without errors.
