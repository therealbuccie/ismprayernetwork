const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG_RESTORE = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_restore.exe';
const BACKUP_FILE = 'C:\\Users\\user\\Desktop\\ismprayernetwork_261121.backup\\ismprayernetwork_261121.backup';

function unescapeCopyVal(val) {
  if (val === '\\N') return null;
  let res = '';
  for (let i = 0; i < val.length; i++) {
    if (val[i] === '\\' && i + 1 < val.length) {
      const next = val[i + 1];
      if (next === 'n') { res += '\n'; i++; }
      else if (next === 'r') { res += '\r'; i++; }
      else if (next === 't') { res += '\t'; i++; }
      else if (next === 'b') { res += '\b'; i++; }
      else if (next === 'f') { res += '\f'; i++; }
      else if (next === 'v') { res += '\v'; i++; }
      else if (next === '\\') { res += '\\'; i++; }
      else { res += next; i++; }
    } else {
      res += val[i];
    }
  }
  return res;
}

function sqlQuote(val) {
  if (val === null) return 'NULL';
  return "'" + val.replace(/'/g, "''") + "'";
}

function extractTableInserts(schema, tableName, conflictClause) {
  const cmd = `"${PG_RESTORE}" -a -n ${schema} -t ${tableName} -f - "${BACKUP_FILE}"`;
  let out;
  try {
    out = execSync(cmd, { maxBuffer: 100 * 1024 * 1024, encoding: 'utf8' });
  } catch (err) {
    console.error(`Failed to dump ${schema}.${tableName}:`, err.message);
    return { count: 0, sql: '' };
  }

  const lines = out.split('\n');
  let inCopy = false;
  let columns = [];
  const rows = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith(`COPY ${schema}.${tableName} `)) {
      inCopy = true;
      const m = trimmed.match(/\(([^)]+)\)/);
      if (m) {
        columns = m[1].split(',').map(c => c.trim());
      }
      continue;
    }

    if (inCopy) {
      if (trimmed === '\\.') {
        inCopy = false;
        break;
      }
      const rawVals = line.endsWith('\r') ? line.slice(0, -1).split('\t') : line.split('\t');
      if (rawVals.length === columns.length) {
        rows.push(rawVals.map(unescapeCopyVal));
      }
    }
  }

  if (rows.length === 0) {
    return { count: 0, sql: '' };
  }

  const BATCH_SIZE = 100;
  let tableSql = `-- ==========================================================================\n`;
  tableSql += `-- Table: ${schema}.${tableName} (${rows.length} rows)\n`;
  tableSql += `-- ==========================================================================\n`;

  const onConflict = conflictClause || 'ON CONFLICT DO NOTHING';

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const colList = columns.map(c => `"${c}"`).join(', ');
    
    const valueTuples = batch.map(row => {
      const formatted = row.map(sqlQuote).join(', ');
      return `  (${formatted})`;
    }).join(',\n');

    tableSql += `INSERT INTO ${schema}.${tableName} (${colList}) VALUES\n${valueTuples}\n${onConflict};\n\n`;
  }

  return { count: rows.length, sql: tableSql };
}

// 1. Core tables for authentication & app features
const CORE_TABLES = [
  { schema: 'auth', name: 'users', conflict: 'ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data, raw_app_meta_data = EXCLUDED.raw_app_meta_data, email_confirmed_at = EXCLUDED.email_confirmed_at' },
  { schema: 'auth', name: 'identities', conflict: 'ON CONFLICT (provider, provider_id) DO NOTHING' },
  { schema: 'public', name: 'profiles', conflict: 'ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role' },
  { schema: 'public', name: 'site_settings', conflict: 'ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at' },
  { schema: 'public', name: 'categories', conflict: 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name' },
  { schema: 'public', name: 'books', conflict: 'ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, price = EXCLUDED.price, cover_image_url = EXCLUDED.cover_image_url, stock = EXCLUDED.stock' },
  { schema: 'public', name: 'combo_packs', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'combo_pack_items', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'purchases', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'purchase_orders', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_groups', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'group_members', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_points', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_weeks', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_requests', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_room_sessions', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_room_participants', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_slots', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'prayer_interactions', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'testimonies', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'announcements', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'programs', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'program_dispatches', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'campaigns', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'contact_messages', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'newsletter_subscribers', conflict: 'ON CONFLICT (id) DO NOTHING' }
];

// 2. High-volume historical tables
const LOGS_TABLES = [
  { schema: 'public', name: 'contacts', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'program_engagements', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'activity_logs', conflict: 'ON CONFLICT (id) DO NOTHING' },
  { schema: 'public', name: 'group_call_participations', conflict: 'ON CONFLICT (id) DO NOTHING' }
];

console.log('Generating Part 1: Core Authentication & App Data...');
let coreSql = `-- ISM PRAYER NETWORK — COMPLETE DATABASE RESTORATION PART 1 (AUTH & CORE DATA)
-- Generated from production backup at 2026-11-21 16:26:51
-- Run this in your Supabase SQL Editor.

BEGIN;

-- Temporarily bypass triggers and foreign key checks during batch restore
SET session_replication_role = 'replica';

-- Temporarily disable trigger on auth.users to prevent duplicate profile insertion
ALTER TABLE auth.users DISABLE TRIGGER ALL;

`;

let totalCoreRows = 0;
for (const t of CORE_TABLES) {
  const res = extractTableInserts(t.schema, t.name, t.conflict);
  totalCoreRows += res.count;
  coreSql += res.sql;
  console.log(`  ✓ ${t.schema}.${t.name}: ${res.count} rows`);
}

coreSql += `
-- Re-enable triggers and foreign key checks
ALTER TABLE auth.users ENABLE TRIGGER ALL;
SET session_replication_role = 'origin';

COMMIT;
`;

const part1Path = path.join(__dirname, '..', 'supabase', 'RESTORE_PART1_AUTH_AND_DATA.sql');
fs.writeFileSync(part1Path, coreSql, 'utf8');
console.log(`Part 1 written to: ${part1Path} (${totalCoreRows} rows, ${(fs.statSync(part1Path).size / 1024).toFixed(1)} KB)`);

console.log('Generating Part 2: Contacts & Activity Logs...');
let logsSql = `-- ISM PRAYER NETWORK — COMPLETE DATABASE RESTORATION PART 2 (CONTACTS & LOGS)
-- Generated from production backup at 2026-11-21 16:26:51
-- Run this in your Supabase SQL Editor.

BEGIN;

SET session_replication_role = 'replica';

`;

let totalLogsRows = 0;
for (const t of LOGS_TABLES) {
  const res = extractTableInserts(t.schema, t.name, t.conflict);
  totalLogsRows += res.count;
  logsSql += res.sql;
  console.log(`  ✓ ${t.schema}.${t.name}: ${res.count} rows`);
}

logsSql += `
SET session_replication_role = 'origin';

COMMIT;
`;

const part2Path = path.join(__dirname, '..', 'supabase', 'RESTORE_PART2_CONTACTS_AND_LOGS.sql');
fs.writeFileSync(part2Path, logsSql, 'utf8');
console.log(`Part 2 written to: ${part2Path} (${totalLogsRows} rows, ${(fs.statSync(part2Path).size / 1024 / 1024).toFixed(2)} MB)`);
