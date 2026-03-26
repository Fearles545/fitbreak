---
name: loading_ux
description: CEO loading UX preferences — no skeletons, no overlays, stale-while-revalidate preferred
type: feedback
---

CEO is very sensitive to loading state transitions. Tested 4 approaches in one session:

- Skeleton overlay: "total miss"
- Inline skeleton: didn't like the visual quality
- Dimmed overlay + spinner: "clunky", "shaky experience" on re-navigation
- Stale-while-revalidate + simple spinner on first load: "looks very good"

**Why:** Any approach that shows intermediate/empty content (even briefly) or causes layout shifts during navigation feels broken to this CEO.

**How to apply:** For loading states, default to: show nothing (spinner) on first load, show stale data on re-visits. Never overlay content. Never show skeleton unless visual quality is significantly improved. The SkeletonComponent exists in shared/ but is unused — only bring it back if CEO approves the visual.
