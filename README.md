# SynQ Admin

SynQ Admin is the operational command center for the SynQ platform. It gives administrators, operations teams, and clinical coordinators a secure workspace to monitor patient risk, manage clinical workflows, review financial activity, and maintain platform health across the product ecosystem.

This project is built with Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui, and it communicates with the SynQ backend through a secure proxy layer designed for administrative operations.

## Why this product exists

The administration platform is designed for high-responsibility operational decisions. It brings together:

- Patient and clinical oversight
- Crisis and alert triage
- Payment visibility
- System health monitoring
- Staff, clinic, and assignment management
- Operational reporting and export workflows

It is built to help teams move quickly while keeping permissions, auditability, and workflow clarity in place.

## Core features

- Role-based admin dashboard and operational overview
- Crisis and clinical alert queue management
- User and patient record monitoring
- Diagnostic funnel and risk visibility
- Payment review tools
- Notification and message routing
- Clinic, psychologist, and assignment management
- Coverage and staffing oversight
- CSV export and reporting workflows
- Secure backend proxy with API routing and access control

## Technology stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui + Radix UI
- Recharts for analytics and trend charts
- Framer Motion for interface motion
- Zod + React Hook Form for validation and forms
- ESLint for quality checks

## Project structure

```text
vitamind_backoffice/
├── src/
│   ├── app/                 # App routes, layouts, and API proxies
│   ├── components/          # Shared UI and feature-level components
│   ├── contexts/            # Shared app state providers
│   ├── hooks/               # Query, mutation, and state hooks
│   ├── lib/                 # API clients, constants, permissions, utilities
│   ├── types/               # Shared TypeScript interfaces
│   └── actions/             # Supporting actions (legacy or integration logic)
├── public/                  # Static assets
├── package.json             # Scripts and dependencies
├── next.config.ts           # Next.js config
├── tsconfig.json            # TypeScript config
├── .env.local.example       # Optional local env example
├── README.md                # Project documentation
├── CLAUDE.md                # Local engineering notes
└── .gitignore               # Git safety settings
```

## Prerequisites

Before running this app, make sure you have:

- Node.js 20+
- npm 10+
- A running SynQ backend API

## Quick start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

- http://localhost:3000

Create a production build:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start
```

## Environment variables

Create a `.env.local` file if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If `NEXT_PUBLIC_API_URL` is not set, the app will expect the local API at the default SynQ backend URL.

## How it integrates with the backend

This admin platform uses a proxy architecture to keep sensitive administrative traffic behind a controlled boundary.

```text
Browser -> /api/admin/... -> Backend API -> Data/Reports/Operational services
```

The app is organized around typed API clients and route-level permission checks. Authentication and sensitive data handling follow the platform's admin access model.

## Main admin areas

- Dashboard: operational summary and prioritization
- Users: patient account overview and health risk context
- Diagnostics: clinical funnel and process metrics
- Crisis events: incident workflow and escalation handling
- Clinical alerts: triage and workflow routing
- Payments: billing data and financial reporting
- Psychologists and clinics: provider portfolio management
- Assignments and coverage: coordination and capacity tracking
- Notifications and exports: communication and operational reporting

## Security and compliance expectations

This workspace is intended for operational and administrative workflows in a professional healthcare environment. The following practices are expected:

- Use role-based access controls strictly
- Never expose secrets or credentials in client code or logs
- Treat all API responses as untrusted data
- Validate assumptions before acting on sensitive patient or financial information
- Keep development data sanitized and de-identified

## Quality checks

Run the relevant validation before shipping changes:

```bash
npm run lint
npm run build
```

## Contribution guidance

1. Work in a focused branch.
2. Keep UI and backend integration changes scoped and readable.
3. Validate the affected routes and flows before merge.
4. Avoid committing environment files, generated output, or local credentials.

## License

This project does not declare a public license in the repo. Treat the code as proprietary unless explicitly stated otherwise by the project owner.
