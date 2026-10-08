# SynQ Admin

The back-office of the SynQ platform: a secure workspace where administrators, operations teams and clinical coordinators monitor risk, manage clinical workflows, oversee providers and keep the platform healthy.

![Next.js](https://img.shields.io/badge/Next.js-16-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Getting started](#getting-started)
5. [Configuration](#configuration)
6. [Architecture](#architecture)
7. [Project structure](#project-structure)
8. [Scripts](#scripts)
9. [Security](#security)
10. [Contributing](#contributing)

## Overview

SynQ Admin supports high-responsibility operational decisions. It brings patient and clinical oversight, crisis and alert triage, provider management, system health monitoring and reporting into one place, with role-based permissions and auditability built into every workflow.

It talks to the SynQ API only; it never reaches the database or the AI engines directly.

## Features

| Area | Capabilities |
|---|---|
| Dashboard | Operational summary and prioritisation |
| Users | Patient account overview and health-risk context |
| Diagnostics | Clinical funnel and process metrics |
| Crisis events | Incident workflow and escalation handling |
| Clinical alerts | Triage and routing of alerts |
| Psychologists and clinics | Provider portfolio and licenses |
| Assignments and coverage | Care assignments, staffing and capacity tracking |
| Risk history, false positives, model drift | Monitoring of the AI-assisted screening |
| System | Health of the API and of the AI engines |
| Notifications and exports | Communication routing and CSV exports |

## Technology stack

- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS 4, shadcn/ui and Radix UI
- Recharts for analytics, Framer Motion for motion
- Zod and React Hook Form for validation and forms
- ESLint

## Getting started

**Prerequisites:** Node.js 20+, npm 10+, and a running SynQ API.

```bash
npm install
npm run dev -- -p 3002
```

Open `http://localhost:3002`. The port is a recommendation: the patient app uses `3000` and the psychologist app `3005` in the same local setup.

Production build:

```bash
npm run build
npm run start
```

## Configuration

Create a `.env.local` file when the API is not on the default address.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Base URL of the SynQ API, without a trailing slash |
| `API_URL` | `NEXT_PUBLIC_API_URL` | Server-side only: lets the Next.js server reach the API over an internal URL |

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

On the API side, add this app's origin to `CORS_ORIGINS` (for example `http://localhost:3002`) and make sure the admin account exists (`npm run seed:admin` in the API project).

## Architecture

Sensitive administrative traffic goes through a server-side proxy so that tokens stay out of client code:

```text
Browser ──► /api/admin/... ──► SynQ API (/api/v1/admin/...) ──► data, reports, AI engine status
Browser ──► /api/auth/...  ──► SynQ API (/auth/admin/...)    ──► login, 2FA, refresh
```

- The app uses typed API clients and route-level permission checks.
- Authentication follows the admin model of the API: password, then TOTP 2FA, short-lived access token and an `httpOnly` refresh cookie.
- Roles are enforced by the API on every route and mirrored in the UI to hide actions a role cannot perform.

## Project structure

```text
vitamind_backoffice/
├── src/
│   ├── app/            Routes, layouts and the API proxies (api/admin, api/auth)
│   │   └── admin/      assignments, clinical-alerts, clinics, coverage, crisis-events,
│   │                   dashboard, diagnostics, exports, false-positives, licenses,
│   │                   model-drift, notifications, psychologists, risk-history, system, users
│   ├── actions/        Supporting actions and integration logic
│   ├── components/     Shared UI and feature components
│   ├── contexts/       Application state providers
│   ├── hooks/          Query, mutation and state hooks
│   ├── lib/            API clients, auth, permissions, constants, formatters
│   └── types/          Shared TypeScript interfaces
├── public/             Static assets
├── next.config.ts
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

Run `npm run lint` and `npm run build` before opening a pull request.

## Security

This application handles sensitive operational and patient-related data.

- Enforce role-based access strictly; never rely on hiding a button as the only control.
- Never expose secrets or credentials in client code, logs or screenshots.
- Treat every API response as untrusted input.
- Use sanitised, de-identified data in development.
- Report security issues privately to the maintainers.

## Contributing

1. Work in a focused branch.
2. Keep UI and API-integration changes small and readable.
3. Verify the affected routes and flows (including loading, empty and error states).
4. Do not commit environment files, generated output or credentials.

## License

Proprietary. No public license is declared; do not reproduce or distribute the code without the owners' permission.
