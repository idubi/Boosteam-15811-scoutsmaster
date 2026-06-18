# Scoutmaster Pro - Supabase Edition

This application has been migrated from a legacy Google Sheets backend to a robust Supabase (Postgres) infrastructure.

## Database Verification Suite

To verify the integrity of the Supabase connection and ensure all tables are accessible with full CRUD permissions, you can run the automated test suite.

### Prerequisite
Ensure the following environment variables are set:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (required for bypassing matching RLS or executing maintenance tasks).

### Running the Tests
Execute the following command in the terminal:

```bash
npx tsx scripts/test-supabase-integrity.ts
```

Or via npm:

```bash
npm run test:db
```

### Health Check Endpoint
The application exposes a health check endpoint to monitor database table status in real-time:
`GET /api/health-check`

## Local Storage Keys

The application uses local storage to maintain session persistence. 
- `scoutmaster_saved_user`: The saved username of the authenticated user.
- `scoutmaster_saved_pass`: The saved plaintext password of the authenticated user to automatically persist logins across sessions.

## Tables Mapping
- `scoutsmaster_ongoing`: Raw scouting data.
- `job_execution_logs`: Background process execution history.
- `system_settings`: Application configuration.
- `teams_grades`: Aggregated team performance scores.
- `auth_config`: User authorization and role mapping (REPLACING 'AUTH' excel sheet).

---

## 📡 Hybrid Offline Sync & Ingestion System

The application features a robust offline mechanism that ensures no scouting data is lost during cellular dropouts or stadium Wi-Fi congestion.

### 1. Offline Storage
- **Key**: `scoutmaster_offline_queue`
- **Behavior**: If a match report submission fails due to network outage, the data is automatically enqueued locally in `localStorage` as a complete `SpreadsheetRow` payload.

### 2. Auto Background Sync
- Activated by a top-level React hook (`useOfflineSync`).
- Listens for the browser's `'online'` event to immediately flush queued records to Supabase.
- Alternates on a 15-second timer to resolve silent reconnection states.
- Ensures item-by-item safety; successfully uploaded records are popped from the queue, while failing ones remain intact.

### 3. Failsafe Manual Ingestion (Admin Panel)
For critical environments, Lead Scouters can bypass automatic triggers:
- **Export**: Scouters can export their local pending queue into a `.json` backup file right from the main status banner.
- **Import**: Admins can import `.json` files via the **Offline Ingestion** tab in the Admin Panel.
- **QR Code Paste**: Direct copy-paste area for scanned QR data payloads.
- **Idempotency**: All uploads use a PostgreSQL-enforced `upsert` strategy bound to the unique `sessionId` constraint, ensuring no data duplication regardless of sync frequency.
