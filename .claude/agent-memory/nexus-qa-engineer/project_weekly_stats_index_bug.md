---
name: Weekly stats index assumption bug
description: ProgressService assumes _breakStats[0] is the current week, but the SQL RPC only returns rows for weeks with data — on days with no sessions yet, [0] is actually last week
type: project
---

ProgressService.thisWeekBreaks uses `this._breakStats()[0]` assuming it is the current ISO week. The SQL function `weekly_break_stats` only returns rows for weeks that have session data, ordered DESC. On Monday morning (or any day before the first session), there is no row for the current week, so [0] is actually last week's data.

**Why:** The SQL `GROUP BY date_trunc('week', date)` only produces rows when sessions exist. The service doesn't match rows to actual calendar weeks.

**How to apply:** When reviewing any code that consumes RPC results ordered by date, verify that index-based access accounts for missing rows. The fix is to match by `week_start` date rather than array index.
