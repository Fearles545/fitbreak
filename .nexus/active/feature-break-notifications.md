# Feature: Break Notification Improvements

**Level:** 3
**Date:** 2026-03-29
**Status:** Approved

## Context

Break notifications currently play a single synthesized beep (Web Audio API) and change the tab title. This works on desktop but fails on Android PWA when the screen is locked or app is backgrounded — Chrome suspends JS execution within 30-60 seconds, so `setTimeout`, `navigator.vibrate()`, and `new Notification()` never fire.

The primary goal is **reliable break reminders on mobile (Android PWA)**. Desktop already works. Two users now have different preferences — per-user settings are essential.

### Research Documents

- `docs/research-angular-sw-push.md` — Angular ngsw push handling, SwPush API, payload format
- `docs/research-supabase-web-push.md` — Full server-side architecture, trigger scheduling, cost analysis
- `docs/research-angular-sw-capabilities.md` — Complete ngsw capabilities reference

## User Stories

### US-1: Mobile background break reminder
As a user with the PWA installed on Android, I want to receive a break reminder even when my screen is locked, so that I don't miss breaks while working.

- AC: Push notification appears on Android lock screen with title "Час на перерву!" and rotation info
- AC: Tapping the notification focuses the PWA (or opens it if closed)
- AC: Works when app is backgrounded for 5+ minutes
- AC: Works when screen is locked

### US-2: Vibration options
As a user, I want to choose a vibration pattern or turn vibration off, so the reminder matches my preference.

- AC: Four options: Коротка / Довга / Подвійна / Вимк.
- AC: Tapping a pattern vibrates the phone as preview
- AC: Setting only visible on devices that support vibration
- AC: Choice persisted in DB per user

### US-3: Sound variants
As a user, I want to pick a notification sound, so break reminders feel pleasant.

- AC: Three options: Стандартний / М'який / Енергійний
- AC: Tapping a sound plays preview
- AC: Choice persisted via existing `break_notification_sound` column

### US-4: Configurable repeat
As a user, I want to control how persistent the reminder is, so it matches my work style.

- AC: Repeat count options: 1 / 3 / 5 / Вимкнено (0)
- AC: Interval options: 30с / 1хв / 2хв (visible only when count > 1)
- AC: Repeats stop when user starts break, skips, or extends work
- AC: System push notification fires once (not repeated). Sound + vibration repeat in-app only.

### US-5: Context-aware notification channels
As a user, I want the app to automatically use the right notification channels for my device.

- AC: Desktop browser: sound + tab title (as today)
- AC: Mobile PWA: sound + vibration + system push notification
- AC: Settings UI hides irrelevant options (no vibration toggle on desktop)
- AC: Smart defaults based on device context

## UX Flow

### Settings UI — "Сповіщення" section

Below existing settings sections. Only shows options relevant to the device.

| Control | Type | Options | Visibility |
|---|---|---|---|
| Звук перерви | Chip selector | Стандартний / М'який / Енергійний | Always |
| Повторення | Chip selector | 1 раз / 3 рази / 5 разів / Вимкнено | Always |
| Інтервал повторення | Chip selector | 30 сек / 1 хв / 2 хв | Only when repeat count > 1 |
| Вібрація | Chip selector | Коротка / Довга / Подвійна / Вимк. | Only if `navigator.vibrate` exists |
| Сповіщення | Toggle | On/Off | Only if Notification API available |

- Tapping a sound chip plays that sound as preview
- Tapping a vibration chip vibrates the phone as preview
- Enabling system notifications triggers `Notification.requestPermission()` on first enable
- If permission previously denied: toggle disabled, helper text "Дозвіл заблоковано в налаштуваннях браузера"

### Permission Flow States

1. **Not yet asked** — toggle off, enabling triggers permission prompt
2. **Permission granted** — toggle works normally
3. **Permission denied** — toggle disabled with helper text
4. **API unavailable** — toggle hidden entirely

### Break-Due Moment (by context)

| Channel | Desktop browser | Android PWA (foreground) | Android PWA (background/locked) |
|---|---|---|---|
| Sound (Web Audio) | Plays | Plays | N/A (JS suspended) |
| Tab title change | Changes | N/A (standalone) | N/A |
| In-app vibration | N/A | Vibrates | N/A (JS suspended) |
| System push notification | N/A | Shows banner | Shows on lock screen |
| Push vibration | N/A | Via push payload `vibrate` | Via push payload `vibrate` |

## Technical Design

### Phase 1: Frontend — Sound, Vibration, Settings, Context Detection

#### New: `DeviceContextService` (`shared/services/`)

Signal-based, computed once at init:
- `isPwa` — `matchMedia('(display-mode: standalone)').matches`
- `hasVibration` — `'vibrate' in navigator`
- `hasNotificationApi` — `'Notification' in window`
- `isMobile` — `navigator.maxTouchPoints > 0`
- `notificationPermission` — reactive signal, updated after permission request

Drives conditional UI in settings and channel selection in BreakNotifierService.

#### Modified: `AudioService` (`shared/services/`)

Add two new sound methods + dispatch:
- `playGentleReminder()` — single low tone (~800Hz), longer decay (~1s), softer
- `playEnergeticReminder()` — triple hit (1000/1300/1600Hz), short gaps, more urgent
- `playBreakSound(variant)` — dispatch to the right method

#### Modified: `BreakNotifierService` (`shared/services/`)

Refactor from 30 lines to multi-channel orchestrator:

```
trigger() →
  1. Read settings (sound variant, repeat count, interval, vibration pattern)
  2. Read device context (has vibration? is PWA?)
  3. Fire first round: sound + vibration (each gated by settings + capability)
  4. If repeat count > 1, start interval timer for remaining rounds
  5. Tab title change (only if not standalone PWA mode)

cancel() →
  1. Clear repeat timer
  2. Restore tab title
  3. Reset active state
```

Injects: `SettingsService`, `DeviceContextService`, `AudioService`.

#### Modified: `SettingsService`

Add computed signals for new fields:
- `breakNotificationSound`
- `breakReminderCount`
- `breakReminderIntervalSec`
- `breakVibrationPattern`
- `enableBreakSystemNotification`

#### Modified: `SettingsComponent`

Add "Сповіщення" section with chip selectors and toggle. Preview on tap for sounds and vibration.

#### Modified: `UserSettings` interface

Add new fields matching DB columns.

### Phase 2: Backend — Web Push via Supabase

#### Enable extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### New table: `push_subscriptions`

```sql
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING ((SELECT auth.uid()) = user_id);
```

#### New columns on `user_settings`

```sql
ALTER TABLE public.user_settings
  ADD COLUMN break_reminder_count int DEFAULT 1
    CHECK (break_reminder_count BETWEEN 0 AND 10),
  ADD COLUMN break_reminder_interval_sec int DEFAULT 60
    CHECK (break_reminder_interval_sec BETWEEN 10 AND 300),
  ADD COLUMN break_vibration_pattern text DEFAULT 'double'
    CHECK (break_vibration_pattern IN ('short', 'long', 'double', 'off')),
  ADD COLUMN enable_break_system_notification boolean DEFAULT true;
```

Existing unused columns to wire up: `break_notification_sound`.

#### New column on `work_sessions`

```sql
ALTER TABLE public.work_sessions
  ADD COLUMN push_notified boolean DEFAULT false;
```

#### Database trigger: schedule push at exact break time

```sql
CREATE OR REPLACE FUNCTION schedule_break_push()
RETURNS trigger AS $$
DECLARE
  cron_expr text;
  job_name text;
  edge_url text;
  edge_auth text;
BEGIN
  job_name := 'break-push-' || NEW.user_id;

  -- Always unschedule previous job
  BEGIN
    PERFORM cron.unschedule(job_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Schedule push if session active and break time set
  IF NEW.status = 'active'
     AND NEW.next_break_at IS NOT NULL
     AND NEW.next_break_at > now()
  THEN
    cron_expr := extract(minute from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(hour from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(day from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(month from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' *';

    SELECT decrypted_secret INTO edge_url
      FROM vault.decrypted_secrets WHERE name = 'project_url';
    SELECT decrypted_secret INTO edge_auth
      FROM vault.decrypted_secrets WHERE name = 'anon_key';

    PERFORM cron.schedule(
      job_name,
      cron_expr,
      format(
        $job$
        SELECT net.http_post(
          url := %L || '/functions/v1/break-push',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := jsonb_build_object(
            'user_id', %L,
            'session_id', %L
          )
        );
        $job$,
        edge_url, edge_auth,
        NEW.user_id::text, NEW.id::text
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_schedule_break_push
  AFTER INSERT OR UPDATE OF next_break_at, status
  ON public.work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION schedule_break_push();
```

#### Edge Function: `break-push`

- Receives `{user_id, session_id}` from pg_cron/pg_net
- Verifies session is still active and not already notified
- Looks up push subscriptions for the user
- Sends Web Push via `web-push` npm library with ngsw-compatible payload
- Marks `push_notified = true`
- Cleans up 410 Gone subscriptions (expired/revoked)
- Unschedules the cron job

Payload format (ngsw-compatible):
```json
{
  "notification": {
    "title": "Час на перерву!",
    "body": "Шия + Очі · ~3 хв",
    "icon": "/icons/icon-192x192.png",
    "tag": "break-reminder",
    "renotify": true,
    "requireInteraction": true,
    "vibrate": [200, 100, 200],
    "actions": [
      { "action": "start", "title": "Почати перерву" }
    ],
    "data": {
      "onActionClick": {
        "default": { "operation": "focusLastFocusedOrOpen", "url": "/" },
        "start": { "operation": "navigateLastFocusedOrOpen", "url": "/break" }
      }
    }
  }
}
```

#### Client: Push subscription via SwPush

- `SwPush.requestSubscription({ serverPublicKey: VAPID_PUBLIC_KEY })` — on permission grant
- Store subscription in `push_subscriptions` table
- Subscribe to `SwPush.pushSubscriptionChanges` — re-sync on key rotation
- Subscribe to `SwPush.notificationClicks` — optional in-app handling
- VAPID public key in `environment.ts`

#### VAPID keys

- Generate once: `npx web-push generate-vapid-keys`
- Public key → `environment.ts` (not a secret)
- Private key → Supabase Vault + Edge Function secrets

#### Cleanup cron job

Daily job to unschedule orphaned `break-push-*` jobs (sessions that ended without proper cleanup):

```sql
SELECT cron.schedule(
  'cleanup-break-push-jobs',
  '0 4 * * *',
  $$
  SELECT cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname LIKE 'break-push-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.work_sessions
    WHERE user_id = replace(jobname, 'break-push-', '')::uuid
    AND status = 'active'
  );
  $$
);
```

### Files Affected

| File | Phase | Change |
|---|---|---|
| `shared/services/device-context.service.ts` | 1 | **New** — context detection |
| `shared/services/audio.service.ts` | 1 | Add 2 sound variants + dispatch |
| `shared/services/break-notifier.service.ts` | 1 | Refactor — multi-channel, repeat timer |
| `settings/settings.component.ts` | 1 | Notifications section |
| `settings/settings.service.ts` | 1 | New computed signals |
| `shared/models/fitbreak.models.ts` | 1 | Update UserSettings |
| `shared/models/database.types.ts` | 1+2 | Regenerate |
| `docs/fitbreak-supabase-schema.sql` | 1+2 | Schema updates |
| Migration SQL | 1+2 | New columns, new table, trigger, extensions |
| `supabase/functions/break-push/index.ts` | 2 | **New** — Edge Function |
| `environments/environment.ts` | 2 | VAPID public key |
| `environments/environment.development.ts` | 2 | VAPID public key |
| `shared/services/push.service.ts` | 2 | **New** — SwPush wrapper (subscribe, sync, permission) |

## Edge Cases & Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Push subscription expires/revoked silently | Medium | Handle 410 in Edge Fn, subscribe to `pushSubscriptionChanges`, re-sync on app open |
| R2 | Cron job fires for inactive session | Low | Edge Fn checks `status = 'active' AND push_notified = false`. Daily cleanup job. |
| R3 | Notification permission denied permanently | Medium | Defer prompt to explicit user action. Show helper text if blocked. |
| R4 | Edge Function fails (timeout/crash) | Low | Single-attempt delivery for V1. In-app beep/tab title as fallback. |
| R5 | Multiple devices get same push | Non-issue | Correct behavior. `tag` prevents stacking per device. |
| R6 | Extensions disabled | Low | Graceful degradation to in-app notifications. |
| R7 | VAPID key loss | Medium | Back up key pair. Document in deploy checklist. |
| R8 | Timezone mismatch in cron scheduling | High (if missed) | `AT TIME ZONE 'UTC'` in trigger. pg_cron runs in UTC. |
| R9 | Vibration annoyance | Low | User-controlled pattern + off option. |
| R10 | SW update breaks subscription | Non-issue | Subscriptions tied to scope, not SW file. |

## Acceptance Criteria

### Phase 1 (frontend)
- [ ] Three sound variants audible and distinct
- [ ] Sound preview plays on tap in settings
- [ ] Vibration options shown only on devices with vibration support
- [ ] Vibration preview on tap
- [ ] Repeat timer fires N times at configured interval
- [ ] Repeat stops on break start, skip, or extend
- [ ] Settings persisted to DB per user
- [ ] Desktop experience unchanged (sound + tab title)

### Phase 2 (web push)
- [ ] Push notification appears on Android lock screen
- [ ] Tapping notification focuses/opens the PWA
- [ ] Push fires at the correct time (within 1 minute of `next_break_at`)
- [ ] Extending work reschedules the push
- [ ] Ending workday cancels the push
- [ ] Multiple devices receive notification
- [ ] Stale subscriptions cleaned up on 410
- [ ] No push sent for inactive/completed sessions

## Open Questions

_None — all resolved._

### Resolved

- **Push notification body:** Yes, include rotation name + duration. Edge Function queries `user_settings.template_order` + `workout_templates` to build e.g. "Шия + Очі · ~3 хв". Extra query is worth the UX.
- **Notification actions:** Single action button "Почати перерву" (`navigateLastFocusedOrOpen` → `/break`). No skip button — keep it simple.

## Cost

**$0/month on Supabase free tier.** ~480 Edge Function invocations/month (0.1% of 500K quota). pg_cron, pg_net, Vault included. Web Push delivery via Chrome/FCM is free.
