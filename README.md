# VitaMind Backoffice

Admin console for the VitaMind platform: patient safety queues, clinician operations, finance and system health.
Next.js (App Router) + Tailwind + shadcn/ui, talking to the NestJS API in `../vitamind_backend/apps/api`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (webpack)
npm run build && npm start
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_URL` (or `NEXT_PUBLIC_API_URL`) | `http://localhost:5000` | Base URL of the VitaMind API |

The backend must be running (and restarted after backend changes) for pages to load data.

## How it talks to the API

```
Browser ──► /api/admin/<path> ──► {API_URL}/api/v1/admin/<path>      (Next route handler = BFF)
Browser ──► /api/auth/<action> ─► {API_URL}/api/v1/auth/admin/<action>
```

- Tokens live in httpOnly cookies. The browser never sees them; the proxy (`src/app/api/admin/[...path]/route.ts`)
  attaches the Bearer token, refreshes once on 401, and streams JSON and CSV back unchanged.
- Client code calls `lib/api/*.ts` (`api.get/post/patch/put/delete`). Responses are unwrapped from the
  `{ success, data }` envelope and errors become `ApiError` with a readable message.
- Roles (`SUPER_ADMIN`, `ADMIN`, `FINANCE`, `SUPPORT`) are mirrored in `lib/permissions` to hide what a role cannot use.
  The backend `RolesGuard` stays the authority.

## One feature, one page

Each capability lives on exactly one page. Other pages link to it instead of re-implementing it.

| Group | Page | Route | Owns | API (`/api/v1/admin/…`) |
| --- | --- | --- | --- | --- |
| Overview | Dashboard | `/admin/dashboard` | Headline KPIs, risk distribution, "needs attention" triage | `dashboard/*` |
| | System health | `/admin/system` | Component health, backlogs, AI engines, breaker reset | `system/*` |
| Patients | Users | `/admin/users`, `/admin/users/[id]` | Accounts, status, subscription tier, payments of one user, **risk trajectory** | `users/*` |
| | Diagnostics | `/admin/diagnostics` | Mira sessions, funnel, abandonment | `diagnostics/*` |
| Clinical | Crisis events | `/admin/crisis-events` | Crisis queue and handling (take, resolve, escalate, false alert) | `crisis-events/*` |
| | Clinical alerts | `/admin/clinical-alerts` | Alert queue and rerouting | `clinical-alerts/*` |
| Analytics | Detection quality | `/admin/model-drift` | Crisis-rate drift and false positives | `model-drift`, `false-positives` |
| Finance | Payments | `/admin/payments` | Transactions, outcomes, revenue, subscribers, refunds | `payments/*` |
| | Subscription plans | `/admin/subscription-plans` | Plan catalogue | `payments/subscription-plans/*` |
| Operations | Notifications | `/admin/notifications` | Delivery log, own inbox, announcements | `notifications/*` |
| | Clinics | `/admin/clinics` | Clinic records | `clinics/*` |
| | Psychologists | `/admin/psychologists` | Clinician directory, profile, status, caseload | `psychologists/*` |
| | Assignments | `/admin/assignments` | Patient ↔ clinician circuit (assign, end, primary) | `assignments/*` |
| | Coverage | `/admin/coverage` | Absence / on-call cover | `coverage/*` |
| | Licences | `/admin/licenses` | Licence verification queue | `psychologists/:id/license/*` |
| Data | Exports | `/admin/exports` | CSV exports (reason required, audited) | `export/*` |

Redirects kept for old links: `/admin/risk-history` → user detail, `/admin/false-positives` → Detection quality.
`/admin/sessions` and `/admin/behavioural-analytics` return 404 (the backend has no such endpoints).

### Dashboard vs. owner pages

The dashboard shows summary numbers and links; it does not repeat charts. Diagnostics funnel → Diagnostics,
payment outcomes and plans → Payments, risk history → user detail.

## Notifications → pages

The API attaches `reference: { kind, id }` to every notification (resolved server-side from its type and payload).
The single mapping from `kind` to page is `notificationTarget()` in `src/lib/constants/navigation.ts`;
it is used by the notifications table ("Opens" column) and the bell.

| `kind` | Opens | Landing |
| --- | --- | --- |
| `CRISIS_EVENT` | Crisis events | `?focus=<id>` opens the event |
| `CLINICAL_ALERT` | Clinical alerts | `?focus=<id>` opens the alert drawer |
| `ASSIGNMENT` | Assignments | `?focus=<id>` narrows the list to it |
| `PSYCHOLOGIST` | Psychologists | `?focus=<id>` opens the profile |
| `LICENSE` | Licences | `?focus=<id>` opens the verification |
| `PAYMENT` | Payments | `?focus=<id>` opens the payment |
| `COVERAGE` | Coverage | whole-team screen |
| `PATIENT` | `/admin/users/<id>` | patient record |

Secure messages and report escalations never carry a reference (clinician-only content). The bell shows the
signed-in admin's own inbox only; the Notifications page is the cross-audience delivery log.
To add a new target: extend `NotificationReferenceKind` (backend `notification-reference.ts` + `types/admin/models.ts`)
and add one line to `TARGETS`.

## Layout of `src`

```
app/admin/*            pages (thin: permission gate + view)
app/api/…              BFF route handlers (admin proxy, auth)
components/admin/*     views per feature, shared/ (tables, filters, dialogs), charts/, layout/
hooks/admin/*          useApiQuery, useApiMutation, useListState (URL-synced filters), table prefs
lib/api/*              typed endpoint clients, one file per backend area
lib/constants/         navigation (sidebar + notification targets), status metadata
lib/permissions        role → permission map
types/admin/*          API types
```

## Known gaps

- `GET /export/psychiatric-report/:userId` answers 501 in the backend; there is no UI for it.
- Payment refunds answer 501 until a payment provider is integrated.
- The backend still exposes both `GET /payments/user/:userId` and `GET /users/:id/payments`; the UI uses the latter.
- Unused legacy files from the earlier app (`src/app/[sessionId]`, `src/actions`, `components/admin/pages`, …)
  are still on disk and can be deleted; nothing reachable imports them.

## Working rules

No git commands from tooling; changes stay on disk and are committed manually. See `CLAUDE.md`.
