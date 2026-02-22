# Handshake — Partnership Proposal Studio

A cinematic, slide-deck-style partnership proposal generator for the SecureBags team. Build beautiful animated proposals, share them via unique URLs, and manage everything through a clean admin interface.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Routing | React Router v6 |
| State | Zustand |
| Backend | Supabase (Postgres + Storage + Auth) |
| Fonts | Instrument Serif + DM Sans |
| Deployment | Vercel |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL editor
3. Enable Email (magic link) auth in Authentication > Providers
4. Set the redirect URL to `https://www.handshake.design/auth/callback`
5. (Optional) Restrict to `@securebags.com` emails in Auth > Settings

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AGENTATION_ALLOWED_EMAIL=lipefxo@gmail.com
```

### 4. Start the dev server

```bash
npm run dev
```

---

## Application Structure

```
src/
├── App.tsx                   # Router setup
├── supabaseClient.ts         # Supabase initialization
├── types/                    # TypeScript interfaces
├── store/                    # Zustand stores (auth + proposals)
├── data/                     # Slide defaults & metadata
├── auth/                     # Auth layer (magic link login)
├── admin/                    # Admin UI (light theme)
│   ├── AdminLayout.tsx       # Shell with sidebar
│   ├── pages/
│   │   ├── ProposalList.tsx  # Dashboard
│   │   ├── ProposalEditor.tsx# Main editor
│   │   └── ProposalSettings.tsx
│   └── components/
│       ├── SlideSortableList.tsx  # DnD reorder
│       ├── SlideConfigurator.tsx  # Per-slide forms
│       └── ImageUploader.tsx      # Supabase Storage upload
├── presentation/             # Public proposal viewer (dark theme)
│   ├── ProposalViewer.tsx    # Main viewer
│   ├── hooks/
│   │   └── useSlideNavigation.ts  # Keyboard/scroll/touch nav
│   └── components/
│       ├── SlideRenderer.tsx      # Routes type → component
│       ├── SlideNavigation.tsx    # Dot indicators
│       └── slides/                # 10 slide types
└── shared/                   # Shared components & utilities
    ├── components/
    │   ├── AnimatedCounter.tsx
    │   ├── GradientOrb.tsx
    │   └── ProgressBar.tsx
    └── utils/
        ├── animations.ts     # Framer Motion variants
        └── helpers.ts        # Slug generation, formatters
```

---

## Slide Types

| Type | Description |
|------|-------------|
| `title` | Hero opening with partner logo & tagline |
| `intro` | Who we are / partnership overview |
| `stats` | Animated counters + key metrics |
| `features` | Product/service highlights with icons |
| `testimonial` | Quote + attribution |
| `comparison` | Before/after or side-by-side |
| `timeline` | Partnership roadmap & milestones |
| `media` | Full-bleed image, GIF, or video |
| `benefits` | What the partner gets |
| `closing` | CTA, contact info, next steps |

---

## Routes

| Path | Description | Auth |
|------|-------------|------|
| `/login` | Magic link login page | No |
| `/auth/callback` | Supabase auth redirect handler | No |
| `/admin` | Proposal list dashboard | Required |
| `/admin/proposals/:id` | Proposal editor | Required |
| `/admin/settings` | Workspace settings | Required |
| `/p/:slug` | Public proposal viewer | No (published only) |

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Set custom domain: `www.handshake.design`
5. Update Supabase auth redirect URLs to match the domain

---

## Supabase Schema

See `supabase/schema.sql` for the full database schema, RLS policies, and storage bucket configuration.
