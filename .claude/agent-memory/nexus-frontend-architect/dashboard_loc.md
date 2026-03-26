---
name: dashboard_loc
description: Dashboard component at ~660 LOC after UX refresh — quick-launch markup duplicated, extraction candidates identified
type: project
---

After the UX refresh, DashboardComponent is ~660 LOC (above the 400 LOC guideline). The class body is lean (signals + thin async), but template (~155 lines) and styles (~320 lines) are large.

**Extraction candidates:**
- Quick-launch card pair (Силове/Степер) — duplicated in active session and start screen branches. Same markup, same aria. Extract to `ng-template` or tiny component.
- Skeleton could be extracted to `DashboardSkeletonComponent` if re-enabled.

**Why not extracted yet:** CEO was focused on getting the feature shipped. The duplication is identical and both copies have aria fixes. Low risk for now.

**How to apply:** Flag if dashboard grows further. Consider extracting during next touch.
