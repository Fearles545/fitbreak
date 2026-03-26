---
name: loading_patterns
description: Loading UX patterns — stale-while-revalidate preferred, skeleton approaches rejected after 4 iterations
type: project
---

Dashboard loading went through 4 iterations in one session:
1. Skeleton overlay (dimmed + shapes on top of content) — CEO said "total miss"
2. Inline skeleton elements (matching layout) — CEO didn't like the visual
3. Dimmed overlay with spinner — caused shaky transition on re-navigation (content renders underneath, then changes)
4. Stale-while-revalidate — approved

**Pattern:** Use `_loaded` signal (not `_loading`). `loading = computed(() => !_loaded())`. Set `_loaded = true` only on first successful load. Re-visits show cached data instantly, refresh silently.

**Why:** CEO is sensitive to loading flicker and transition jank. Any approach that shows intermediate states (empty content under overlay, skeleton→content swap) was rejected.

**How to apply:** For any new page/feature that loads data: show spinner only on truly empty first load. After data exists, always show stale data while refreshing. Never overlay or replace visible content with a loading indicator.
