# Implementation Plans

Exploration covered Claude Code DX infrastructure, Angular Material M3 theming, Supabase integration, Angular 21 platform changes, and project setup completeness. 16 decisions were made, 6 ideas rejected, resulting in 6 implementation plans below.

## Dependency Graph

```
Plan A (Housekeeping) ──┐
Plan B (Claude DX)   ───┤── independent, can run in any order
Plan C (Dependencies) ──┤
Plan E (ESLint)      ───┘

Plan C (Dependencies) ──→ Plan D (Material + Theming) ──→ Plan F (App Shell Routing)
```

---

## Plan A: Project Housekeeping

**Goal**: Docs in the right place, secrets excluded from git, CLAUDE.md paths accurate.
**Scope**: `fitbreak-*` files, `docs/`, `.gitignore`, `CLAUDE.md`
**Estimated size**: S
**Dependencies**: None
**Priority**: 1 — quick wins, fixes confusion for every subsequent session

### Steps:
1. Create `docs/` directory
2. Move `fitbreak-project-brief.md`, `fitbreak-data-model.ts`, `fitbreak-supabase-schema.sql` into `docs/`
3. Update CLAUDE.md `## Documentation` section to reflect correct paths
4. Add `src/environments/environment.development.ts` to `.gitignore`

### Acceptance criteria:
- [ ] `docs/` contains all three files
- [ ] No `fitbreak-*` files in project root
- [ ] CLAUDE.md paths match actual file locations
- [ ] `git status` does not track `environment.development.ts` after it's created

### Risks / Notes:
- None. Pure file moves + gitignore edit.

---

## Plan B: Claude Code DX Setup

**Goal**: MCP servers configured, angular-skills installed, CLAUDE.md slimmed to project-specific only.
**Scope**: `.mcp.json`, `.claude/skills/`, `CLAUDE.md`
**Estimated size**: S
**Dependencies**: None (but Plan A should ideally go first so CLAUDE.md isn't edited twice)
**Priority**: 2 — makes every subsequent session more productive

### Steps:
1. Create `.mcp.json` in project root with Angular CLI MCP server config (with experimental `build`, `test`, `devserver` tools)
2. Add Supabase MCP server to `.mcp.json` (HTTP-based, OAuth, scoped to project ref, `read_only=true`)
3. Run `npx skills add analogjs/angular-skills` to install agent skills into `.claude/skills/`
4. Slim down CLAUDE.md: remove "Angular 21 Specifics" section (now covered by skills), remove generic TypeScript rules. Keep: dev commands, tech stack, project structure, DB schema rules, architecture patterns, Supabase integration, coding conventions (language, styling, file naming), UX principles, audio system, documentation refs
5. Verify skills are loaded by checking `.claude/skills/` directory structure

### Acceptance criteria:
- [ ] `.mcp.json` exists with both `angular-cli` and `supabase` servers
- [ ] `.claude/skills/` contains angular-skills SKILL.md files
- [ ] CLAUDE.md has no generic Angular/TS best practices — only project-specific decisions
- [ ] New Claude Code session can access Angular MCP tools (verify with `search_documentation`)

### Risks / Notes:
- Supabase MCP needs the project ref — user will need to provide it during implementation
- Angular skills use progressive loading, minimal context cost
- Review CLAUDE.md carefully before removing sections — some rules look generic but are actually project-specific choices (e.g., "signals only, no NgRx" is a decision, not a best practice)

---

## Plan C: Core Dependencies & Build Config

**Goal**: Supabase SDK installed, environments configured, path aliases set up — ready for service development.
**Scope**: `package.json`, `src/environments/`, `tsconfig.json`, `tsconfig.app.json`, `angular.json`
**Estimated size**: S
**Dependencies**: Plan A (gitignore must exclude env file before creating it)
**Priority**: 3 — unblocks all Supabase service work

### Steps:
1. `npm install @supabase/supabase-js`
2. Create `src/environments/environment.ts` with placeholder values:
   ```typescript
   export const environment = {
     production: true,
     supabaseUrl: 'YOUR_SUPABASE_URL',
     supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
   };
   ```
3. Create `src/environments/environment.development.ts` with real values (user provides):
   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'https://xxx.supabase.co',
     supabaseKey: 'eyJ...',
   };
   ```
4. Configure `angular.json` `fileReplacements` for production build (replace development env with production env)
5. Add path alias `@shared/*` → `src/app/shared/*` in `tsconfig.json` `compilerOptions.paths`
6. Verify build still works: `npm run build`

### Acceptance criteria:
- [ ] `@supabase/supabase-js` in `package.json` dependencies
- [ ] Both environment files exist with correct structure
- [ ] `import { environment } from '@environments/environment'` resolves (if env alias added) or relative import works
- [ ] `@shared/services/supabase.service` path alias resolves
- [ ] `npm run build` succeeds

### Risks / Notes:
- User needs to provide real Supabase URL + anon key for development env
- Consider adding `@environments/*` path alias too for clean environment imports
- The `fileReplacements` config goes in `angular.json` under `build > configurations > development`

---

## Plan D: Angular Material + Theming + Fonts + CSS Baseline

**Goal**: Angular Material M3 installed with Inter/Exo 2 fonts, manual dark mode toggle, and modern CSS reset — visual foundation ready.
**Scope**: `package.json`, `src/styles.css`, `src/index.html`, `angular.json`
**Estimated size**: M
**Dependencies**: Plan C (build config should be stable first)
**Priority**: 4 — visual foundation for all UI work

### Steps:
1. Run `ng add @angular/material` — select a prebuilt theme, accept defaults
2. Generate custom CSS-only theme (no SCSS needed):
   ```bash
   ng generate @angular/material:theme-color --primary-color=#YOUR_COLOR --is-scss=false --directory=src
   ```
   This creates `src/theme.css` with all `--mat-sys-*` tokens using `light-dark()` for automatic dark mode.
3. Update `angular.json` styles array: `["src/theme.css", "src/styles.css"]` (theme before app styles)
4. Add Google Fonts link to `src/index.html`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Exo+2:wght@600;700;800&subset=cyrillic,cyrillic-ext&display=swap" rel="stylesheet">
   ```
5. Override typography tokens in `styles.css` to use Inter instead of default Roboto:
   ```css
   html {
     --mat-sys-body-large-font: Inter, sans-serif;
     --mat-sys-body-medium-font: Inter, sans-serif;
     /* ... override all typography font tokens */
   }
   ```
6. Add modern CSS reset to `styles.css`:
   - `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
   - `html { color-scheme: light dark; }` — enables auto dark mode via M3 `light-dark()` tokens
   - `body { font-family: Inter, sans-serif; background: var(--mat-sys-surface); color: var(--mat-sys-on-surface); }`
   - Timer-specific: `.timer-display { font-family: 'Exo 2', sans-serif; font-variant-numeric: tabular-nums; }`
7. Verify: `npm start`, check that Material components render with Inter font and correct theme colors
8. Test dark mode: toggle `color-scheme: dark` on `<html>` via DevTools, verify colors flip

### Acceptance criteria:
- [ ] `@angular/material` and `@angular/cdk` in `package.json`
- [ ] `src/theme.css` exists with `--mat-sys-*` custom properties (plain CSS, no SCSS)
- [ ] Material components render with Inter font
- [ ] Dark mode toggles correctly via `color-scheme` change
- [ ] CSS reset applies (no default margins, border-box sizing)
- [ ] Timer text renders in Exo 2 when `.timer-display` class is used
- [ ] `npm run build` succeeds with no budget warnings

### Risks / Notes:
- `ng add @angular/material` may modify `angular.json` and `styles.css` — review changes before accepting
- M3 uses CSS `light-dark()` — supported in all evergreen browsers
- User needs to pick a primary brand color (hex) for the theme-color schematic
- Density is the only thing that can't be customized via CSS (SCSS-only) — default density (0) is fine
- Typography override requires setting `--mat-sys-*-font` for each type scale level — there are ~15 tokens to override. Consider a CSS custom property shorthand or generating all at once

---

## Plan E: Angular ESLint

**Goal**: ESLint configured with Angular-specific rules for IDE diagnostics and AI self-correction.
**Scope**: `eslint.config.js` (or similar), `package.json`, `angular.json`
**Estimated size**: S
**Dependencies**: None
**Priority**: 5 — improves code quality but doesn't block features

### Steps:
1. Run `ng add @angular-eslint/schematics`
2. Review generated `eslint.config.js` — ensure rules align with project conventions (OnPush, standalone, etc.)
3. Add lint script to `package.json` if not added automatically: `"lint": "ng lint"`
4. Run `npm run lint` to verify no false positives on existing code
5. Fix any issues flagged on existing scaffold code

### Acceptance criteria:
- [ ] `eslint.config.js` exists with Angular-specific rules
- [ ] `npm run lint` runs successfully
- [ ] IDE shows ESLint diagnostics in real-time
- [ ] No false positives on existing code

### Risks / Notes:
- `ng add` may add rules that conflict with Prettier — if so, install `eslint-config-prettier` to disable formatting rules in ESLint
- Angular ESLint may flag the default scaffold code (e.g., missing OnPush) — fix these as part of setup

---

## Plan F: App Shell Routing

**Goal**: Route structure with auth guard, redirect logic, and lazy-loaded feature stubs — ready for feature development.
**Scope**: `src/app/app.routes.ts`, `src/app/auth/`, `src/app/dashboard/`
**Estimated size**: S-M
**Dependencies**: Plan C (auth guard needs Supabase SDK for auth state), Plan D (components may use Material)
**Priority**: 6 — last setup step before feature work begins

### Steps:
1. Create `src/app/auth/auth.guard.ts` — functional guard using `SupabaseService.auth.getClaims()` (fast local JWT verification, recommended over deprecated `getSession()`)
2. Create minimal placeholder components: `src/app/auth/login.component.ts`, `src/app/dashboard/dashboard.component.ts`
3. Configure `app.routes.ts`:
   - `/login` → `LoginComponent` (lazy loaded)
   - `/dashboard` → `DashboardComponent` (lazy loaded, guarded)
   - `/` → redirect to `/dashboard`
   - `**` → redirect to `/dashboard`
4. Add feature route stubs for remaining features (break-timer, strength, stepper, progress, settings) as empty lazy-loaded routes
5. Verify: `npm start`, unauthenticated → redirected to login, route navigation works

### Acceptance criteria:
- [ ] All feature routes defined with lazy loading
- [ ] Auth guard redirects unauthenticated users to `/login`
- [ ] Authenticated users land on `/dashboard`
- [ ] `npm run build` succeeds (no circular deps, lazy loading works)
- [ ] Each feature folder has at least a placeholder component

### Risks / Notes:
- Auth guard depends on `SupabaseService` — needs at least the client initialization working
- Keep placeholder components minimal (just a title) — real UI comes in feature sessions
- This plan bridges setup → feature development
