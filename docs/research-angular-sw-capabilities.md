# Research: Angular Service Worker — Complete Capabilities

**Date:** 2026-03-29
**Context:** FitBreak uses Angular 21 with `@angular/service-worker`. This document explores everything ngsw can do — what we already use, what we're missing, and what's possible.

## Current FitBreak SW State

| Capability | Status | Where |
|---|---|---|
| App shell caching (prefetch) | Done | `ngsw-config.json` → `"app"` asset group |
| Asset caching (icons, fonts) | Done | `ngsw-config.json` → `"assets"` asset group |
| Version update snackbar | Done | `app.ts` → `SwUpdate.versionUpdates` |
| Install prompt (Android) | Done | `InstallPromptComponent` |
| API data caching | **Not configured** | Missing `dataGroups` in ngsw-config |
| Unrecoverable state handler | **Missing** | Should be in `app.ts` |
| Push notifications | **Not implemented** | SwPush not used |
| Debug endpoint | Available | `/ngsw/state` |

---

## 1. Caching — Asset Groups (What We Have)

Asset groups cache **build artifacts** — files whose content is known at build time.

### Install & Update Modes

| Mode | `installMode` | `updateMode` | Behavior |
|---|---|---|---|
| Aggressive | `prefetch` | `prefetch` | Download everything immediately, re-download on every version change. Guarantees offline availability. More bandwidth. |
| Lazy start, eager update | `lazy` | `prefetch` | Only cache when first requested, but eagerly update on new versions. Good balance. |
| Fully lazy | `lazy` | `lazy` | Cache on demand, update on demand. Minimal bandwidth, but may serve stale assets. |

### FitBreak's Current Config

```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/index.html", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/icons/*", "/logo.svg", "/favicon.ico"],
        "urls": [
          "https://fonts.googleapis.com/**",
          "https://fonts.gstatic.com/**"
        ]
      }
    }
  ]
}
```

**This is correct.** App shell is prefetched (instant load). Assets are lazy-loaded but eagerly updated (fonts/icons don't block install, but are refreshed on new versions).

### `files` vs `urls`

- **`files`** — glob patterns matched against build output. ngsw computes content **hashes** and includes them in `ngsw.json`. Integrity-verified on every serve.
- **`urls`** — URL patterns matched at runtime. **No hashes** (content unknown at build time). Uses **stale-while-revalidate**: serves cached version immediately, fetches fresh copy in background. This is how Google Fonts work in our config.

---

## 2. Caching — Data Groups (What We're Missing)

Data groups cache **runtime data** — API responses, dynamic content. Unlike asset groups, they're not tied to app versions. They have their own TTL and eviction policies.

### Two Strategies

| Strategy | Behavior | Best for |
|---|---|---|
| `performance` | **Cache-first.** Serve from cache immediately. Refresh in background if `maxAge` expired. | Slow-changing data: exercises, templates, settings |
| `freshness` | **Network-first.** Try network within `timeout`, fall back to cache. | Frequently-changing data: sessions, real-time state |

### Configuration Options

```json
{
  "dataGroups": [
    {
      "name": "group-name",
      "urls": ["https://api.example.com/data/**"],
      "version": 1,
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "7d",
        "timeout": "3s"
      }
    }
  ]
}
```

| Property | Required | Description |
|---|---|---|
| `maxSize` | Yes | Max number of cache entries |
| `maxAge` | Yes | How long entries are valid. Format: `1d6h30m15s` |
| `timeout` | No | Network timeout before fallback (only useful for `freshness`) |
| `strategy` | No | `performance` (default) or `freshness` |
| `version` | No | Integer. Increment to force cache invalidation (e.g., API breaking change) |

### What FitBreak Should Add

```json
{
  "dataGroups": [
    {
      "name": "supabase-exercises",
      "urls": ["https://*.supabase.co/rest/v1/exercises*"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 100,
        "maxAge": "7d"
      }
    },
    {
      "name": "supabase-templates",
      "urls": ["https://*.supabase.co/rest/v1/workout_templates*"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "7d"
      }
    },
    {
      "name": "supabase-settings",
      "urls": ["https://*.supabase.co/rest/v1/user_settings*"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 5,
        "maxAge": "1d",
        "timeout": "3s"
      }
    }
  ]
}
```

**Why this matters:** With data groups, the exercise library is available offline. If the user opens the app on the subway (no signal), they still see their exercises. The break flow could work end-to-end offline (minus logging the completion to Supabase — that would need background sync).

**Important:** Data groups only cache **GET** requests. POST/PUT/DELETE (writing to Supabase) are never cached by ngsw.

---

## 3. Navigation Handling

### How It Works

ngsw intercepts all **navigation requests** (browser URL bar, link clicks, page refreshes) and serves the cached `index.html`. This is what makes SPA routing work offline — the Angular router handles the URL client-side.

### `navigationUrls` (customizable)

Default pattern:
```json
["/**", "!/**/*.*", "!/**/*__*", "!/**/*__*/**"]
```

Meaning: all URLs are navigation EXCEPT URLs with file extensions (.js, .css, .png) and URLs with `__` (build tool artifacts).

**FitBreak doesn't customize this — the default is correct.**

### `navigationRequestStrategy`

| Value | Behavior | When to use |
|---|---|---|
| `performance` (default) | Always serve cached `index.html`. Never hits network for navigation. | SPAs with client-side routing (FitBreak) |
| `freshness` | Try network first for navigation. Fall back to cache if offline. | Apps with server-side auth redirects or SSR |

**FitBreak should stay on `performance`** (the default). We want instant app shell loading. Our auth is handled client-side via Supabase tokens.

---

## 4. SwUpdate — Version Management

### What FitBreak Already Has

```typescript
// app.ts — version ready → snackbar with reload
this.swUpdate.versionUpdates.subscribe((event) => {
  if (event.type === 'VERSION_READY') {
    const ref = this.snackBar.open('Доступне оновлення', 'Оновити');
    ref.onAction().subscribe(() => document.location.reload());
  }
});
```

### All Version Events

| Event | `type` string | Meaning |
|---|---|---|
| `VersionDetectedEvent` | `VERSION_DETECTED` | New version found on server, download starting |
| `VersionReadyEvent` | `VERSION_READY` | New version downloaded, ready to activate on next load |
| `VersionInstallationFailedEvent` | `VERSION_INSTALLATION_FAILED` | Download/install of new version failed |
| `NoNewVersionDetectedEvent` | `NO_NEW_VERSION_DETECTED` | Manual check found no update |

### What FitBreak Is Missing: Unrecoverable State

When the browser evicts some cached files but not others (common on mobile with storage pressure), the SW can enter an unrecoverable state. Without handling this, the app breaks silently.

```typescript
// Should be added to app.ts
this.swUpdate.unrecoverable.subscribe(event => {
  const ref = this.snackBar.open(
    'Помилка кешу, потрібне перезавантаження',
    'Оновити'
  );
  ref.onAction().subscribe(() => document.location.reload());
});
```

### `appData` — Metadata in Updates

ngsw-config.json supports an `appData` field — arbitrary JSON available in version events:

```json
{
  "appData": {
    "version": "2.1.0",
    "changelog": "New exercise categories, improved timer"
  }
}
```

Accessible as:
```typescript
if (event.type === 'VERSION_READY') {
  const appData = event.latestVersion.appData as { version: string; changelog: string };
  this.snackBar.open(`Оновлення ${appData.version}: ${appData.changelog}`, 'Оновити');
}
```

**Nice-to-have** for FitBreak — could show what's new in the update snackbar.

### `checkForUpdate()` — Manual Check

```typescript
const hasUpdate = await this.swUpdate.checkForUpdate();
```

Useful for a "Check for updates" button in settings, or to force a check after a long session.

### Driver States

The SW can be in one of three states (visible at `/ngsw/state`):

| State | Meaning | Behavior |
|---|---|---|
| `NORMAL` | Everything working | Serves from cache, checks for updates |
| `EXISTING_CLIENTS_ONLY` | No clean copy of latest version available | Existing tabs use cache, new loads go to network. Self-heals on next valid version. |
| `SAFE_MODE` | Cache completely broken | ALL requests fall through to network. Minimal SW code running. |

Degraded states reset when the browser terminates and recreates the SW.

---

## 5. SwPush — Push Notifications

See separate document: `docs/research-angular-sw-push.md`

Quick summary: ngsw-worker.js handles `push`, `notificationclick`, `notificationclose`, and `pushsubscriptionchange` events natively. `SwPush` provides `requestSubscription()`, `messages`, `notificationClicks`, and `subscription` observables. No custom SW needed.

---

## 6. Offline Capabilities

### What Works Offline Today (FitBreak)

| Feature | Offline? | Why |
|---|---|---|
| App loads | Yes | App shell cached via prefetch |
| SPA routing | Yes | `index.html` served for all navigation |
| Icons, fonts | Yes (after first load) | `assets` group with lazy install |
| Exercise data | **No** | No data groups configured |
| Break timer UI | **Partial** | Component loads, but data from Supabase fails |
| Start/end workday | **No** | Writes to Supabase (needs network) |

### What Could Work Offline (with config)

| Feature | How |
|---|---|
| Exercise library | Add `dataGroups` for exercises and templates |
| Break flow (read-only) | Data groups + local state in signals |
| Settings | Data group with `freshness` strategy |

### What Can Never Work Offline (via ngsw)

| Feature | Why | Workaround |
|---|---|---|
| Start/end workday | POST to Supabase | Background Sync + IndexedDB queue |
| Log break completion | POST to Supabase | Background Sync + IndexedDB queue |
| Login/signup | Auth requires network | Show "offline" message |
| Real-time sync | WebSocket needs network | N/A |

---

## 7. Background Sync

**ngsw has NO built-in Background Sync support.** This is a known gap (GitHub issue #22145, open since 2018, Angular team has not implemented it).

### How It Would Work (custom SW)

If we ever need offline-to-online data sync:

```javascript
// custom-sw.js
importScripts('./ngsw-worker.js');

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-break-log') {
    event.waitUntil(syncPendingBreakLogs());
  }
});

async function syncPendingBreakLogs() {
  // Read pending logs from IndexedDB
  // POST each to Supabase
  // Remove from IndexedDB on success
}
```

**Register in app.config.ts:**
```typescript
provideServiceWorker('custom-sw.js', { enabled: !isDevMode() })
```

The Angular app would:
1. Try to POST to Supabase
2. If offline, store in IndexedDB
3. Register a sync: `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-break-log'))`
4. Browser fires `sync` event when connectivity returns

**FitBreak relevance:** Future feature. Not critical now (users are typically online when using the app at their desk), but would be valuable for mobile scenarios.

---

## 8. Debug & Diagnostics

### `/ngsw/state` endpoint

Navigate to `https://your-app.com/ngsw/state` to see:

```
NGSW Debug Info:

Driver version: 21.2.4
Driver state: NORMAL ((nominal))
Latest manifest hash: eea7f5f464f90789b621170af5a569d6be077e5c
Last update check: 2s123u ago

=== Version eea7f5f464f90789b621170af5a569d6be077e5c ===
Clients: 7b79a015-69af-4d3d-9ae6-95ba90c79486

=== Idle Task Queue ===
Last update tick: 1s496u
Last update run: never
Task queue:
 - init post-load (update, cleanup)

Debug log:
```

### `ngsw-bypass` — Skip the SW

Add `ngsw-bypass` header or query param to skip caching for specific requests:

```typescript
// Skip SW for this request
this.http.get('/api/data', {
  headers: { 'ngsw-bypass': 'true' }
});

// Or via query param
fetch('/api/data?ngsw-bypass');
```

Useful for: file uploads (SW breaks progress events), requests that must always hit network, debugging cache issues.

### Nuclear Option: Force Unregister

If the SW gets into a bad state in production:

1. **Delete `ngsw.json`** from the server → SW gets 404, unregisters itself, clears all caches
2. **Serve `safety-worker.js`** (included in `@angular/service-worker` package) at the SW URL → force-unregisters and clears caches

### Chrome DevTools

- **Application > Service Workers** — registration status, manual update/unregister, offline toggle
- **Application > Cache Storage** — inspect all ngsw caches (may need right-click → refresh)
- **Network tab** — entries with "(ServiceWorker)" in Size column are served from cache
- **Warning:** DevTools open prevents the SW from going idle — behavior differs from real usage

---

## 9. Lesser-Known Features

### a) Registration Strategy

Control when the SW registers:

```typescript
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000'  // or 'registerImmediately'
})
```

| Strategy | Behavior |
|---|---|
| `registerWhenStable:30000` (default) | Wait for app to stabilize, or 30s timeout |
| `registerImmediately` | Register on first tick |
| `() => Observable` | Custom Observable — SW registers when it emits |

Custom example: register after user logs in:
```typescript
registrationStrategy: () => inject(AuthService).user$.pipe(filter(Boolean), take(1))
```

### b) `cacheQueryOptions`

Control how cache matching works:

```json
{
  "name": "app",
  "installMode": "prefetch",
  "cacheQueryOptions": { "ignoreSearch": true },
  "resources": { "files": ["/index.html"] }
}
```

`ignoreSearch: true` means `/index.html?v=123` matches cached `/index.html`. Useful when CDNs add cache-busting query params.

### c) Hash Validation & Recovery

ngsw validates content hashes for every `files` resource. If a cached file fails validation:
1. Re-fetches with cache-busting query param
2. If that also fails, marks the entire version as invalid
3. Falls back to `EXISTING_CLIENTS_ONLY` state
4. Self-heals when a new valid version appears

This means **corrupted caches are automatically detected and recovered** — no user action needed.

### d) The Angular SW Is in Maintenance Mode

The Angular team has stated that ngsw is "a basic caching utility for simple offline support with a limited featureset." They accept primarily security fixes. For advanced use cases (background sync, periodic sync, complex caching), they recommend native browser APIs or Workbox — potentially through the custom SW script pattern.

**What this means for us:** Don't expect new features from ngsw. What it does today (caching, push, updates) is stable and well-tested. For anything beyond that, use custom-sw.js.

---

## 10. Actionable Items for FitBreak

### Quick Wins (should do now)

1. **Add `unrecoverable` handler** in `app.ts` — prevents broken app on cache eviction
2. **Add data groups** for exercises and templates — enables offline exercise display

### Medium-Term (with push notification feature)

3. **Implement SwPush** — break reminders via Web Push
4. **Handle `pushSubscriptionChanges`** — keep server-side subscription in sync
5. **Add `appData` to ngsw-config.json** — richer update notifications

### Future (if offline-first needed)

6. **Custom SW for background sync** — queue writes when offline, sync on reconnect
7. **Data groups for sessions** — cache recent sessions with `freshness` strategy

---

## References

- [Angular SW Overview](https://angular.dev/ecosystem/service-workers)
- [SW Configuration (ngsw-config.json)](https://angular.dev/ecosystem/service-workers/config)
- [SW Communication (SwUpdate, SwPush)](https://angular.dev/ecosystem/service-workers/communications)
- [SW DevOps (debug, recovery)](https://angular.dev/ecosystem/service-workers/devops)
- [Push Notifications Guide](https://angular.dev/ecosystem/service-workers/push-notifications)
- [Custom SW Scripts](https://angular.dev/ecosystem/service-workers/custom-service-worker-scripts)
- [SwUpdate API](https://angular.dev/api/service-worker/SwUpdate)
- [SwPush API](https://angular.dev/api/service-worker/SwPush)
