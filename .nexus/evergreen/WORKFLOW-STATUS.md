# Workflow Status — FitBreak

**Last updated:** 2026-03-29
**Last session:** Break notification feature — Phase 1 + Phase 2 complete

## Current State

🟡 **Sprint 5 in progress. Phase 1 + Phase 2 done. Needs deploy + Android testing.**

## Sprint 5 (in progress)

| # | Task | Level | Status |
|---|------|-------|--------|
| 1 | SW quick wins — cache recovery + API data groups | 0 | done |
| 2 | Phase 1 — sound variants, vibration, repeat, settings UI | 2 | done |
| 3 | Phase 2 — Web Push backend (pg_cron + Edge Function + SwPush) | 3 | done |
| 4 | Deploy + end-to-end testing on Android | 1 | pending |

## Active Work

Feature spec: `.nexus/active/feature-break-notifications.md` (Status: Approved, implementation done)

## Blockers

_None._

## Next Steps

1. Deploy to GitHub Pages (`ng deploy`)
2. Test push flow end-to-end on Android PWA:
   - Enable notification toggle in settings → permission prompt → subscription saved
   - Start workday → verify pg_cron job scheduled
   - Wait for break time → push notification on lock screen
   - Tap "Почати перерву" → app opens on /break
3. Test on desktop — sound variants + vibration hidden, tab title still works
4. Update deploy checklist with VAPID key backup info
5. Move feature spec to archive, start Sprint 5 task 4

## Recent Decisions

- DECISION-017: Trigger-scheduled push over polling — pg_cron job at exact break time
- DECISION-018: Angular ngsw handles push natively — no custom service worker needed

## Session Notes

Three research documents created: Angular SW push capabilities, Supabase Web Push architecture, full Angular SW capabilities reference. Key discovery: ngsw-worker.js already handles push/notificationclick/notificationclose events with configurable click operations via payload. Trigger-based scheduling avoids wasteful polling. Self-review caught 3 issues: settings toggle unsubscribed (fixed to save preference only), get_vapid_keys RPC exposed private key to authenticated users (fixed with REVOKE), unschedule_break_push RPC callable by users (fixed with REVOKE).
