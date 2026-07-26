## Goal

Add a **Global Super Admin** layer on top of the existing GlobalPrime app: multi-domain (multi-tenant) control, admin management, network requests + postback generator, offerwall control center, revenue analytics, logs/audit, and system tooling — styled like the uploaded dark SaaS mockup (`🛡 SUPER ADMIN` sidebar, stat cards, dark tables, toggles, modals, toasts).

The existing user dashboard and per-site admin panel stay as they are. The super admin sits above them at `/superadmin/*`.

## Phasing

I'll build this in 4 shippable phases rather than one giant drop, so each phase is verifiable.

### Phase 1 — Foundation (database + shell + dashboard)
- Migration for the new tables: `domains`, `admins`, `roles`, `permissions`, `role_permissions`, `publishers`, `networks`, `network_requests`, `postbacks`, `api_keys`, `notifications`, `audit_logs`, `system_logs`, `cron_jobs`, `revenue_reports`, `backups`. Existing `profiles`, `offerwalls`, `withdrawals`, `user_roles` are extended (add `domain_id`, offerwall API/secret/iframe/priority/revenue-share fields) rather than duplicated.
- `super_admin` added to the `app_role` enum; `has_role()` reused for RLS. Every table gets GRANTs + RLS scoped so super admin sees everything, domain admins see only their assigned domains.
- `/superadmin` route group with the dark sidebar shell from the mockup, top bar, dark/light toggle, toasts, confirm dialogs, reusable `StatCard`, `DataTable` (search + sort + pagination + CSV export), `Toggle`, `Modal`, loading/empty/error states.
- Dashboard page: all 12 stat cards + recent-activity sections, all wired to real queries.

### Phase 2 — Admins, roles, domains, users, publishers
- Admin CRUD (create via Supabase Auth admin API in a server function, suspend/activate, reset password, assign domains, revenue share, performance view).
- Role & permission matrix editor (checkbox grid per role).
- Domain manager (add/edit/suspend, theme/currency/language, live user + revenue counts).
- User management with balance add/deduct + transaction drawer; publisher management.

### Phase 3 — Networks, postbacks, offerwalls, revenue
- Network requests: submit → pending/approved/rejected workflow with full approval history.
- Postback generator: variable mapping (user/payout/status/transaction), secret + signature validation, generated URL with copy, sample request, and a live "test postback" that hits the real endpoint.
- Offerwall management + Offerwall Postback Center (postback URL, iframe URL, copy buttons, last received postback, last error, test integration).
- Revenue & analytics: cards, revenue by domain/admin/network/offerwall/country/publisher, Recharts charts (daily/monthly/network/offerwall), CSV + Excel + PDF export.
- Withdrawal management at global scope (approve/reject/mark paid/export).

### Phase 4 — Ops surfaces
- Notification center with Supabase Realtime for the 8 event types.
- System logs (level filters, search, export) and audit trail (old/new value, IP, browser, domain) with an audit trigger on key tables.
- Global search across users/admins/publishers/networks/offerwalls/domains/transactions.
- Cron job monitor backed by a `cron_jobs` table written by pg_cron jobs; backup manager records backup runs.

## Technical notes

- Routes live under `src/routes/_authenticated/superadmin/*` (TanStack file routing — no `pages/` folder on this stack). The subtree is gated by a `super_admin` role check.
- All privileged actions (create admin, approve request, adjust balance, generate keys) go through `createServerFn` with `requireSupabaseAuth` + a server-side super-admin check — never trusted from the client.
- Reads use TanStack Query (`ensureQueryData` in loaders, `useSuspenseQuery` in components) with realtime invalidation.
- Charts via `recharts`; exports via `papaparse`/`xlsx`/`jspdf`.
- **System Health** (CPU/memory/Redis) can't be measured from a serverless worker — I'll render database, storage, API and queue status from real probes, and mark CPU/memory/Redis as "not available on this hosting" rather than faking numbers.
- **Backups**: Supabase manages actual DB backups; the Backup Manager will trigger and record logical export jobs and show history, not replace Supabase PITR.
