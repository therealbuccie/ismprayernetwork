# MPN-001: STAGING DEPLOYMENT, ZERO-DOWNTIME CUTOVER & ROLLBACK PLAN

**Project:** ISM Prayer Network Platform Migration  
**Document ID:** MPN-001-CUTOVER-PLAN  
**Target:** Cloudflare Pages, Cloudflare Workers, Cloudflare R2, Independent PostgreSQL  
**Primary Objective:** Seamless transition from Lovable/Supabase with zero data loss, guaranteed continuity of live services, and immediate rollback capability.  

---

## 1. High-Level Cutover Sequence

The migration follows a five-phase cutover strategy to ensure the live application remains completely operational on Lovable throughout testing and verification.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Engineering Team
    participant Live as Live Production (Lovable + Supabase)
    participant Staging as Staging Environment (Cloudflare Pages + Staging DB)
    participant Target as Target Production (Cloudflare Pages + Target DB)
    participant DNS as Cloudflare DNS & Mail Gateway

    Note over Live: 1. Normal Operations on Lovable
    Admin->>Live: Extract read-only schema & baseline data dump
    Admin->>Staging: Restore to Staging DB & deploy Staging Cloudflare Pages
    Admin->>Staging: Execute complete Feature-Parity Verification Checklist
    Note over Staging: 2. Staging Verified & Approved

    Note over Admin,Target: 3. Cutover Window Initiated
    Admin->>Live: Enable read-only maintenance banner on Lovable
    Admin->>Live: Take final delta data backup
    Admin->>Target: Apply final delta sync to Target PostgreSQL
    Admin->>DNS: Update DNS CNAME to Cloudflare Pages & re-point notify.ismprayernetwork.org
    Admin->>Target: Execute smoke tests on live domain

    alt Verification Successful
        Admin->>Target: Deactivate maintenance mode; promote Target to Live
        Note over Target: 4. Target Fully Operational on Cloudflare
    else Verification Failed (Trigger Event)
        Admin->>DNS: Revert DNS CNAME back to Lovable Cloud
        Admin->>Live: Deactivate maintenance mode on Lovable
        Note over Live: 5. Safe Rollback Complete
    end
```

---

## 2. Phase 1: Staging Environment Architecture & Deployment

Before any changes are made to production, an isolated Staging Environment must be deployed on Cloudflare Pages and verified.

### 2.1 Staging Topology
- **Frontend URL:** `https://staging.ismprayernetwork.org` (or Cloudflare Pages default: `https://mpn-staging.pages.dev`).
- **Staging Database:** Standalone staging instance of PostgreSQL 16 restored with baseline data.
- **Staging Storage:** 3 isolated Cloudflare R2 buckets:
  - `staging-book-covers`
  - `staging-pop-uploads`
  - `staging-report-uploads`
- **Staging Edge Worker:** Dedicated worker handling `staging-api.ismprayernetwork.org` using test Daily.co and Resend credentials.

### 2.2 Staging Build & Deployment Instructions
```bash
# 1. Build staging bundle with staging environment variables
npm run build -- --mode staging

# 2. Deploy to Cloudflare Pages staging project via Wrangler
npx wrangler pages deploy dist --project-name=ismprayernetwork-staging --branch=staging
```

### 2.3 Staging Acceptance Testing
The QA and engineering team will execute the **45 verification items** defined in [`MPN-001-FEATURE-PARITY.md`](file:///c:/Users/user/Documents/ismprayernetwork/MPN-001-FEATURE-PARITY.md). Staging sign-off requires 100% passing results on:
- User login with existing credentials
- 3D Globe rendering
- Prayer request submission and count increment
- Live TV HLS playback
- Daily.co group call joining and moderator controls
- Bookstore checkout and POP receipt upload
- Admin hub contact pagination and email dispatch simulation

---

## 3. Phase 2: Zero-Data-Loss Data Migration Sequence

To ensure no user submits a prayer request, report, or bookstore purchase that fails to migrate, the cutover window follows a deterministic freeze-and-sync process.

```
+-----------------------------------------------------------------------------------------------------------------------+
| TIME ESTIMATE: 30 MINUTES TOTAL MAINTENANCE WINDOW                                                                    |
+---------------------+---------------------------------------------------------------+---------------------------------+
| Time Window         | Action Item                                                   | Responsible Role                |
+---------------------+---------------------------------------------------------------+---------------------------------+
| T - 48 Hours        | Baseline data dump from Supabase to Target PostgreSQL         | Database Administrator          |
| T - 48 Hours        | R2 object copy (sync files from Supabase Storage)            | Storage Administrator           |
| T - 2 Hours         | Notify ministry community via announcement banner             | Platform Administrator          |
| T - 15 Minutes      | Final pre-flight verification on target infrastructure        | Lead Migration Engineer         |
| T - 0 (Start)       | Enable brief write freeze on source Supabase database         | Database Administrator          |
| T + 5 Minutes       | Execute final delta dump (records modified since baseline)    | Database Administrator          |
| T + 10 Minutes      | Restore delta dump into Target PostgreSQL                     | Database Administrator          |
| T + 15 Minutes      | Sync delta storage objects into Cloudflare R2                 | Storage Administrator           |
| T + 18 Minutes      | Verify database row parity using parity validation script    | Lead Migration Engineer         |
| T + 20 Minutes      | Switch DNS records on Cloudflare (CNAME & API)                | Network Administrator           |
| T + 25 Minutes      | Perform live smoke tests on production domain                 | QA / Engineering                |
| T + 30 Minutes      | Deactivate maintenance banner; declare cutover complete      | Platform Administrator          |
+---------------------+---------------------------------------------------------------+---------------------------------+
```

### 3.1 Write-Freeze Implementation
During the 15-minute sync window, writes on the legacy Supabase database are gracefully suspended to prevent data divergence:

```sql
-- Apply temporary read-only state on public schema during delta extraction
ALTER SCHEMA public RENAME TO public_migrating;
CREATE SCHEMA public;

-- Present informational read-only message to incoming API queries
CREATE OR REPLACE VIEW public.system_status AS
SELECT 'System undergoing scheduled infrastructure upgrade. Resuming shortly.' AS status;
```

---

## 4. Phase 3: DNS Routing & Email Infrastructure Cutover

### 4.1 Cloudflare DNS Configuration
Because the root domain `ismprayernetwork.org` is managed in Cloudflare, DNS propagation occurs almost instantaneously (<60 seconds).

```
+------------------------------------+-------+---------------------------------------+-----------+
| Record Name                        | Type  | Value / Target                        | Proxy     |
+------------------------------------+-------+---------------------------------------+-----------+
| ismprayernetwork.org               | CNAME | ismprayernetwork.pages.dev            | Proxied   |
| www.ismprayernetwork.org           | CNAME | ismprayernetwork.pages.dev            | Proxied   |
| api.ismprayernetwork.org           | CNAME | ism-backend-worker.workers.dev        | Proxied   |
| db.internal.ismprayernetwork.org   | A     | [Target PostgreSQL Server IPv4]       | DNS Only  |
+------------------------------------+-------+---------------------------------------+-----------+
```

### 4.2 Email Subdomain (`notify.ismprayernetwork.org`) Cutover
The email sending domain must be repointed from Lovable to the new email provider (Resend or Postmark):
1. Configure SPF record: `v=spf1 include:amazonses.com include:_spf.resend.com ~all`
2. Add DKIM TXT records provided by Resend/Postmark for `notify.ismprayernetwork.org`.
3. Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@ismprayernetwork.org`.
4. Send test dispatch to verified test inboxes (Gmail, Outlook, Yahoo) to verify 100% deliverability and DKIM alignment.

---

## 5. Phase 4: Rollback Strategy & Trigger Criteria

A comprehensive migration plan must include an immediate, non-destructive rollback path if unexpected failures arise.

### 5.1 Rollback Trigger Criteria
The migration lead will order an immediate abort and rollback if any of the following conditions occur within 60 minutes post-cutover:
1. **Critical Authentication Failure:** Existing users are unable to sign in with their existing credentials (failure rate > 2%).
2. **Database Integrity Error:** The parity check reveals missing records or broken foreign key constraints between `profiles`, `books`, or `orders`.
3. **Data Mutation Failure:** Members cannot submit prayer requests or book prayer slots due to RLS or trigger exceptions.
4. **Video Room Outage:** The Daily.co WebRTC bridge fails to establish calls in `VideoCall.tsx`.
5. **Excessive Error Rates:** Cloudflare Analytics reports 5xx HTTP server error rates exceeding 1.5% across traffic.

### 5.2 Rollback Execution Runbook (Time to Execute: < 5 Minutes)
If a rollback is triggered:

```bash
# 1. Immediately revert Cloudflare DNS CNAME records back to Lovable
# Point ismprayernetwork.org back to Lovable Cloud
cloudflare-cli dns update ismprayernetwork.org --cname=ismprayernetwork.lovable.app

# 2. Re-enable writes on original Supabase database
psql -h db.ryitxoymayasdlabojsx.supabase.co -U postgres -d postgres -c "
  DROP SCHEMA IF EXISTS public CASCADE;
  ALTER SCHEMA public_migrating RENAME TO public;
"

# 3. Flush Cloudflare Edge Cache
cloudflare-cli purge-cache --zone=ismprayernetwork.org --all

# 4. Notify administrative team that rollback is complete and Lovable remains active
```

Because the legacy Supabase database and Lovable hosting environment remain untouched and fully intact during cutover, reverting DNS returns the platform to its exact pre-migration state within minutes with zero data corruption.

