---
name: a11y_checklist
description: Accessibility patterns and WCAG requirements established during dashboard UX review
type: feedback
---

Patterns established during the dashboard UX refresh review (applied to all new code):

1. **Decorative icons:** Every `<mat-icon>` used decoratively MUST have `aria-hidden="true"`. Material Symbols render ligature text that screen readers announce as garbage.
2. **prefers-reduced-motion:** Every CSS animation (shimmer, fadeIn, pulse) MUST have a `@media (prefers-reduced-motion: reduce)` override. Functional animations (spinners) can be slowed, not removed.
3. **Focus visible:** Custom interactive elements (non-Material buttons like quick-launch cards) MUST have `:focus-visible` style with `outline: 2px solid var(--mat-sys-primary)`.
4. **Role on non-interactive containers:** `aria-label` on a `<div>` is ignored by screen readers. Must add `role="status"` (or appropriate role) alongside it.
5. **Loading regions:** Skeleton/spinner containers need `role="status"` + `aria-label="Завантаження..."`.
6. **Nav groups:** Navigation button clusters should use `<nav>` with `aria-label`.

**Why:** Multi-agent review (nexus-review) caught 6 WCAG AA violations. These are now the baseline for all future components.

**How to apply:** Check these 6 points on every new component or template change. Proactively flag missing items during UX reviews.
