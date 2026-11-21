# MPN-002: HOSTING ARCHITECTURE & TCO SPECIFICATION

**Project:** ISM Prayer Network Platform Migration  
**Document ID:** MPN-002-HOSTING-OPTIONS  
**Directive:** Lowest-Cost Reliable Production Infrastructure ($20–$40/Month Target)  
**Status:** Planning & Verification Milestone (Draft for Approval)  
**Operational Disclaimer:** No claims of zero downtime or zero data loss are asserted until an end-to-end synchronization test and live cutover rehearsal are executed in staging.  

---

## 1. Single-VPS Infrastructure Specification

To preserve 100% compatibility with the existing React frontend while eliminating vendor lock-in to Lovable Cloud and Supabase Cloud, the core backend services (PostgreSQL 16, GoTrue Auth, PostgREST API, and Supabase Realtime) are consolidated into a high-density, containerized deployment on a single 8 GB Linux Virtual Private Server (VPS). Edge delivery, static hosting, serverless APIs, and object storage are offloaded to Cloudflare.

```mermaid
flowchart TD
    subgraph CloudflareEdge [Cloudflare Edge Network]
        CFP[Cloudflare Pages - Static React 18 SPA]
        CFW[Cloudflare Workers - Mail Dispatch, Cron, APIs]
        CFR2[Cloudflare R2 - Book Covers, POPs, Reports]
        CFDNS[Cloudflare DNS + SSL Edge Proxy]
    end

    subgraph HostServer [Single Dedicated VPS - Linux Ubuntu 24.04 LTS]
        UFW[UFW Firewall: Only Ports 22, 80, 443 Exposed]
        Caddy[Caddy 2 Reverse Proxy - Auto HTTPS / TLS Termination]

        subgraph DockerBridge [Isolated Docker Internal Bridge Network: 172.20.0.0/16]
            PG[(PostgreSQL 16.4 DB + Extensions)]
            PGRST[PostgREST 12.2 API Engine - Port 3000]
            Auth[GoTrue 2.158 Auth Engine - Port 9999]
            RT[Realtime 2.30 CDC WebSockets - Port 4000]
            StorageAPI[Supabase Storage API 1.11 - Port 5000]
        end

        CronBackups[Automated Daily Encrypted DB Backup Cron]
    end

    subgraph ExternalSaaS [Managed Third-Party Providers]
        DailyCo[Daily.co WebRTC Video Infrastructure]
        EmailProvider[Resend / Postmark / Amazon SES]
        OffsiteBackup[Cloudflare R2 / Hetzner Storage Box Backup Bucket]
    end

    CFDNS -->|HTTPS Traffic| Caddy
    Caddy -->|/rest/v1/*| PGRST
    Caddy -->|/auth/v1/*| Auth
    Caddy -->|/realtime/v1/* (WebSocket)| RT
    Caddy -->|/storage/v1/*| StorageAPI

    PGRST -->|Internal DB Connection| PG
    Auth -->|Internal DB Connection| PG
    RT -->|Logical Replication WAL| PG
    StorageAPI -->|Metadata| PG
    StorageAPI -->|S3 API| CFR2

    CFW -->|Internal PostgREST Query| Caddy
    CFW -->|Send Mail API| EmailProvider
    CFW -->|Video Token Minting| DailyCo

    CronBackups -->|Nightly pg_dump + GPG| OffsiteBackup
```

### 1.1 Service Resource Allocations (8 GB RAM Baseline)

| Container / Process | Base Image (Pinned) | vCPU Limit | RAM Reservation | RAM Limit | Primary Function & Internal Port |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **PostgreSQL 16** | `postgres:16.4-alpine` | 2.0 vCPU | 2.5 GB | 3.5 GB | Relational store, RLS, PL/pgSQL triggers, WAL publisher (Internal: 5432) |
| **PostgREST** | `postgrest/postgrest:v12.2.0` | 1.0 vCPU | 256 MB | 512 MB | Auto-generated REST API translating JSON to SQL (Internal: 3000) |
| **GoTrue Auth** | `supabase/gotrue:v2.158.1` | 1.0 vCPU | 256 MB | 512 MB | JWT issuance, password verification, session refresh (Internal: 9999) |
| **Realtime CDC** | `supabase/realtime:v2.30.23`| 1.0 vCPU | 512 MB | 1.0 GB | Logical replication subscriber, WebSocket pub/sub (Internal: 4000) |
| **Storage API** | `supabase/storage-api:v1.11.0`| 0.5 vCPU | 256 MB | 512 MB | S3-proxy translating Supabase Storage calls to R2 (Internal: 5000) |
| **Caddy Reverse Proxy**| `caddy:2.8.4-alpine` | 0.5 vCPU | 64 MB | 128 MB | Automatic Let's Encrypt TLS, path-based routing (Ports 80/443) |
| **Host OS & Buffer** | Ubuntu 24.04 LTS (Kernel 6.8)| Shared | 1.0 GB | 1.8 GB | Linux page cache, OS processes, backup execution |
| **TOTAL** | — | **4 vCPU** | **4.8 GB** | **8.0 GB** | **Fits comfortably within an 8 GB VPS envelope** |

### 1.2 PostgreSQL Engine Sizing (`postgresql.conf`)
- `shared_buffers = 2GB` (25% of total server RAM)
- `work_mem = 16MB` (optimizes concurrent sorting for contact directory pagination)
- `maintenance_work_mem = 512MB` (accelerates index creation and vacuuming)
- `effective_cache_size = 5GB` (informs query planner of available filesystem cache)
- `max_connections = 100` (connection pooling handled by PostgREST and GoTrue)
- `wal_level = logical` (mandatory requirement for Supabase Realtime CDC engine)
- `max_replication_slots = 5`
- `max_wal_senders = 5`

---

## 2. VPS Hosting Provider Comparison (8 GB RAM Class)

Current market pricing for cloud compute instances with $\ge 8\text{ GB}$ RAM, dedicated IPv4 addresses, and European/US availability.

```
+---------------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| Evaluation Criteria       | Hetzner Cloud         | DigitalOcean          | Linode (Akamai)       | OVHcloud              |
+---------------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| Plan Identifier           | CPX31 (Shared AMD)    | Basic Droplet         | Shared Linode 8GB     | VPS Comfort           |
| vCPU                      | 4 vCPU (AMD EPYC)     | 4 vCPU                | 4 vCPU                | 4 vCPU                |
| RAM                       | 8 GB                  | 8 GB                  | 8 GB                  | 8 GB                  |
| Fast NVMe / SSD Storage   | 160 GB NVMe SSD       | 160 GB SSD            | 160 GB SSD            | 100 GB NVMe SSD       |
| Monthly Network Egress    | 20 TB included        | 5 TB included         | 5 TB included         | 1 Gbps unmetered      |
| Base Server Price (€ / $) | €13.80 (~$15.00) / mo | $48.00 / mo           | $48.00 / mo           | $14.50 / mo           |
| Dedicated Public IPv4     | €1.70 (~$1.85) / mo   | Included              | Included              | Included              |
| Automated Host Snapshots  | 20% (€2.76 / ~$3.00)  | 20% ($9.60 / mo)      | $10.00 / mo           | $4.00 / mo            |
| Network Latency to CF Edge| < 2 ms (Frankfurt)    | < 2 ms (Frankfurt/NYC)| < 3 ms (London/Newark)| < 4 ms (Gravelines)   |
| API Automation & Cloud-Init| Native CLI & Terraform| Doctil & Terraform    | Linode CLI & Terraform| OpenStack API         |
+---------------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| TOTAL SERVER BASELINE     | ~$16.85 / month       | $48.00 / month        | $48.00 / month        | ~$14.50 / month       |
+---------------------------+-----------------------+-----------------------+-----------------------+-----------------------+
```

### Comparative Analysis:
1. **Hetzner Cloud (Recommended Option):**
   - **Cost Efficiency:** At **$16.85/month** (including dedicated IPv4), Hetzner is nearly 65% cheaper than DigitalOcean and Linode for identical memory and CPU resources.
   - **Performance:** AMD EPYC processors with PCIe Gen4 NVMe drives deliver excellent I/O throughput for PostgreSQL transaction processing.
   - **Availability:** Locations in Falkenstein, Nuremberg, Helsinki, and Ashburn (US East).
2. **DigitalOcean:**
   - Reliable and developer-friendly, but at **$48.00/month**, it exceeds the baseline $20–$40 target before accounting for email and third-party services.
3. **OVHcloud:**
   - Lowest raw cost ($14.50/mo), but provisioning turnaround, control panel ergonomics, and storage expansion are significantly slower than Hetzner.

---

## 3. Total Cost of Ownership (TCO) Breakdown

To satisfy the **Lowest-Cost Reliable Production Directive**, all secondary operational costs must be explicitly modeled.

### 3.1 Monthly Production Cost Breakdown (Target: $20 – $40/mo)

```
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
| Infrastructure Component           | Provider & Tier          | Monthly Cost          | Billing Driver & Allocation Details                         |
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
| Primary Compute & Memory           | Hetzner CPX31 (8 GB RAM) | $15.00                | 4 vCPU, 8 GB RAM, 160 GB NVMe SSD                           |
| Dedicated Public IPv4 Address      | Hetzner Primary IPv4     | $1.85                 | Static routing for Caddy reverse proxy & SSH bastion        |
| Automated Host Snapshot Backups    | Hetzner Snapshots (20%)  | $3.00                 | Full-disk recovery snapshots                                |
| Off-Server Database Storage        | Cloudflare R2            | $0.15                 | Daily gpg-encrypted pg_dumps (14-day retention, ~10 GB)     |
| Frontend Hosting                   | Cloudflare Pages         | $0.00 (Free)          | Unlimited bandwidth, global CDN edge, SSL                   |
| Edge Serverless APIs & Cron        | Cloudflare Workers Paid  | $5.00                 | 10,000,000 req/mo, cron triggers, zero CPU idle billing     |
| Static Media & Uploads Storage     | Cloudflare R2            | $0.45                 | Book covers, POP receipts, pastoral reports (~30 GB)        |
| Production Email Delivery          | Resend / Amazon SES      | $1.50 – $15.00        | Amazon SES: $0.10/1k emails (~$1.50 for 15k emails)         |
|                                    |                          |                       | Resend Growth: $20.00/mo (optional if preferred over SES)   |
| Live WebRTC Video Calling          | Daily.co (Scale Plan)    | $0.00                 | 10,000 free participant minutes/mo included;                |
|                                    |                          |                       | $0.004/min thereafter (e.g. $8.00 for 2,000 extra minutes)  |
| Server Maintenance & Monitoring    | Open-Source / Native     | $0.00                 | Uptime Kuma + Telegram webhook alerts + unattended-upgrades |
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
| TOTAL MONTHLY PRODUCTION TCO       | Low Volume (SES):        | $26.95 / month        | **Strictly meets the $20–$40/mo directive**                 |
|                                    | High Volume (Resend):    | $45.45 / month        | (If choosing Resend branded SaaS over SES)                  |
+------------------------------------+--------------------------+-----------------------+-------------------------------------------------------------+
```

---

## 4. Architectural Model Comparison: Managed vs. Self-Hosted

```
+---------------------------+-------------------------------------------------------+-------------------------------------------------------+
| Comparison Vector         | Model A: Managed PostgreSQL + Separately Hosted Apps  | Model B: Fully Self-Hosted Single VPS (Recommended)  |
+---------------------------+-------------------------------------------------------+-------------------------------------------------------+
| Topology                  | Neon Serverless Postgres + Railway/Render Containers  | Hetzner 8 GB VPS running Docker Compose stack         |
| Estimated Monthly Cost    | $65.00 – $120.00 / month                              | $26.95 – $35.00 / month                               |
| Network Latency           | Cross-cloud latency between DB (Neon) and App (Render)| Zero latency (Unix domain sockets / Docker localhost) |
| WAL Replication (Realtime)| Complex configuration over public internet connections| Direct localhost replication slot                     |
| Operational Complexity    | Moderate (Multiple provider dashboards & billing)     | Low-Moderate (Single server, unified Docker Compose)  |
| Backup Autonomy           | Dependent on vendor snapshot policies                 | Full control over raw SQL dumps and offsite sync      |
| Financial Predictability  | Variable consumption pricing (compute hours + storage)| 100% Fixed, predictable monthly billing               |
+---------------------------+-------------------------------------------------------+-------------------------------------------------------+
```

---

## 5. Multi-Environment Cost Estimates

```
+--------------------+---------------------------------------------------------------+-----------------------+
| Environment        | Infrastructure Composition                                    | Estimated Cost        |
+--------------------+---------------------------------------------------------------+-----------------------+
| **Development**   | Local Developer Workstations running Docker Compose           | **$0.00 / month**     |
|                    | Cloudflare Pages Preview Deployments                          |                       |
|                    | Mock SMTP / Mailpit container for email inspection            |                       |
+--------------------+---------------------------------------------------------------+-----------------------+
| **Staging**        | Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB NVMe)                   | **$4.85 / month**     |
|                    | Cloudflare Pages Staging Branch (`staging-mpn.pages.dev`)     |                       |
|                    | Isolated Staging Database restored with anonymized data       |                       |
+--------------------+---------------------------------------------------------------+-----------------------+
| **Production**     | Hetzner CPX31 (4 vCPU, 8 GB RAM, 160 GB NVMe)                 | **$26.95 – $35.00/mo**|
|                    | Cloudflare Pages Production (`ismprayernetwork.org`)          |                       |
|                    | Cloudflare Workers (APIs, Mail Dispatch, Cron Triggers)       |                       |
|                    | Cloudflare R2 (3 Buckets: Book Covers, POPs, Reports)         |                       |
|                    | Automated Off-Server Nightly Backups to R2                    |                       |
+--------------------+---------------------------------------------------------------+-----------------------+
| TOTAL ALL ENVS     | Development + Staging + Production                            | **$31.80 – $39.85/mo**|
+--------------------+---------------------------------------------------------------+-----------------------+
```
*The entire multi-environment infrastructure lifecycle is achieved under the $40.00/month maximum budget.*

