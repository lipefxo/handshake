# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite development server
npm run build     # TypeScript compile + Vite production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

There are no test scripts configured in this project.

## Architecture Overview

**Handshake** is a slide-deck-style partnership proposal generator. Users create animated proposals in an admin editor, share them via unique public URLs, and viewers consume them in a cinematic presentation mode.

### Tech Stack

- **React 19 + TypeScript + Vite** — frontend framework and build tool
- **Tailwind CSS v4 + Framer Motion** — styling and animations
- **Zustand** — global state management (two stores: `authStore`, `proposalStore`)
- **React Router v7** — client-side routing
- **Supabase** — PostgreSQL database, storage (images), and magic-link auth
- **shadcn UI** (New York style) + Radix UI — UI component primitives
- **dnd-kit** — drag-and-drop for slide reordering

### Route Structure

| Path | Auth | Description |
|------|------|-------------|
| `/` | No | Landing/marketing page |
| `/login` | No | Magic link login |
| `/auth/callback` | No | Supabase OAuth redirect |
| `/admin` | Yes | Proposal list dashboard |
| `/admin/proposals/new` | Yes | Create proposal |
| `/admin/proposals/:id` | Yes | Edit proposal |
| `/admin/settings` | Yes | Workspace settings |
| `/p/:slug` | No | Public proposal viewer |

### Key Directories

- `src/admin/` — Admin dashboard, proposal editor, slide configurator, image upload
- `src/presentation/` — Public proposal viewer with keyboard/touch/scroll navigation
- `src/auth/` — Magic link auth, session management, idle timeout, `ProtectedRoute`
- `src/store/` — Zustand stores (`authStore.ts`, `proposalStore.ts`)
- `src/ingestor/` — Markdown-to-slides pipeline (parser, section detector, type inferrer)
- `src/themes/` — Theme definitions, CSS variable mappings, `ThemeProvider`, `useTheme`
- `src/types/` — Shared TypeScript types
- `src/shared/` — Reusable components and utilities
- `src/components/ui/` — shadcn UI components (do not hand-edit; regenerate via CLI)
- `supabase/` — `schema.sql` with RLS policies and storage bucket config

### Slide System

There are 10 slide types defined as a discriminated union: `title`, `intro`, `stats`, `features`, `testimonial`, `comparison`, `timeline`, `media`, `benefits`, `closing`. Each slide is a `SlideConfig` with `id`, `type`, `enabled`, `content`, `transition`, `backgroundOverride`, `customLabel`, `groupId`. The `SlideRenderer` component routes `type` → animated component in the presentation layer.

### Data Flow

1. **Auth**: Supabase magic link → `AuthProvider` (session polling + idle timeout) → `useAuthStore`
2. **Admin editing**: Editor UI → `proposalStore` → Supabase database. The store handles data sanitization (XSS, URL validation) before persistence.
3. **Preview**: Admin editor embeds a preview via `<iframe>` communicating through `postMessage`.
4. **Public viewer**: `/p/:slug` loads a published proposal by slug; no auth required.

### Markdown Ingestion

`src/ingestor/` converts pasted Markdown into structured slides:
Markdown → section detection (H2 boundaries) → slide type inference → content extraction → validation → `SlideConfig[]`

### Theme System

Themes use CSS custom properties for runtime theming. `themeDefinitions.ts` holds the registry. The presentation viewer wraps content in `ThemeProvider`. Admin uses a fixed light theme; the presentation layer defaults to dark.

### Path Aliases

`@/*` resolves to `./src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`).

### Deployment

Deployed on Vercel. `vercel.json` configures SPA rewrites and security headers (CSP, HSTS, XSS protection). Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
