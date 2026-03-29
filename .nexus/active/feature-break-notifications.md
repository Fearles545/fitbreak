# Feature: Break Notification Improvements

**Level:** 2
**Date:** 2026-03-29
**Status:** Draft

## Context

Break notifications currently play a single synthesized beep (Web Audio API) and change the tab title. This works when the tab is active on desktop, but on an installed PWA on Android with the screen locked, the beep may not play reliably. Users also can't customize notification behavior.

The app already has unused DB fields (`break_notification_sound`, `enable_break_tab_flash`) that were planned but never implemented. Two users now have different preferences — per-user settings are essential.

## What Needs to Happen

### 1. Sound variants (use existing `break_notification_sound` field)

The `AudioService` currently synthesizes a double xylophone hit for break reminders. Add two more variants:

- **`'default'`** — current double xylophone hit (1200Hz + 1500Hz, bell-like)
- **`'gentle'`** — softer single tone, lower frequency, longer decay
- **`'energetic'`** — triple hit, higher frequency, more urgent feel

All synthesized with Web Audio API (no audio files needed). `BreakNotifierService` reads the setting and calls the appropriate sound method.

### 2. Reminder frequency and interval (new DB fields)

Currently the notifier fires once. Add configurable repeat:

- **`break_reminder_count`** (int, default 1) — how many times to play the reminder sound. Options: 1, 3, 5, or 0 (sound disabled entirely)
- **`break_reminder_interval_sec`** (int, default 60) — seconds between repeated reminders. Options: 30, 60, 120

Example: count=3, interval=60 → beep at 0s, 60s, 120s after break is due.

`BreakNotifierService` manages a repeat timer that fires N times with the configured interval. Cancels when user starts break, skips, or extends work.

### 3. Vibration (new DB field + implementation)

- **`enable_break_vibration`** (boolean, default true) — vibrate on break reminder

Uses `navigator.vibrate([200, 100, 200])` (Vibration API). Works on Android when PWA is installed, even with screen locked. No-op on desktop or unsupported devices. Fires alongside each sound reminder (respects repeat count/interval).

### 4. System notification / lock screen banner (new DB field + implementation)

- **`enable_break_system_notification`** (boolean, default true) — show system notification

Uses Web Notifications API (`new Notification(...)` or `ServiceWorkerRegistration.showNotification()`). Shows a banner on the Android lock screen with:
- Title: "⏰ Час на перерву!"
- Body: rotation name + duration (e.g. "Шия + Очі · ~3 хв")
- Icon: app icon
- `requireInteraction: true` — stays until dismissed
- `tag: 'break-reminder'` — replaces previous notification (no stacking)

Requires one-time permission request. Best place to ask: first time user enables the setting, or on first break after enabling.

Fires once per break-due event (not repeated — the sound/vibration handles repetition). Clicking the notification focuses the PWA.

### 5. Tab title flash (use existing `enable_break_tab_flash` field)

Already have the field but it's not respected. Currently tab title always changes. Wire it up:
- `true` (default) — change title to "⏰ Час на перерву! — FitBreak"
- `false` — keep title as "FitBreak"

### 6. Settings UI

Add a "Сповіщення" (Notifications) section to the settings page with:

- **Звук перерви** — chip selector: Стандартний / М'який / Енергійний (with preview on tap)
- **Повторення** — chip selector: 1 раз / 3 рази / 5 разів / Вимкнено
- **Інтервал повторення** — chip selector: 30 сек / 1 хв / 2 хв (visible only if count > 1)
- **Вібрація** — toggle
- **Сповіщення на екрані блокування** — toggle (triggers permission request on enable)
- **Зміна заголовку вкладки** — toggle

## DB Changes

### New columns on `user_settings`:
```sql
ALTER TABLE public.user_settings
  ADD COLUMN break_reminder_count int DEFAULT 1
    CHECK (break_reminder_count BETWEEN 0 AND 10),
  ADD COLUMN break_reminder_interval_sec int DEFAULT 60
    CHECK (break_reminder_interval_sec BETWEEN 10 AND 300),
  ADD COLUMN enable_break_vibration boolean DEFAULT true,
  ADD COLUMN enable_break_system_notification boolean DEFAULT true;
```

### Existing columns (already in DB, unused):
- `break_notification_sound` — `'gentle' | 'energetic' | 'default'`
- `enable_break_tab_flash` — boolean

## Files Affected

- `src/app/shared/services/break-notifier.service.ts` — main logic: repeat timer, vibration, system notification, respect all settings
- `src/app/shared/services/audio.service.ts` — add `playGentleReminder()`, `playEnergeticReminder()` methods
- `src/app/settings/settings.component.ts` — notifications section UI
- `src/app/settings/settings.service.ts` — expose new computed signals
- `src/app/shared/models/fitbreak.models.ts` — update UserSettings interface
- `src/app/shared/models/database.types.ts` — regenerate
- `docs/fitbreak-supabase-schema.sql` — update schema doc

## Platform Behavior Matrix

| Method | Desktop (active tab) | Desktop (background tab) | Android PWA (screen on) | Android PWA (screen locked) |
|---|---|---|---|---|
| Sound (Web Audio) | Works | Suspended | Works | Unreliable after long idle |
| Vibration | No hardware | No hardware | Works | Works |
| System notification | Shows banner | Shows banner | Shows banner | Shows on lock screen |
| Tab title | Works | Works (visible on switch) | N/A (standalone) | N/A |

## Open Questions

- Should "preview sound" in settings play the selected sound immediately on tap? (Useful for choosing between variants)
- Should we request notification permission proactively on first app launch, or only when user enables the setting?
