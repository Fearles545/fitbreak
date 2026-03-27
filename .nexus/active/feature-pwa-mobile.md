# Feature: PWA Mobile Experience

**Level:** 1
**Date:** 2026-03-27
**Status:** Draft

## Context

FitBreak has zero PWA infrastructure despite being listed as a PWA in the tech stack. The app works in mobile browsers but isn't installable, has no offline shell, and doesn't feel like a native app. Adding proper PWA support makes FitBreak installable on Android home screen with standalone fullscreen mode — earning daily engagement.

Android-only focus. iOS is not a target (CEO uses Apple only for laptop).

## User Stories

- As a user, I want to install FitBreak on my Android home screen so that it opens like a native app without browser chrome
  - AC: Manifest + service worker registered; Chrome shows install banner automatically
  - AC: App opens in standalone mode with Deep Purple status bar
  - AC: App icon is the FitBreak logo at 192x192 and 512x512

- As a user, I want a hint about installing the app so that I know it's possible
  - AC: On first mobile visit, a dismissible banner says "Додай FitBreak на головний екран"
  - AC: Tapping the banner triggers Chrome's native install prompt
  - AC: Dismissal is stored in localStorage — banner never shows again
  - AC: Banner does not appear on desktop

- As a user, I want the app shell to load even with poor connection so that I see the UI quickly
  - AC: App shell (JS, CSS, HTML) is prefetch-cached by service worker
  - AC: Google Fonts are lazy-cached on first use
  - AC: When offline, app shell loads but data operations show error state (no fake offline mode)

- As a user, I want to know when a new version is available so that I can update
  - AC: When a new version is detected, a snackbar shows "Доступне оновлення" with "Оновити" button
  - AC: Tapping "Оновити" reloads the page to activate the new version

## UX Flow

### Install
1. User visits FitBreak on Android Chrome
2. One-time banner at bottom: "Додай FitBreak на головний екран" with install + dismiss buttons
3. Tap install → Chrome native install dialog
4. App appears on home screen with FitBreak icon
5. Future opens: standalone mode, Deep Purple status bar, no browser chrome

### Update
1. User opens installed app
2. Service worker detects new version in background
3. Snackbar appears: "Доступне оновлення" — "Оновити"
4. Tap → page reloads with new version

### Offline
1. User opens app with no connection
2. App shell loads from cache (spinner/layout visible)
3. Data calls fail → components show existing error handling
4. No special offline UI needed for V1

## Technical Design

### New Files
- `public/manifest.webmanifest` — app manifest (name, icons, theme, display, scope)
- `ngsw-config.json` — Angular service worker caching config
- `public/icons/icon-192x192.png` — app icon (CEO provides)
- `public/icons/icon-512x512.png` — app icon (CEO provides)
- `src/app/shared/components/install-prompt/` — install hint banner component

### Modified Files
- `src/index.html` — `lang="uk"`, `<meta name="theme-color">`, manifest link
- `angular.json` — add `"serviceWorker": "ngsw-config.json"` to build options
- `src/app/app.component.ts` — integrate install prompt + SwUpdate logic
- `package.json` — `@angular/service-worker` dependency

### Caching Strategy (ngsw-config.json)
- **App shell** (`installMode: prefetch`): index.html, JS bundles, CSS
- **Assets** (`installMode: lazy`): icons, fonts
- **No data caching**: Supabase API calls are not cached

### Install Prompt Component
- Listens for `beforeinstallprompt` event (Chrome/Android only)
- Stores `pwa-install-dismissed` in localStorage
- Shows only on mobile (`window.matchMedia('(display-mode: browser)')` + screen width check)
- Simple banner with mat-button, positioned at bottom

### Update Prompt
- `SwUpdate.versionReady` observable in app.component
- Opens MatSnackBar with action button
- Action → `document.location.reload()`

## Edge Cases & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stale cached JS after deploy | Medium | SwUpdate detects new version, user prompted to reload |
| Base href mismatch (`/fitbreak/`) | Medium | Manifest `start_url` and `scope` must use `/fitbreak/` prefix |
| `beforeinstallprompt` doesn't fire | Low | Not critical — manual install still works |
| Service worker interferes with dev | Low | Angular only registers SW in production builds |
| Google Fonts unavailable offline | Low | Lazy cache covers repeat visits; system font fallback acceptable |

## Acceptance Criteria

- [ ] `ng build` produces a valid service worker and manifest
- [ ] Chrome DevTools → Application → Manifest shows valid manifest with icons
- [ ] Chrome DevTools → Application → Service Workers shows registered SW
- [ ] Lighthouse PWA audit passes (installable, service worker, manifest)
- [ ] Deployed to GitHub Pages: Android Chrome shows install banner
- [ ] Installed app opens in standalone mode with purple status bar
- [ ] After deploy of new version: update snackbar appears on next open
- [ ] Install hint shows once on mobile, never again after dismissal

## Open Questions

- [ ] Icon PNGs: CEO is generating — implementation blocked until provided

## Prerequisites

- Icon PNG files (192x192, 512x512) must be provided before implementation
