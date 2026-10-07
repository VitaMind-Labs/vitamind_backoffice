# SynQ Backoffice — Developer & Claude Guidelines

## 1. Safety & Git Restrictions (CRITICAL)
- **STRICT PROHIBITION:** Do NOT execute any Git commands (`git commit`, `git push`, `git checkout`, `git add`, etc.).
- Do NOT interact with remote GitHub repos or modify repository history.
- All code changes must be saved locally on disk only. The user manages git versioning manually.

## 2. Tech Stack & Architecture Overview
- **Framework:** Next.js (App Router, Server & Client Components)
- **Styling:** Tailwind CSS, PostCSS
- **UI & Icons:** shadcn/ui components (`src/components/ui`), Lucide Icons
- **State & Logic:** Custom hooks in `src/hooks/admin` (`useApiQuery`, `useApiMutation`, `useListState`)
- **API:** typed clients in `src/lib/api/*` calling the same-origin proxy `/api/admin/*` (see README.md)
- **Types:** `src/types/admin/*`
- **Structure rule:** one feature per page; link to the owning page instead of duplicating it (see README.md)

## 3. UI/UX Design System Guidelines ("WOW" Aesthetic)
- **Style Direction:** Modern, dark-mode first, sleek SaaS backoffice (Linear / Vercel / Raycast visual density).
- **Colors & Surface:** Clean backdrop blur (`backdrop-blur-md`), subtle borders (`border-border/40`), micro-gradients, dark elevated surfaces (`bg-card/50`).
- **Typography & Layouts:** Spacing-consistent layouts (`gap-4`, `gap-6`), high contrast headings, subtle muted secondary text (`text-muted-foreground`).
- **Interactions:** Fluid hover transitions (`transition-all duration-200`), state indicators with glowing badges/indicators for medical/risk statuses.
- **Component Reusability:** Leverage existing shadcn primitives in `src/components/ui` and shared admin components in `src/components/admin/shared` (`DataTable`, `StatCard`, filters, dialogs) and `layout/` (sidebar, topbar).

## 4. Code Generation Rules & Token Optimization
- **Output Conciseness:** Provide ONLY clean, fully functional code without conversational fluff or lengthy explanations.
- **Imports:** Use the `@/...` alias (e.g., `@/components/ui/button`, `@/hooks/admin/use-api-query`, `@/types/admin`).
- **Modular Edits:** Focus exclusively on the requested component or file. Do not regenerate untouched files.
- **Strict Typing:** Always import and utilize domain types from `@/types/admin`. Do not use `any`.
- **Localization:** UI strings are English; there is no active language switcher.