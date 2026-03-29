# Research: Web Push Notifications with Supabase Infrastructure

**Date:** 2026-03-29
**Context:** FitBreak needs background push notifications on Android PWA. Researching the best approach using Supabase's native infrastructure (no external services).

## TL;DR

Supabase provides everything needed for server-side Web Push: **database trigger** detects when a break is due, **pg_cron** schedules the push for the exact minute, **pg_net** calls the **Edge Function**, and the Edge Function sends the push via the standard Web Push protocol (VAPID). All of this runs on the free tier.

## The Problem

When FitBreak's PWA is backgrounded or the screen is locked on Android, JavaScript execution is suspended by Chrome (typically within 30-60 seconds). This means:

- `setTimeout` / `setInterval` → never fires
- `new Notification()` → code never executes
- `navigator.vibrate()` → code never executes
- Web Audio API → suspended

**The only way to wake a PWA from suspension is an external push event.** The browser's push service (FCM for Chrome) can deliver a message that wakes the service worker, which then shows a notification — even with the screen locked.

## Architecture Overview

```
[Angular App]                    [Supabase]                    [Chrome Push Service]
     |                               |                               |
     | 1. Start work session         |                               |
     |------------------------------>|                               |
     |                               |                               |
     |    2. DB trigger fires        |                               |
     |    schedules pg_cron job      |                               |
     |    for exact break time       |                               |
     |                               |                               |
     |         ... 45 minutes pass ...                               |
     |                               |                               |
     |    3. pg_cron fires           |                               |
     |    → pg_net calls Edge Fn     |                               |
     |                               |                               |
     |    4. Edge Function           |                               |
     |    sends Web Push ------------|------------------------------>|
     |                               |                               |
     |    5. Push service            |                               |
     |    delivers to device <-------|-------------------------------|
     |                               |                               |
     | 6. SW wakes, shows notification                               |
     |<--------------------------------------------------------------|
```

## Supabase Components Used

### 1. pg_cron — Job Scheduler

**What it is:** A Postgres extension that schedules recurring or one-time jobs using cron syntax. Jobs can execute SQL or, combined with pg_net, make HTTP requests.

**Status:** Available on all Supabase plans (including free). Not yet enabled in our project.

**How we use it:** Schedule a one-shot job at the exact `next_break_at` minute for each user. The job calls our Edge Function via pg_net.

**Key features:**
- Minimum granularity: 1 second (Postgres 15.1.1.61+), though we only need minute precision
- `cron.schedule(name, schedule, command)` — upserts by name (same name = replaces previous job)
- `cron.unschedule(name)` — removes a scheduled job
- `cron.alter_job(job_id, ...)` — modifies schedule, command, or active state
- Job run history stored in `cron.job_run_details`

**Cron syntax:**
```
┌───────────── min (0 - 59)
│ ┌────────────── hour (0 - 23)
│ │ ┌─────────────── day of month (1 - 31)
│ │ │ ┌──────────────── month (1 - 12)
│ │ │ │ ┌───────────────── day of week (0 - 6)
│ │ │ │ │
* * * * *
```

For a break at 14:45 on March 29: `45 14 29 3 *`

### 2. pg_net — Async HTTP from Postgres

**What it is:** A Postgres extension for making async HTTP/HTTPS requests directly from SQL. Requests are queued and executed after the transaction commits.

**Status:** Available on all plans. Not yet enabled.

**How we use it:** The pg_cron job calls `net.http_post()` to invoke our Edge Function.

**Key features:**
- `net.http_post(url, body, params, headers, timeout_milliseconds)` — POST with JSON body
- `net.http_get(url, params, headers, timeout_milliseconds)` — GET request
- Requests are async — they don't block the SQL transaction
- Responses stored in `net._http_response` for 6 hours (for debugging)
- Supports up to 200 requests/second

**Limitations:**
- POST only supports JSON body (fine for our use case)
- No PATCH/PUT support
- Responses stored in unlogged tables (not crash-safe, but we don't need them)

### 3. Supabase Vault — Secret Storage

**What it is:** Encrypted secret storage in Postgres. Secrets are encrypted at rest using Supabase's encryption key.

**Status:** Already installed in our project.

**How we use it:** Store the VAPID private key and the project's anon key (for Edge Function auth).

```sql
-- Store secrets
SELECT vault.create_secret('VAPID_PRIVATE_KEY_HERE', 'vapid_private_key');
SELECT vault.create_secret('https://project-ref.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_ANON_KEY', 'anon_key');

-- Read secrets (in SQL functions)
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'vapid_private_key';
```

### 4. Edge Functions — Serverless Deno Runtime

**What it is:** Server-side TypeScript functions running on Deno, deployed globally. Can use npm packages.

**Status:** No functions deployed yet. Zero setup needed — just `supabase functions deploy`.

**How we use it:** Receives the call from pg_cron/pg_net, queries the database for the user's push subscription, sends the Web Push message.

**Key features:**
- Deno runtime with npm compatibility (`npm:web-push` works)
- Access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables by default
- Can make outbound HTTP requests (to Chrome's push service)

## Implementation Details

### Database Changes

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

**Why a separate table?** A user might have multiple devices (phone + tablet). Each device has its own push subscription. Storing in `user_settings` would limit to one subscription.

#### New column on `work_sessions`

```sql
ALTER TABLE public.work_sessions
  ADD COLUMN push_notified boolean DEFAULT false;
```

Prevents duplicate notifications if the cron job fires twice (idempotency guard).

#### Database trigger

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

  -- Always unschedule previous job for this user
  BEGIN
    PERFORM cron.unschedule(job_name);
  EXCEPTION WHEN OTHERS THEN
    -- Job didn't exist, that's fine
    NULL;
  END;

  -- If session is active and next_break_at is set, schedule push
  IF NEW.status = 'active'
     AND NEW.next_break_at IS NOT NULL
     AND NEW.next_break_at > now()
  THEN
    -- Build cron expression for exact minute
    cron_expr := extract(minute from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(hour from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(day from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' ' || extract(month from NEW.next_break_at AT TIME ZONE 'UTC')
      || ' *';

    -- Get Edge Function URL and auth from Vault
    SELECT decrypted_secret INTO edge_url
      FROM vault.decrypted_secrets WHERE name = 'project_url';
    SELECT decrypted_secret INTO edge_auth
      FROM vault.decrypted_secrets WHERE name = 'anon_key';

    -- Schedule the push notification
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

**Key design choices:**
- `SECURITY DEFINER` — trigger function runs with elevated privileges (needed for cron.schedule)
- `AT TIME ZONE 'UTC'` — pg_cron runs in UTC, must match
- Exception handling on `cron.unschedule` — job might not exist (first break of the day)
- Only schedules if `next_break_at > now()` — no scheduling in the past
- Only schedules if `status = 'active'` — no push for completed/paused sessions

### Edge Function: `break-push`

```typescript
// supabase/functions/break-push/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import webPush from 'npm:web-push';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { user_id, session_id } = await req.json();

  // 1. Verify session is still active and break is due
  const { data: session } = await supabase
    .from('work_sessions')
    .select('id, status, next_break_at, push_notified')
    .eq('id', session_id)
    .eq('user_id', user_id)
    .single();

  if (!session || session.status !== 'active' || session.push_notified) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  // 2. Get user's push subscriptions (may have multiple devices)
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id);

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no subscriptions' }));
  }

  // 3. Get next rotation info for notification body
  const { data: settings } = await supabase
    .from('user_settings')
    .select('template_order, enabled_template_ids')
    .eq('user_id', user_id)
    .single();

  // 4. Configure web-push with VAPID keys
  webPush.setVapidDetails(
    'mailto:fitbreak@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  // 5. Build notification payload (ngsw format)
  const payload = JSON.stringify({
    notification: {
      title: 'Час на перерву!',
      body: 'Ви працюєте вже 45 хвилин. Розімніться!',
      icon: '/icons/icon-192x192.png',
      tag: 'break-reminder',
      renotify: true,
      requireInteraction: true,
      data: {
        onActionClick: {
          default: { operation: 'focusLastFocusedOrOpen', url: '/' }
        }
      }
    }
  });

  // 6. Send to all user's devices
  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  // 7. Mark as notified (idempotency)
  await supabase
    .from('work_sessions')
    .update({ push_notified: true })
    .eq('id', session_id);

  // 8. Clean up expired subscriptions (410 Gone = unsubscribed)
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected' && results[i].reason?.statusCode === 410) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptions[i].endpoint);
    }
  }

  // 9. Unschedule the cron job (it's done its job)
  // Note: job might fire again next year at same date/time if not unscheduled
  await supabase.rpc('unschedule_break_push', { p_user_id: user_id });

  return new Response(JSON.stringify({ sent: results.length }), { status: 200 });
});
```

### VAPID Keys

VAPID (Voluntary Application Server Identification) is the standard for Web Push authentication. It's a key pair:

- **Public key** — shared with the browser during `PushManager.subscribe()`. Embedded in the Angular app (not a secret).
- **Private key** — used server-side to sign push messages. Stored in Supabase Vault (secret).

Generate once:
```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key:  BNbxGYNMhEIi3k5...
Private Key: 3KzvKMwEFqj...
```

The public key goes in `environment.ts`. The private key goes in Vault + Edge Function secrets.

## Why Trigger-Based, Not Polling

### Polling approach (rejected)

```
pg_cron every 1 minute → Edge Function → query DB → send push if due
```

- 1,440 Edge Function calls per day regardless of break count
- Up to 59 seconds late
- Simple but wasteful

### Trigger-based approach (chosen)

```
DB trigger on next_break_at change → schedule exact pg_cron job → fires once at right time
```

- Edge Function called only when breaks are actually due (~16 times/day for 2 users)
- Fires at the exact minute
- Each user has at most 1 scheduled job at a time
- `cron.schedule()` with same name upserts — extending/rescheduling break naturally works

### Why not trigger → pg_net directly (without pg_cron)?

The trigger fires when `next_break_at` is SET (i.e., when work starts or break completes). That's 45 minutes BEFORE the push should be sent. pg_net sends the HTTP request immediately when the transaction commits — there's no delay mechanism. We need pg_cron as the "alarm clock" that waits until the right moment.

### Why not Edge Function with setTimeout?

Edge Functions have execution time limits (max ~150 seconds on free tier). They can't sleep for 45 minutes.

## Lifecycle: What Happens When

| Event | What happens to scheduled push |
|---|---|
| Work session starts | Trigger schedules push for `next_break_at` |
| User extends work (+15 min) | `next_break_at` updates → trigger replaces cron job with new time |
| User takes break early | `next_break_at` set to null → trigger unschedules job |
| Break completes, new timer starts | `next_break_at` set to new time → trigger schedules new job |
| User pauses session | `status` changes → trigger unschedules job |
| User resumes session | `next_break_at` restored → trigger schedules job |
| User ends workday | `status = 'completed'` → trigger unschedules job |
| App crashes / tab closed | Cron job persists in DB — fires at right time regardless |
| Push already sent, user ignores it | `push_notified = true` — Edge Function skips on re-fire |

**The "app crashed" case is the key advantage.** Since scheduling lives in the database (pg_cron), it survives regardless of client state. The push arrives even if the user closed every browser tab.

## Cost Analysis (Free Tier)

| Resource | Free Tier Limit | Our Usage | % Used |
|---|---|---|---|
| Edge Function invocations | 500,000/month | ~480/month (2 users x 8 breaks x 30 days) | 0.1% |
| pg_cron jobs | No limit | 2 concurrent (1 per user) | Negligible |
| pg_net requests | 200/second limit | ~16/day | Negligible |
| Database storage | 500 MB | push_subscriptions: < 1 KB | Negligible |
| Vault secrets | No limit | 3 secrets | Negligible |

**Web Push delivery (Chrome/FCM) is free.** Google does not charge for delivering Web Push messages. The push service endpoint provided by `PushManager.subscribe()` routes through Google's servers at no cost.

**Total cost: $0/month.**

Even at scale (100 users, 10 breaks/day), we'd use ~30,000 invocations/month — still 6% of free tier.

## Security Considerations

- **VAPID private key** — stored in Vault (encrypted at rest) and Edge Function secrets. Never exposed to client.
- **Push subscriptions** — RLS-scoped to user_id. Users can only manage their own subscriptions.
- **Edge Function auth** — called with anon_key from pg_net. The function uses SERVICE_ROLE_KEY internally to query across users (needed for push delivery).
- **Trigger function** — `SECURITY DEFINER` to access cron.schedule. Audit the function carefully — it runs with elevated privileges.
- **Subscription cleanup** — 410 Gone responses from push service (user unsubscribed) trigger automatic deletion of stale subscriptions.

## Extensions to Enable

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vault is already enabled
```

Both extensions are available on all Supabase plans and can be enabled via Dashboard → Database → Extensions.

## References

- [Supabase: Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) — pg_cron + pg_net pattern
- [Supabase: Sending Push Notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) — Edge Function examples (Expo + FCM)
- [Supabase: pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net) — async HTTP from Postgres
- [Supabase: Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart) — scheduling jobs
- [Supabase: Edge Functions Pricing](https://supabase.com/docs/guides/functions/pricing) — 500K free invocations
- [Supabase: Vault](https://supabase.com/docs/guides/database/vault) — secret storage
- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030) — the standard
- [VAPID (RFC 8292)](https://datatracker.ietf.org/doc/html/rfc8292) — application server identification
- [web-push npm package](https://github.com/web-push-libs/web-push) — library used in Edge Function
