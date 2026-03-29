# Research: Angular Service Worker & Web Push Notifications

**Date:** 2026-03-29
**Context:** FitBreak break notification improvements — investigating whether Angular's built-in service worker handles Web Push or if a custom wrapper is needed.

## TL;DR

Angular's `ngsw-worker.js` has **full built-in support** for Web Push notifications. No custom service worker wrapper needed. The `SwPush` service provides a complete client-side API for subscriptions, messages, and notification click handling.

## What ngsw-worker.js Already Does

Confirmed by reading the actual source code (`node_modules/@angular/service-worker/ngsw-worker.js`, v21.2.4). The `Driver` constructor registers all four push-related event listeners:

```js
this.scope.addEventListener("push", (event) => this.onPush(event));
this.scope.addEventListener("notificationclick", (event) => this.onClick(event));
this.scope.addEventListener("notificationclose", (event) => this.onClose(event));
this.scope.addEventListener("pushsubscriptionchange", (event) => this.onPushSubscriptionChange(event));
```

### Push Event Handling

When a push event arrives, ngsw:

1. Broadcasts a `PUSH` message to all active clients (Angular tabs/windows)
2. If the payload contains `notification.title`, calls `self.registration.showNotification()` automatically
3. Supports all standard `NotificationOptions` fields (body, icon, badge, actions, data, etc.)

### Notification Click Handling

When the user clicks a notification, ngsw:

1. Closes the notification
2. Reads `notification.data.onActionClick[action]` to determine what to do
3. Supports 4 built-in operations:
   - `openWindow` — opens a new window/tab at the specified URL
   - `focusLastFocusedOrOpen` — focuses existing app window, or opens new one if none exists
   - `navigateLastFocusedOrOpen` — navigates existing window to URL, or opens new one
   - `sendRequest` — makes an HTTP request (useful for "dismiss" or "snooze" actions)
4. Broadcasts `NOTIFICATION_CLICK` to all clients so Angular app can react

### Notification Close & Subscription Change

- `notificationclose` — broadcasts to clients (useful for analytics)
- `pushsubscriptionchange` — broadcasts old/new subscription data (handles browser key rotation)

## SwPush Service API

Angular provides `SwPush` in `@angular/service-worker` — the client-side interface:

| Property/Method | Type | Purpose |
|---|---|---|
| `requestSubscription({serverPublicKey})` | `Promise<PushSubscription>` | Creates Web Push subscription, triggers browser permission prompt. Returns the subscription object to send to your server. |
| `unsubscribe()` | `Promise<void>` | Removes the active push subscription |
| `subscription` | `Observable<PushSubscription \| null>` | Current subscription state (reactive) |
| `messages` | `Observable<object>` | Push message payloads — fires on every `push` event |
| `notificationClicks` | `Observable<{action: string, notification: NotificationOptions}>` | Fires when user clicks/taps a notification |
| `notificationCloses` | `Observable<{action: string, notification: NotificationOptions}>` | Fires when notification is dismissed |
| `isEnabled` | `boolean` | Whether service worker is active and push is available |

## Push Payload Format

The server (Edge Function) must send the push payload in this format for ngsw to handle it automatically:

```json
{
  "notification": {
    "title": "Час на перерву!",
    "body": "Шия + Очі · ~3 хв",
    "icon": "/icons/icon-192x192.png",
    "badge": "/icons/icon-72x72.png",
    "tag": "break-reminder",
    "renotify": true,
    "requireInteraction": true,
    "vibrate": [200, 100, 200],
    "data": {
      "onActionClick": {
        "default": {
          "operation": "focusLastFocusedOrOpen",
          "url": "/"
        },
        "start": {
          "operation": "navigateLastFocusedOrOpen",
          "url": "/break"
        }
      }
    },
    "actions": [
      { "action": "start", "title": "Почати перерву" }
    ]
  }
}
```

### How ngsw processes this

1. Extracts `notification` from payload
2. Separates `title` from the rest (used as `NotificationOptions`)
3. Calls `self.registration.showNotification(title, options)`
4. On click: reads `data.onActionClick[action]` where `action` is the clicked button's action string, or `"default"` for body click
5. Executes the specified operation

### Key payload fields for FitBreak

| Field | Value | Purpose |
|---|---|---|
| `tag: "break-reminder"` | Replaces previous notification (no stacking) |
| `renotify: true` | Re-alerts even when replacing same tag |
| `requireInteraction: true` | Stays on screen until dismissed (Android) |
| `vibrate: [200, 100, 200]` | Vibration pattern on supported devices |
| `actions` | Action buttons on the notification itself |

**Note:** `vibrate` in the push payload is separate from our in-app vibration setting. The push payload vibration is controlled by the OS notification system and works even when the app is fully suspended. Our in-app `navigator.vibrate()` only works when JS is running.

## Custom Service Worker (NOT needed, but documented)

If we ever need custom logic beyond what ngsw provides, Angular 21 supports a wrapper pattern:

```js
// src/custom-sw.js
importScripts('./ngsw-worker.js');

(function () {
  'use strict';
  // Custom handlers run IN ADDITION to ngsw's handlers
  self.addEventListener('push', (event) => {
    // Custom push logic here
  });
})();
```

Register it in `app.config.ts`:
```typescript
provideServiceWorker('custom-sw.js', { /* options */ })
```

And add to `angular.json` assets: `"src/custom-sw.js"`

**We don't need this** because ngsw's built-in push handling covers our use case completely. The payload-driven `onActionClick` operations give us server-side control over click behavior without touching client code.

## What FitBreak Needs to Do (Client Side)

### 1. Subscribe to push (one-time, on permission grant)

```typescript
private swPush = inject(SwPush);

async subscribeToPush(): Promise<void> {
  const subscription = await this.swPush.requestSubscription({
    serverPublicKey: environment.vapidPublicKey
  });
  // Send subscription to Supabase (store for server-side push)
  await this.savePushSubscription(subscription.toJSON());
}
```

### 2. Handle notification clicks in-app (optional)

```typescript
this.swPush.notificationClicks.subscribe(({ action, notification }) => {
  // React to notification click within the app
  // ngsw already handles navigation via onActionClick
  // This is for additional in-app logic if needed
});
```

### 3. Handle subscription changes (recommended)

```typescript
this.swPush.subscription.subscribe(sub => {
  if (sub) {
    // Subscription active — sync with server if keys changed
  } else {
    // User revoked permission or subscription expired
  }
});
```

## Browser Compatibility

| Feature | Chrome Desktop | Chrome Android | Firefox | Safari |
|---|---|---|---|---|
| Service Worker | Yes | Yes | Yes | Yes (16.4+) |
| Push API | Yes | Yes | Yes | Yes (16.4+) |
| Notification API | Yes | Yes | Yes | Yes (limited) |
| `requireInteraction` | Yes | Yes | No | No |
| Notification actions | Yes | Yes | No | No |

FitBreak targets Chrome/Android, so full support for all features.

## References

- [Angular SwPush API](https://angular.dev/api/service-worker/SwPush)
- [Angular Push Notifications Guide](https://angular.dev/ecosystem/service-workers/push-notifications)
- [Custom Service Worker Scripts](https://angular.dev/ecosystem/service-workers/custom-service-worker-scripts)
- Source: `node_modules/@angular/service-worker/ngsw-worker.js` (v21.2.4)
