- GrantMatch Canada — full clone

Rebuild the app at grant-matcher.base44.app: same name, red/dark branding, Canadian grant content, backed by Lovable Cloud (database + auth + AI).

### Design system

- Dark sidebar (near-black) with red (#DC2626-family) accent, white content canvas, heavy display headings, rounded cards with soft borders. All tokens in `src/styles.css` — no hardcoded colors in components.
- Persistent left sidebar on desktop; on mobile it becomes a slide-out drawer with a bottom-safe-area-aware header.

### Pages (routes)

1. `/` Home — hero ("Find Every Canadian Grant Your Startup Qualifies For"), URL-analyze input + "Analyze My Business" CTA, 3 stat cards (500+ / 13 / $85K), red monthly-deadline banner, 4 KPI cards (Total Potential Funding, Applications Submitted, Approved, Approved Funding), Application Success Rate donut, Funding by Sector bar chart, Deadline Calendar, Potential Funding by Stage chart, 3 feature cards.
2. `/discover` — searchable/filterable grant list with AI match score badges, filters (province, sector, funding type, amount), save-to-pipeline.
3. `/pipeline` — stage board (Saved → In Progress → Submitted → Approved/Rejected) with per-stage funding totals and deadlines.
4. `/profile` (My Business) — business profile form: name, website, province, sector, stage, employees, revenue, incorporation date, description.
5. `/resource-library` — curated funding guides/articles.
6. `/help-center` — FAQ accordion + contact.

Each route gets its own `head()` metadata.

### Backend (Lovable Cloud)

Tables with RLS + grants:

- `grants` — public read (anon+authenticated SELECT): title, agency, level (federal/provincial/municipal), province, sectors[], min/max amount, deadline, description, eligibility, url. Seeded via migration with ~40 real Canadian programs (CDAP, IRAP, SR&ED, CanExport, Futurpreneur, provincial programs, etc.).
- `profiles` — one business profile per user, owner-scoped.
- `pipeline_items` — user_id, grant_id, status, notes, generated_letter, owner-scoped.
- Email/password auth (auto-confirm) with `/auth` page; app pages under an authenticated layout, home viewable signed-out with demo numbers.

Server functions (`createServerFn`, Lovable AI Gateway with `google/gemini-2.5-flash`):

- `analyzeWebsite` — takes a URL, extracts business profile fields, prefills the profile form.
- `scoreGrants` — scores each grant 0–100 against the profile with a plain-language rationale; results cached per user/grant.
- `generateLetter` — writes a tailored application letter for a pipeline item.

### Mobile integration polish

- Viewport meta in `src/routes/__root.tsx` set to `width=device-width, initial-scale=1, viewport-fit=cover`, with `env(safe-area-inset-*)` padding on the sidebar/header/bottom bars.
- Optimistic UX: pipeline status changes and save/unsave toggles update the UI immediately via TanStack Query optimistic mutations, rolling back with a toast on failure. Applies to the funding detail modal and the match/documents panel.
- Mobile selects: below `md`, select inputs in the profile form and the funding detail modal render as a vaul `Drawer` list instead of a dropdown popover; unchanged on desktop.
- Pull-to-refresh: a swipe indicator at the top of the Discover scroll area that re-runs the fetch-and-match sequence, with a spinner and haptic-free snap-back.

### Technical notes

- TanStack Start file routes; loaders use `ensureQueryData` + `useSuspenseQuery`; AI/protected calls happen in components via `useServerFn`, never in public loaders.
- Charts via Recharts; toasts via sonner (`<Toaster />` mounted once in `__root.tsx`).
- Seed data lives in the migration as literal INSERTs so the first screen is populated.

### Sequence

1. Enable Lovable Cloud, run schema + seed migration.
2. Design tokens + app shell (sidebar/drawer, safe areas).
3. Home page with charts.
4. Auth + profile page (+ website analyzer).
5. Discover with AI scoring and pull-to-refresh.
6. Pipeline with optimistic status changes and letter generation.
7. Resources + Help Center, then mobile pass across all pages.

Add a dashboard widget that displays a bar chart of the total funding potential for the current month. Include a breakdown by government and private sector grants to help me prioritize where to focus 

And Add a time-tracking feature to the grant detail modal so I can record how many hours are spent on each application. This will help me analyze which grants are the most time-consuming to prepare.