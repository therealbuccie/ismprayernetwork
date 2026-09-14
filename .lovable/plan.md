# Prayer Room Coordination Upgrade

A controlled extension of the existing live prayer call (the screen members see after "Join Prayer Call" in a prayer group). Nothing in the current joining, audio, video, screen share, chat, or session logging is replaced.

## What I found first

- The live prayer meeting with real participants and microphones is the group prayer call. It already tracks who joined, when they left, and how long they prayed.
- The 24/7 Prayer Room page (timer + schedule + embedded broadcast) is a different screen and is left untouched.
- Prayer requests already exist with a "praying" counter; testimonies already exist as a separate list.

## 1. Prayer group name in the meeting

- The group's real name is shown in the meeting header, e.g. "Prayer Group: Lagos Zone 3", taken from the group record, never hardcoded.
- Each participant card shows the group name as a small secondary label under their name.

## 2. Moderator mute controls

- Moderator = the person who created the group, plus platform admins. Decided on the server when the call is joined, so ordinary members cannot grant it to themselves.
- Moderators see, per participant: Mute, and (when a hand is up) Lower Hand.
- A "Mute All" button appears in the moderator's control bar.
- Honest limitation: a moderator can force-mute someone but cannot switch another person's microphone back on — browsers forbid it. The participant is told "Muted by moderator" and must unmute themselves. The UI states this plainly instead of faking it.
- Mic state per participant reads: Mic On / Muted / Muted by moderator.

## 3. Raise hand

- Every participant gets a Raise Hand button next to the microphone button; pressing again lowers it.
- Raised hands broadcast instantly to everyone in the call.
- In the participant list, raised hands show a hand marker and are sorted to the top in the order they were raised.
- Moderators can lower a participant's hand after attending to them. No animations, no chat noise.

## 4. Live meeting timer

- Header shows `LIVE • 00:37:42`, counting from the moment the first person joined this group's call.
- The start time comes from the stored session records, so refreshing or rejoining shows the correct elapsed time rather than restarting at zero.
- Final durations continue to be stored as they are today, so the existing group prayer reports and CSV export keep working.
- This is separate from, and does not touch, the existing prayer schedule countdown.

## 5. Prayer request follow-up

- Each request gains a status: Submitted, Praying, Answered (existing requests default to Submitted).
- Coordinators (admins / super-admins) can change the status and attach one short structured response of encouragement, which is shown on the request card with who responded and when.
- Not a comment thread: one official response per request, editable by coordinators only.

## 6. Share testimony

- When a request is marked Answered, the person who submitted it sees a "Share Testimony" action on their own request.
- The testimony form captures a title (optional), the testimony text, and a date, and stays linked to the original request.
- Only the request owner (or an admin) can post it; it enters the existing testimony approval flow, so nothing goes public automatically.

## Technical notes

- Database (one migration):
  - `prayer_requests`: add `status` (submitted | praying | answered), `response_text`, `responded_by`, `responded_at`.
  - `testimonies`: add `prayer_request_id` reference.
  - Policies: owners may read their own request status; coordinators (via existing `is_admin()`) may set status/response; only the request owner or an admin may insert a testimony linked to a request. Grants included.
  - No new tables for hand-raising (broadcast in-call) or for the timer (derived from existing call-participation records).
- `daily-room` function: also returns whether the caller is a moderator and issues an admin-capable meeting token only in that case. Existing room creation, expiry, and token flow unchanged.
- `VideoCall.tsx` is extended in place: header block, participant metadata, hand-raise messaging, moderator actions. Audio capture settings, adaptive quality, chat, screen share, and participation logging are left exactly as they are.
- Layout: desktop keeps the participant list beside the grid; mobile stacks it with Mic and Raise Hand always visible in the bar.

## Verification after build

Join flow, existing audio, screen share, chat, participation logging, group reports, prayer request submission and "Pray" counter all re-checked, plus the new header, mute, hand raise, refresh-safe timer, statuses, and testimony ownership rules.
