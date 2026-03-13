# Exploration Log

## Explored Areas

- **Claude Code DX infrastructure** — MCP servers, agent skills, CLAUDE.md structure
- **Angular Material M3** — theming system, dark mode approaches, setup, font integration
- **Supabase MCP** — tools, security, configuration
- **Project file organization** — docs location, environment files
- **Angular 21 platform changes** — animations, HttpClient defaults
- **Typography** — font selection for Cyrillic UI + timer displays
- **Project setup completeness** — gitignore, CSS baseline, routing shell, Material imports

## Findings

- CLAUDE.md mixes generic Angular 21 conventions with project-specific decisions — these should be separated
- `.claude/CLAUDE.md` was fully redundant with root CLAUDE.md — already merged and deleted
- Doc files (`fitbreak-project-brief.md`, `fitbreak-data-model.ts`, `fitbreak-supabase-schema.sql`) are in project root but CLAUDE.md references `docs/` — need to move files and fix paths
- No `src/environments/` configured yet — blocks any Supabase service work
- No ESLint configured — only Prettier (global). Angular ESLint needed for IDE diagnostics and Claude self-correction
- Angular Material not installed yet — listed in tech stack but missing from `package.json`
- `@supabase/supabase-js` not installed — listed in tech stack but missing from `package.json`
- **Angular 21 no longer needs `@angular/animations`** — deprecated in v20.2, removed from Material v21 peer deps. Material uses CSS animations internally. For custom animations use `animate.enter`/`animate.leave` from `@angular/core`
- **Angular 21 provides HttpClient by default** — no `provideHttpClient()` needed in app.config unless using interceptors. `httpResource()` works out of the box
- **M3 typography applies globally** — setting `typography: Inter` in `mat.theme()` generates `--mat-sys-*` tokens consumed by all Material components. No per-component font overrides needed
- M3 also supports `plain-family` / `brand-family` split for finer typography control

## Decisions

1. **Use Angular CLI MCP server** (`@angular/cli mcp`) — official, built into CLI, provides `search_documentation`, `get_best_practices`, `find_examples`, and experimental `build`/`test`/`devserver` tools. Configure via `.mcp.json` in project root.

2. **Use `analogjs/angular-skills`** for generic Angular conventions — offload all Angular 21 best practices (standalone, OnPush, inject(), signals API, template rules, NgOptimizedImage, etc.) to community-maintained skills with progressive loading. This keeps CLAUDE.md clean and project-specific only.

3. **CLAUDE.md restructure** — remove "Angular 21 Specifics" section and generic TypeScript rules. Keep only: Supabase patterns, state management choices (signals-only, no NgRx), Ukrainian UI convention, feature folder structure, DB schema rules, UX principles, audio specs, file naming.

4. **Use Supabase MCP server** — HTTP-based with OAuth, scoped to project ref, `read_only=true` initially. Key value: `generate_typescript_types` keeps `shared/models/` in sync with DB, `execute_sql` for debugging, `search_docs` for Supabase patterns.

5. **Angular Material M3 with manual dark theme toggle** — use `mat.theme()` without `theme-type` (generates `light-dark()` tokens), toggle `color-scheme: dark` on body via a service. Enables programmatic control for stepper's dark fullscreen mode.

6. **Move docs to `docs/`** — move `fitbreak-project-brief.md`, `fitbreak-data-model.ts`, `fitbreak-supabase-schema.sql` from project root to `docs/`, update CLAUDE.md paths.

7. **Add Angular ESLint** — for IDE diagnostics and AI self-correction. Prettier already configured globally.

8. **Configure environment files** — create `src/environments/environment.ts` and `environment.development.ts` with `supabaseUrl` and `supabaseKey`.

9. **Font pairing: Inter (UI) + Exo 2 (timers)** — Inter for all Ukrainian UI text, navigation, settings (tabular numerals, excellent Cyrillic, tall x-height). Exo 2 for stepper countdown and break timer displays (sharp athletic numerals, legible from 1-2m). Both have full cyrillic + cyrillic-ext support on Google Fonts. M3 integration: set `typography: Inter` in `mat.theme()` for global Material font; apply Exo 2 via CSS on timer components.

10. **Do NOT install `@angular/animations`** — deprecated in v20.2, Material v21 doesn't need it. Use `animate.enter`/`animate.leave` from `@angular/core` for custom animations.

11. **No explicit `provideHttpClient()` needed** — Angular 21 provides it by default. Only add if interceptors are needed later.

12. **Install `@supabase/supabase-js`** — required dependency missing from package.json.

13. **Add TypeScript path aliases** — `@shared/*` alias in tsconfig for clean imports from `shared/`.

14. **Update `.gitignore`** — add `src/environments/environment.development.ts` to prevent committing real Supabase keys. Production env (`environment.ts`) has placeholder values and stays tracked.

15. **Modern CSS reset + base styles in `styles.css`** — project uses plain CSS (not SCSS). Add a modern reset (box-sizing, margin, etc.) + base font setup (Inter, tabular-nums for numbers).

16. **App shell routing** — set up initial `app.routes.ts` with auth guard + redirect logic (unauthenticated → login, authenticated → dashboard) and lazy-loaded feature route stubs. First thing needed before any feature work.

## Rejected

1. **Claude Code hooks for auto-formatting** — Prettier is already configured globally, no need for hook-based formatting.
2. **`@angular/animations` package** — deprecated, Material v21 uses CSS animations. Use `animate.enter`/`animate.leave` instead.
3. **Explicit `provideHttpClient()`** — Angular 21 provides HttpClient by default.
4. **PWA setup now** — defer until there's something to cache. Not a blocker for feature development.
5. **CI/CD** — personal project, not needed yet.
6. **Material component import strategy** — not needed with standalone components. Just import what you need directly in each component's `imports` array.

## Potential Tasks

1. **Configure `.mcp.json`** — add Angular CLI MCP + Supabase MCP (with project ref and `read_only=true`)
2. **Install `analogjs/angular-skills`** — `npx skills add analogjs/angular-skills`, verify `.claude/skills/` created
3. **Slim down CLAUDE.md** — remove generic Angular/TS rules now covered by skills, keep project-specific only
4. **Install Angular Material** — `ng add @angular/material`, configure M3 theme with Inter font, manual dark mode toggle in `styles.scss`
5. **Add Angular ESLint** — `ng add @angular-eslint/schematics`, configure rules
6. **Configure environments** — create `src/environments/environment.ts` and `environment.development.ts`
7. **Move docs** — move `fitbreak-*` files to `docs/`, update CLAUDE.md references
8. **Install `@supabase/supabase-js`** — `npm install @supabase/supabase-js`
9. **Add Google Fonts** — Inter (400,500,600,700) + Exo 2 (600,700,800) with cyrillic subset to `index.html`
10. **Add TypeScript path aliases** — configure `@shared/*` in `tsconfig.json`
11. **Update `.gitignore`** — add `src/environments/environment.development.ts`
12. **Modern CSS reset + base styles** — add reset + Inter font baseline to `styles.css`
13. **App shell routing** — auth guard + redirect logic + lazy-loaded feature route stubs in `app.routes.ts`
