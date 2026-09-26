# VitaMind Backoffice — Developer & Claude Guidelines

## 1. Safety & Git Restrictions (CRITICAL)
- **STRICT PROHIBITION:** Do NOT execute any Git commands (`git commit`, `git push`, `git checkout`, `git add`, etc.).
- Do NOT interact with remote GitHub repos or modify repository history.
- All code changes must be saved locally on disk only. The user manages git versioning manually.

## 2. Tech Stack & Architecture Overview
- **Framework:** Next.js (App Router, Server & Client Components)
- **Styling:** Tailwind CSS, PostCSS
- **UI & Icons:** shadcn/ui components (`src/components/ui`), Lucide Icons
- **State & Logic:** Custom React Hooks (`src/hooks`), Context API (`LanguageContext`)
- **API & Actions:** Server actions & API client handlers (`src/actions`)
- **Types:** Strict TypeScript types placed in `src/lib/types/` and `src/types/`

## 3. UI/UX Design System Guidelines ("WOW" Aesthetic)
- **Style Direction:** Modern, dark-mode first, sleek SaaS backoffice (Linear / Vercel / Raycast visual density).
- **Colors & Surface:** Clean backdrop blur (`backdrop-blur-md`), subtle borders (`border-border/40`), micro-gradients, dark elevated surfaces (`bg-card/50`).
- **Typography & Layouts:** Spacing-consistent layouts (`gap-4`, `gap-6`), high contrast headings, subtle muted secondary text (`text-muted-foreground`).
- **Interactions:** Fluid hover transitions (`transition-all duration-200`), state indicators with glowing badges/indicators for medical/risk statuses.
- **Component Reusability:** Leverage existing shadcn primitives in `src/components/ui` and admin layout components (`Sidebar`, `Navbar`, `DataTable`, `StatCard`).

## 4. Code Generation Rules & Token Optimization
- **Output Conciseness:** Provide ONLY clean, fully functional code without conversational fluff or lengthy explanations.
- **Imports:** Use the `@/...` alias (e.g., `@/components/ui/button`, `@/hooks/use-users`, `@/lib/types`).
- **Modular Edits:** Focus exclusively on the requested component or file. Do not regenerate untouched files.
- **Strict Typing:** Always import and utilize domain types from `@/lib/types/models`. Do not use `any`.
- **Localization:** Ensure UI strings accommodate multi-language support handled via `LanguageContext`.