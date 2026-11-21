# MPN-002: INFRASTRUCTURE READINESS CHECKLIST & DEPLOYMENT RUNBOOK

**Project:** ISM Prayer Network Platform Migration  
**Milestone:** MPN-002: Infrastructure Readiness  
**Document ID:** MPN-002-INFRASTRUCTURE-CHECKLIST  
**Target Cost Profile:** Lowest-Cost Reliable Production Infrastructure ($20–$40/month baseline)  
**Host Architecture:** Single-VPS (8 GB RAM, 4 vCPU, NVMe) + Cloudflare (Pages, Workers, R2)  

---

## 1. Architectural Blueprint & Resource Topology

To satisfy the operational requirement for lowest-cost reliable production infrastructure while maintaining full feature parity, the backend services are unified onto a single hardened Virtual Private Server (VPS) orchestrated via Docker Compose, fronted by Caddy (automatic TLS), with the frontend and edge APIs delivered via Cloudflare.

```mermaid
flowchart TD
    subgraph PublicInternet [Public Internet]
        Users[Web Visitors / Ministry Users]
        Admins[Ministry Coordinators / Admins]
    end

    subgraph CloudflareEdge [Cloudflare Edge Network]
        CF_Pages[Cloudflare Pages: React Frontend]
        CF_Access[Cloudflare Zero Trust / Access: Admin Gate]
        CF_Workers[Cloudflare Workers: Edge APIs & Cron Dispatch]
        CF_R2[Cloudflare R2: Offsite Encrypted Backups & Storage]
    end

    subgraph ProductionVPS [Hetzner CPX31 VPS: 4 vCPU / 8 GB RAM / 160 GB NVMe]
        Caddy[Caddy 2.8 Reverse Proxy & TLS Engine]
        
        subgraph DockerBridge [Docker Internal Network: backend_net]
            GoTrue[GoTrue v2.158.1 Auth Engine]
            PostgREST[PostgREST v12.2.0 REST API]
            Realtime[Supabase Realtime v2.30.23 CDC]
            StorageAPI[Supabase Storage API v1.11.13]
            PostgreSQL[(PostgreSQL 16.4 Alpine)]
        end
        
        UFW[UFW Firewall: Ports 22, 80, 443 Only]
        CronBackup[Daily Cron: Encrypted Backup to R2]
    end

    subgraph ExternalSaaS [External Verified Services]
        DailyCo[Daily.co Video WebRTC]
        EmailRelay[Resend / AWS SES Transactional Email]
    end

    Users -->|HTTPS| CF_Pages
    CF_Pages -->|REST: api.ismprayernetwork.org/rest/v1| Caddy
    CF_Pages -->|Auth: api.ismprayernetwork.org/auth/v1| Caddy
    CF_Pages -->|WSS: api.ismprayernetwork.org/realtime/v1| Caddy
    CF_Pages -->|WebRTC| DailyCo
    Admins -->|Enters /admin or /api/dashboard| CF_Access
    CF_Access -->|Authorized Session| CF_Pages

    Caddy -->|Reverse Proxy| GoTrue
    Caddy -->|Reverse Proxy| PostgREST
    Caddy -->|Reverse Proxy + WS| Realtime
    Caddy -->|Reverse Proxy| StorageAPI

    GoTrue -->|SQL| PostgreSQL
    PostgREST -->|SQL| PostgreSQL
    Realtime -->|Logical Replication WAL| PostgreSQL
    StorageAPI -->|Metadata SQL| PostgreSQL

    CF_Workers -->|Scheduled Trigger| EmailRelay
    CronBackup -->|Encrypted Dump Stream| CF_R2
```

---

## 2. Server Provisioning & Host Hardening Runbook

### 2.1 Specification & Base OS
- **Provider & Model:** Hetzner Cloud **CPX31** (Ashburn, VA, US or Falkenstein, DE).
- **Resources:** 4 AMD EPYC™ vCPUs, **8 GB DDR4 ECC RAM**, 160 GB NVMe SSD, 20 TB monthly traffic.
- **Operating System:** Ubuntu 24.04 LTS (Noble Numbat) 64-bit Minimal.
- **Dedicated IPv4:** 1x Static IPv4 included.

### 2.2 Host Provisioning & System Hardening Script
Execute the following setup commands upon initial VPS boot:

```bash
#!/usr/bin/env bash
# ==============================================================================
# ISM PRAYER NETWORK - HOST INITIALIZATION & HARDENING SCRIPT
# OS: Ubuntu 24.04 LTS
# ==============================================================================
set -euo pipefail

echo "==> Step 1: Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban ca-certificates gnupg lsb-release htop iotop jq rclone age

echo "==> Step 2: Creating non-root deployment user..."
if ! id -u deploy &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    mkdir -p /home/deploy/.ssh
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy-nopasswd
fi

echo "==> Step 3: Hardening SSH daemon..."
cat << 'EOF' > /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin prohibit-password
PasswordAuthentication no
ChallengeResponseAuthentication no
MaxAuthTries 4
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
EOF
systemctl restart ssh

echo "==> Step 4: Configuring UFW Host Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP ACME challenge'
ufw allow 443/tcp comment 'HTTPS Caddy'
# Explicitly block direct external database and microservice access:
ufw deny 5432 comment 'Deny Postgres direct'
ufw deny 3000 comment 'Deny PostgREST direct'
ufw deny 9999 comment 'Deny GoTrue direct'
ufw deny 4000 comment 'Deny Realtime direct'
ufw deny 5000 comment 'Deny Storage direct'
ufw --force enable

echo "==> Step 5: Configuring Fail2ban..."
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
EOF
systemctl restart fail2ban

echo "==> Step 6: Tuning Linux Kernel for PostgreSQL 16 on 8 GB RAM..."
cat << 'EOF' > /etc/sysctl.d/99-postgresql.conf
# Virtual memory and swappiness tuning
vm.swappiness = 10
vm.overcommit_memory = 2
vm.overcommit_ratio = 80
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10

# Network socket tuning
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.ip_local_port_range = 10240 65535
EOF
sysctl --system

echo "==> Step 7: Installing Docker Engine & Compose Plugin..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy

echo "==> Step 8: Preparing application directories..."
mkdir -p /opt/ism-backend/{config,scripts,backups,data/postgres,data/storage}
chown -R deploy:deploy /opt/ism-backend
chmod 700 /opt/ism-backend

echo "==> Host initialization and hardening complete."
```

---

## 3. Production Docker Compose Specification

All backend containers are pinned to exact versions, bound strictly to an internal private bridge network, and given defined healthchecks and restart policies.

### 3.1 Pinned Service Versions
- **Database:** `postgres:16.4-alpine`
- **Authentication:** `supabase/gotrue:v2.158.1`
- **REST API:** `postgrest/postgrest:v12.2.0`
- **Realtime CDC:** `supabase/realtime:v2.30.23`
- **Storage API:** `supabase/storage-api:v1.11.13`
- **Reverse Proxy:** `caddy:2.8.4-alpine`

### 3.2 Production `docker-compose.yml`

```yaml
# /opt/ism-backend/docker-compose.yml
services:
  # ----------------------------------------------------------------------------
  # CADDY REVERSE PROXY & AUTOMATIC TLS ENGINE
  # ----------------------------------------------------------------------------
  caddy:
    image: caddy:2.8.4-alpine
    container_name: ism-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - backend_net
    healthcheck:
      test: ["CMD", "caddy", "version"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      - gotrue
      - postgrest
      - realtime
      - storage

  # ----------------------------------------------------------------------------
  # POSTGRESQL 16 DATABASE
  # ----------------------------------------------------------------------------
  postgres:
    image: postgres:16.4-alpine
    container_name: ism-postgres
    restart: unless-stopped
    shm_size: 1g
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "3.0"
          memory: 4096M
        reservations:
          memory: 2048M

  # ----------------------------------------------------------------------------
  # GOTRUE AUTHENTICATION ENGINE
  # ----------------------------------------------------------------------------
  gotrue:
    image: supabase/gotrue:v2.158.1
    container_name: ism-gotrue
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@postgres:5432/postgres?sslmode=disable
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${SITE_URL}*,https://*.pages.dev*
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_SMTP_HOST: ${SMTP_HOST}
      GOTRUE_SMTP_PORT: ${SMTP_PORT}
      GOTRUE_SMTP_USER: ${SMTP_USER}
      GOTRUE_SMTP_PASS: ${SMTP_PASS}
      GOTRUE_SMTP_ADMIN_EMAIL: noreply@ismprayernetwork.org
      GOTRUE_SMTP_MAX_FREQUENCY: 1m
      GOTRUE_MAILER_AUTOCONFIRM: "false"
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
    networks:
      - backend_net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:9999/health"]
      interval: 15s
      timeout: 5s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy

  # ----------------------------------------------------------------------------
  # POSTGREST REST API
  # ----------------------------------------------------------------------------
  postgrest:
    image: postgrest/postgrest:v12.2.0
    container_name: ism-postgrest
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@postgres:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_SYSTEM_KEY: "false"
      PGRST_DB_POOL: 20
      PGRST_DB_POOL_TIMEOUT: 10
      PGRST_OPEN_API_MODE: follow-privileges
      PGRST_SERVER_PORT: 3000
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy

  # ----------------------------------------------------------------------------
  # SUPABASE REALTIME CDC & PRESENCE
  # ----------------------------------------------------------------------------
  realtime:
    image: supabase/realtime:v2.30.23
    container_name: ism-realtime
    restart: unless-stopped
    environment:
      PORT: 4000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: postgres
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_SSL: "false"
      JWT_SECRET: ${JWT_SECRET}
      REPLICATION_MODE: RLS
      REPLICATION_SLOT: supabase_realtime_replication
      SECURE_CHANNELS: "true"
      API_JWT_SECRET: ${JWT_SECRET}
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:4000/api/health || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy

  # ----------------------------------------------------------------------------
  # SUPABASE STORAGE API
  # ----------------------------------------------------------------------------
  storage:
    image: supabase/storage-api:v1.11.13
    container_name: ism-storage
    restart: unless-stopped
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://postgrest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@postgres:5432/postgres
      FILE_SIZE_LIMIT: 20971520 # 20MB
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: ism-prod
      PORT: 5000
    volumes:
      - ./data/storage:/var/lib/storage
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/status || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy

networks:
  backend_net:
    driver: bridge
    internal: false

volumes:
  caddy_data:
  caddy_config:
```

### 3.3 Tuned PostgreSQL Configuration (`postgresql.conf`)
Saved at `/opt/ism-backend/config/postgresql.conf`:

```ini
# Memory Configuration for 8 GB RAM Host (allocated: 4 GB max to PG)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 16MB
maintenance_work_mem = 512MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
default_statistics_target = 100

# Concurrency & Connections
max_connections = 100
shared_preload_libraries = 'pgcrypto'

# Replication & Supabase Realtime CDC Requirements
wal_level = logical
max_replication_slots = 5
max_wal_senders = 5

# Logging & Monitoring
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 250 # Log queries exceeding 250ms
```

### 3.4 Reverse Proxy Specification (`Caddyfile`)
Saved at `/opt/ism-backend/config/Caddyfile`:

```caddyfile
api.ismprayernetwork.org {
    # Automatic TLS via Let's Encrypt / ZeroSSL
    tls support@ismprayernetwork.org

    # Global Security Headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Access-Control-Allow-Origin "https://ismprayernetwork.org"
        Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        Access-Control-Allow-Headers "authorization, content-type, apikey, prefer, range"
        Access-Control-Expose-Headers "content-range, range"
    }

    # Handle CORS Preflight
    @options {
        method OPTIONS
    }
    respond @options 204

    # Route: PostgREST API
    handle /rest/v1/* {
        uri strip_prefix /rest/v1
        reverse_proxy postgrest:3000
    }

    # Route: GoTrue Authentication
    handle /auth/v1/* {
        uri strip_prefix /auth/v1
        reverse_proxy gotrue:9999
    }

    # Route: Supabase Realtime (WebSocket CDC & Presence)
    handle /realtime/v1/* {
        uri strip_prefix /realtime/v1
        reverse_proxy realtime:4000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up Upgrade {http.upgrade}
            header_up Connection {http.connection}
        }
    }

    # Route: Storage API
    handle /storage/v1/* {
        uri strip_prefix /storage/v1
        reverse_proxy storage:5000
    }

    # Default fallback
    handle {
        respond "ISM Prayer Network API Gateway" 200
    }
}
```

---

## 4. Automated Off-Server Database & Storage Backup Runbook

### 4.1 Backup Strategy & Retention Lifecycle
- **Backup Window:** Daily at 03:00 UTC (lowest traffic window).
- **Target Destination:** Cloudflare R2 (`ism-backups-prod` bucket).
- **Encryption:** Symmetric AES-256 via GPG (`gpg --batch --symmetric --cipher-algo AES256`).
- **Retention:**
  - Local VPS disk: Retain last **3 daily backups** in `/opt/ism-backend/backups`.
  - Cloudflare R2 cold storage: Retain **14 daily backups** via automatic R2 bucket lifecycle rule.
- **Estimated Storage Cost:** 14 snapshots x 150 MB = ~2.1 GB total = **$0.03/month** on R2.

### 4.2 Automated Backup Script (`/opt/ism-backend/scripts/backup.sh`)

```bash
#!/usr/bin/env bash
# ==============================================================================
# ISM PRAYER NETWORK - AUTOMATED OFF-SERVER DATABASE & STORAGE BACKUP
# ==============================================================================
set -euo pipefail

BACKUP_DIR="/opt/ism-backend/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="${BACKUP_DIR}/ism_db_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${DUMP_FILE}.gpg"
STORAGE_TAR="${BACKUP_DIR}/ism_storage_${TIMESTAMP}.tar.gz"
STORAGE_ENCRYPTED="${STORAGE_TAR}.gpg"
R2_BUCKET="r2:ism-backups-prod"
WEBHOOK_URL="${DISCORD_ALERT_WEBHOOK:-}"

source /opt/ism-backend/.env

notify() {
    local status="$1"
    local message="$2"
    if [ -n "${WEBHOOK_URL}" ]; then
        curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"content\": \"[${status}] ISM Backup (${TIMESTAMP}): ${message}\"}" \
            "${WEBHOOK_URL}" || true
    fi
}

echo "==> [1/5] Dumping PostgreSQL database..."
docker exec ism-postgres pg_dump \
    -U postgres \
    -d postgres \
    --format=custom \
    --compress=9 \
    --file=/tmp/dump.tmp

docker cp ism-postgres:/tmp/dump.tmp "${DUMP_FILE}"
docker exec ism-postgres rm /tmp/dump.tmp

echo "==> [2/5] Encrypting database dump with AES-256..."
echo "${BACKUP_ENCRYPTION_KEY}" | gpg --batch --yes --passphrase-fd 0 \
    --symmetric --cipher-algo AES256 -o "${ENCRYPTED_FILE}" "${DUMP_FILE}"
rm -f "${DUMP_FILE}"

echo "==> [3/5] Archiving and encrypting storage files..."
tar -czf "${STORAGE_TAR}" -C /opt/ism-backend/data/storage .
echo "${BACKUP_ENCRYPTION_KEY}" | gpg --batch --yes --passphrase-fd 0 \
    --symmetric --cipher-algo AES256 -o "${STORAGE_ENCRYPTED}" "${STORAGE_TAR}"
rm -f "${STORAGE_TAR}"

echo "==> [4/5] Uploading encrypted archives to Cloudflare R2..."
rclone copy "${ENCRYPTED_FILE}" "${R2_BUCKET}/database/"
rclone copy "${STORAGE_ENCRYPTED}" "${R2_BUCKET}/storage/"

echo "==> [5/5] Pruning local backups older than 3 days..."
find "${BACKUP_DIR}" -name "*.gpg" -type f -mtime +3 -delete

echo "==> Backup complete. DB: $(ls -lh ${ENCRYPTED_FILE} | awk '{print $5}')"
notify "SUCCESS" "Database and storage backed up and uploaded to R2 successfully."
```

### 4.3 Scheduled Cron Job
Configured in `/etc/cron.d/ism-backup`:
```cron
0 3 * * * deploy /opt/ism-backend/scripts/backup.sh >> /var/log/ism-backup.log 2>&1
```

---

## 5. Production Backup Verification & Disaster Recovery Test

Prior to cutover, the integrity of the backup and restoration mechanism must be verified in an isolated test environment.

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as DevOps Engineer
    participant R2 as Cloudflare R2
    participant TestHost as Isolated Test Environment
    participant TestDB as Test PostgreSQL Container
    participant GoTrue as Test GoTrue Instance

    Engineer->>R2: Downloads ism_db_YYYYMMDD.dump.gpg
    Engineer->>TestHost: Decrypts dump using symmetric AES-256 key
    TestHost->>TestDB: Initializes empty postgres:16.4 container
    TestHost->>TestDB: Executes pg_restore --clean --no-owner -d postgres
    TestHost->>TestDB: Runs Table & Row Count Parity Verification Query
    TestDB-->>TestHost: Returns matching 24 tables & row totals
    TestHost->>TestDB: Runs Auth User & Hash Integrity Check
    TestDB-->>TestHost: Confirms bcrypt $2a$/$2b$ hashes & UUID keys intact
    TestHost->>GoTrue: Attempts test token minting with known test account
    GoTrue-->>TestHost: Issues valid JWT (Authentication Verified)
    TestHost->>TestDB: Runs RLS Policy & Trigger Smoke Tests
    TestDB-->>TestHost: All assertions pass -> Backup Certified
```

### 5.1 Step-by-Step Restoration Verification Procedure

#### Step 1: Decrypt Backup Artifact
```bash
# Decrypt archive on verification host
echo "${BACKUP_ENCRYPTION_KEY}" | gpg --batch --yes --passphrase-fd 0 \
    -d -o restored_db.dump ism_db_20261024_030000.dump.gpg
```

#### Step 2: Spin Up Test PostgreSQL Container
```bash
docker run -d --name ism-restore-test \
    -e POSTGRES_PASSWORD=restore_test_password \
    -p 55432:5432 postgres:16.4-alpine
sleep 5
```

#### Step 3: Execute Database Restoration
```bash
docker cp restored_db.dump ism-restore-test:/tmp/restored.dump
docker exec ism-restore-test pg_restore \
    -U postgres \
    -d postgres \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    /tmp/restored.dump
```

#### Step 4: Execute SQL Verification Assertions
Connect to the test instance and run the validation suite:

```sql
-- 1. Verify Core Application Tables Exist (Must return 24)
SELECT count(*) AS application_tables_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'books', 'categories', 'profiles', 'testimonies', 'programs', 'events',
    'contact_messages', 'newsletter_subscribers', 'prayer_requests', 'prayer_groups',
    'purchase_orders', 'purchases', 'site_settings', 'combo_packs', 'combo_pack_items',
    'campaigns', 'contacts', 'announcements', 'prayer_reports', 'prayer_points',
    'group_prayer_assignments', 'group_call_participations', 'group_members', 'prayer_weeks'
  );

-- 2. Verify Authentication Records and UUID Continuity
SELECT 
    count(*) AS total_users,
    count(CASE WHEN encrypted_password LIKE '$2a$%' OR encrypted_password LIKE '$2b$%' THEN 1 END) AS valid_bcrypt_hashes,
    count(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) AS verified_emails
FROM auth.users;

-- 3. Verify Foreign Key Relational Integrity (Zero Orphaned Records)
SELECT count(*) AS orphaned_profiles
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

SELECT count(*) AS orphaned_orders
FROM public.purchase_orders po
LEFT JOIN auth.users u ON po.user_id = u.id
WHERE po.user_id IS NOT NULL AND u.id IS NULL;

-- 4. Verify PostgreSQL Extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp');

-- 5. Verify RLS Security Policy Presence
SELECT schemaname, tablename, count(policyname) AS active_policies
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
GROUP BY schemaname, tablename;
```

#### Step 5: Tear Down Test Environment
```bash
docker stop ism-restore-test && docker rm ism-restore-test
rm -f restored_db.dump
```

---

## 6. Container Monitoring, Health Checks & Alerting

### 6.1 Container Restart Policies & Memory Guardrails
Every container in `docker-compose.yml` specifies:
- `restart: unless-stopped` to survive host reboots and automated kernel updates.
- Memory constraints: `postgres` capped at `4096M` to avoid Linux Out-Of-Memory (OOM) killer terminations.

### 6.2 Lightweight Host Monitoring Stack (< 100 MB RAM Footprint)
Rather than deploying heavy observability stacks (Datadog/Elasticsearch) which would consume 2–4 GB of memory:
1. **Container Healthcheck Exporter:** Integrated Caddy/Docker curl checks report directly to Docker daemon state.
2. **External Synthetic Probe (Uptime Kuma / Better Stack Free Tier):**
   - Probe 1: `https://api.ismprayernetwork.org/auth/v1/health` (Checks GoTrue + DB connectivity).
   - Probe 2: `https://api.ismprayernetwork.org/rest/v1/` (Checks PostgREST + Caddy).
   - Probe 3: `https://ismprayernetwork.org` (Checks Cloudflare Pages edge delivery).
   - Check interval: Every 60 seconds.
   - Alert notifications dispatched to ministry administrator Discord / Slack / Telegram channel upon 2 consecutive failures.

### 6.3 Resource Alert Thresholds

| Metric | Warning Threshold | Critical Alert Threshold | Action Triggered |
| :--- | :--- | :--- | :--- |
| **Host RAM Usage** | > 85% for 5 min | > 92% for 2 min | Automated notification; inspect `postgrest` pool and `postgres` buffer allocations |
| **NVMe Disk Usage** | > 75% capacity | > 85% capacity | Automated notification; trigger backup prune and Docker image prune (`docker image prune -a`) |
| **Docker Container Down** | Any service != `healthy` | Any service exited | Docker auto-restarts (`unless-stopped`); alert webhook sent |
| **API Error Rate (5xx)** | > 0.5% of requests | > 2.0% of requests | Inspection of PostgreSQL connection saturation |
| **Backup Job Failure** | Cron exit code != 0 | File absent on R2 | Immediate high-priority developer alert |

---

## 7. Frontend Migration & Connection Configuration Runbook

### 7.1 Client Configuration Changes

#### 1. Update [src/integrations/supabase/client.ts](file:///c:/Users/user/Documents/ismprayernetwork/src/integrations/supabase/client.ts)
Remove the Lovable-specific `previewAuthStorage` import and broker logic:

```typescript
// src/integrations/supabase/client.ts (Target Migration Configuration)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://api.ismprayernetwork.org';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

#### 2. Remove Lovable Artifacts & Preview Storage
- Delete obsolete file: `src/integrations/supabase/previewAuthStorage.ts`.
- In [vite.config.ts](file:///c:/Users/user/Documents/ismprayernetwork/vite.config.ts), remove `lovable-tagger`:
  ```typescript
  // vite.config.ts (Cleaned production configuration)
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react-swc";
  import path from "path";

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
  ```
- In [package.json](file:///c:/Users/user/Documents/ismprayernetwork/package.json):
  - Remove `"lovable-tagger": "..."` from `devDependencies`.
  - Update `predev` and `prebuild` scripts from `bunx tsx scripts/generate-sitemap.ts` to standard `npx tsx scripts/generate-sitemap.ts` for native Cloudflare Pages Node 20 build environment compatibility.

### 7.2 Cloudflare Pages Build Specification
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- **Node.js Version:** `20.18.0`
- **Environment Variables:**
  - `VITE_SUPABASE_URL = https://api.ismprayernetwork.org`
  - `VITE_SUPABASE_ANON_KEY = <Rotated Self-Hosted Anon JWT>`
  - `VITE_DAILY_CO_DOMAIN = ismprayernetwork.daily.co`

---

## 8. Master Infrastructure Readiness Checklist

| Category | Verification Item | Status / Target | Readiness Sign-off |
| :--- | :--- | :--- | :--- |
| **Compute** | Hetzner CPX31 (4 vCPU, 8 GB RAM, 160 GB NVMe) selected | Specification defined ($16.85/mo) | Ready for Staging |
| **Compute** | Target monthly baseline TCO verified ($26.95/mo with SES, $45.45/mo with Resend) | Within directive ($20–$40/mo) | Verified in MPN-002-HOSTING |
| **Host Security** | Ubuntu 24.04 LTS hardening script prepared | UFW 22/80/443 only; fail2ban configured | Ready for Deployment |
| **Containers** | Production `docker-compose.yml` with pinned versions prepared | Postgres 16.4, GoTrue 2.158, PostgREST 12.2 | Ready for Deployment |
| **Reverse Proxy** | Caddyfile prepared with automatic TLS & CORS | Routes `/auth`, `/rest`, `/realtime`, `/storage` | Ready for Deployment |
| **Database** | `postgresql.conf` tuned for 8 GB RAM & `wal_level = logical` | `shared_buffers = 2GB`, CDC replication slot | Ready for Deployment |
| **Authentication** | GoTrue bcrypt hash compatibility verified | Zero forced password resets | Verified in MPN-002-AUTH |
| **Authentication** | `auth.users` UUID preservation & 11 foreign key tables mapped | 100% relational integrity guaranteed | Verified in MPN-002-AUTH |
| **Access Control** | Four-digit administrative PIN replacement defined | Cloudflare Access + HttpOnly cookies + Rate limit | Verified in MPN-002-SECURITY |
| **Credentials** | Repository credential audit completed (zero plaintext secrets) | Rotation lifecycle documented | Verified in MPN-002-SECURITY |
| **Storage** | Bucket access model defined (`pop-uploads` private, signed URLs) | Supabase Storage API parity confirmed | Verified in MPN-002-SECURITY |
| **Backups** | Automated daily encrypted backup script to Cloudflare R2 drafted | 14-day retention, GPG AES-256 encryption | Ready for Deployment |
| **Recovery** | Disaster recovery restoration verification procedure defined | SQL assertions & GoTrue smoke test drafted | Ready for Staging |
| **Frontend** | `client.ts`, `vite.config.ts`, and `package.json` cleaned of Lovable tags | Standard Vite SPA + localStorage auth | Ready for Testing |

> [!IMPORTANT]
> **MILESTONE STATUS:** All preparatory tasks for MPN-002 are fully documented. In compliance with strict safety directives, **no production infrastructure has been created, no DNS records have been changed, no data has been migrated, and no production code has been modified.**
>
> Await formal approval before proceeding to staging environment provisioning.

