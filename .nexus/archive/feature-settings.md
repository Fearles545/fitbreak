# Feature Spec: Settings Page

**Level:** 2
**Sprint:** 1
**Status:** Ready for implementation

## Summary

Build a Settings page (`/settings`) where the user configures daily-loop parameters: break interval, stepper defaults, and rest timer between strength sets. Wire `user_settings` table into all consuming services to replace hardcoded values. Support both predefined options and custom values.

## User Stories

### S1: Break Interval
**As a user, I want to set my break interval so the app matches my work rhythm.**
- Predefined options: 30, 45, 60 min
- Custom value input: 15–120 min range
- Saved to `user_settings.default_break_interval_min`
- New workday sessions use saved value
- Active session keeps its original interval (change applies next session)
- UI hint on settings page if session is active: "Зміни застосуються з наступного робочого дня"

### S2: Stepper Defaults
**As a user, I want my stepper to remember my last used settings.**
- Predefined duration options: 20, 30, 45, 60, 90 min + custom
- Predefined signal interval options: 3, 5, 10, 15 min + custom
- Settings page shows current values, editable
- Stepper setup screen pre-selects from settings
- On stepper start, auto-persist chosen values back to settings (last-used wins)

### S3: Rest Timer Between Strength Sets
**As a user, I want to set my default rest time between strength sets.**
- Predefined options: 30, 60, 90, 120 sec + custom (15–300 sec range)
- Used as fallback: template override → exercise default → user setting → 60sec
- Settings page only (no in-context UI for V1)

## UX Design

### Navigation
- Gear icon (⚙️ `settings` Material Symbol) in dashboard header, left of logout button
- Route: `/settings`, lazy-loaded, authGuard

### Settings Page Layout
```
← Назад                    (back to dashboard)

Налаштування

─── Перерви ───────────────
Інтервал між перервами
[30 хв] [45 хв] [60 хв] [Інше: ___]
ℹ️ "Зміни застосуються з наступного робочого дня"
   (only shown when session is active)

─── Степер ────────────────
Тривалість за замовчуванням
[20] [30] [45] [60] [90] [Інше: ___] хв

Сигнал кожні
[3] [5] [10] [15] [Інше: ___] хв

─── Силове ────────────────
Відпочинок між підходами
[30] [60] [90] [120] [Інше: ___] сек
```

### Interaction
- Chip-style selectors for predefined values
- "Інше" chip toggles a number input field
- Changes save immediately on selection (no save button)
- Optimistic update: signal updates instantly, persist in background
- Error: revert signal, show snackbar "Не вдалося зберегти"
- Custom value validated on blur/enter: show error if out of range

### Accessibility
- Chip groups: `role="radiogroup"` with `role="radio"` + `aria-checked` on each chip
- Custom input: `type="number"` with `min`/`max`, `aria-label`
- Back button: standard link/button with accessible label
- All labels in Ukrainian

## Technical Design

### New Files
- `src/app/settings/settings.service.ts` — SettingsService
- `src/app/settings/settings.component.ts` — replace stub

### Modified Files
- `src/app/dashboard/dashboard.component.ts` — add gear icon, call `settingsService.ensureLoaded()` in ngOnInit
- `src/app/dashboard/dashboard.service.ts` — read breakIntervalMin from SettingsService (line 68)
- `src/app/stepper/stepper.component.ts` — pre-select from settings, auto-persist on start
- `src/app/strength/strength.service.ts` — add settings to rest fallback chain (line 111)

### SettingsService Design

```typescript
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _settings = signal<UserSettings | null>(null);
  readonly settings = this._settings.asReadonly();

  // Non-null computed signals with defaults — safe to read anywhere
  readonly breakIntervalMin = computed(() =>
    this._settings()?.default_break_interval_min ?? 45);
  readonly stepperDurationMin = computed(() =>
    this._settings()?.default_stepper_duration_min ?? 60);
  readonly stepperIntervalMin = computed(() =>
    this._settings()?.default_stepper_interval_min ?? 5);
  readonly restBetweenSetsSec = computed(() =>
    this._settings()?.default_rest_between_sets_sec ?? 60);

  // Lazy load — first consumer triggers, others await same promise
  private loadPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<void> {
    if (this._settings()) return;
    if (!this.loadPromise) this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    // Upsert to ensure row exists, using onConflict: 'user_id'
    const { data } = await this.supabase.supabase
      .from('user_settings')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select()
      .single();

    if (data) this._settings.set(data as UserSettings);
  }

  // Column-level updates — avoids concurrent tab overwrites
  async update(changes: Partial<UserSettings>): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const prev = this._settings();
    // Optimistic update
    this._settings.set({ ...prev!, ...changes });

    const { error } = await this.supabase.supabase
      .from('user_settings')
      .update(changes)
      .eq('user_id', user.id);

    if (error) {
      // Revert on failure
      this._settings.set(prev);
      throw error;
    }
  }
}
```

### Data Flow

```
Any route init → settingsService.ensureLoaded()
                        ↓
              _settings signal populated
                        ↓
    ┌───────────────────┼───────────────────┐
    ↓                   ↓                   ↓
breakIntervalMin    stepperDurationMin  restBetweenSetsSec
    ↓                   ↓                   ↓
startWorkday()    stepper setup pre-  strength rest
reads signal      select + auto-      fallback chain
                  persist on start
```

### Integration Points

**dashboard.service.ts — startWorkday():**
```typescript
// Before:
const breakIntervalMin = 45;
// After:
const breakIntervalMin = this.settings.breakIntervalMin();
```

**stepper.component.ts — init + persist:**
```typescript
// Init: pre-select from settings
selectedDuration = signal(this.settings.stepperDurationMin());
selectedInterval = signal(this.settings.stepperIntervalMin());

// On start: persist last-used values
async onStart() {
  await this.settings.update({
    default_stepper_duration_min: this.selectedDuration(),
    default_stepper_interval_min: this.selectedInterval(),
  });
  // ... existing start logic
}
```

**strength.service.ts — rest fallback:**
```typescript
// Before:
restSec: slot.overrideRestSec ?? exercise.default_rest_sec ?? 60,
// After:
restSec: slot.overrideRestSec ?? exercise.default_rest_sec
  ?? this.settings.restBetweenSetsSec(),
```

### DB Migration (optional but recommended)
Add CHECK constraints for range validation:
```sql
ALTER TABLE user_settings
  ADD CONSTRAINT chk_break_interval
    CHECK (default_break_interval_min IS NULL
      OR default_break_interval_min BETWEEN 5 AND 120),
  ADD CONSTRAINT chk_stepper_duration
    CHECK (default_stepper_duration_min IS NULL
      OR default_stepper_duration_min BETWEEN 5 AND 120),
  ADD CONSTRAINT chk_stepper_interval
    CHECK (default_stepper_interval_min IS NULL
      OR default_stepper_interval_min BETWEEN 1 AND 30),
  ADD CONSTRAINT chk_rest_between_sets
    CHECK (default_rest_between_sets_sec IS NULL
      OR default_rest_between_sets_sec BETWEEN 10 AND 300);
```

## Risks & Mitigations

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| R1 | 🔴 | startWorkday before settings loaded | `ensureLoaded()` lazy pattern — first consumer triggers load |
| R3 | 🔴 | Upsert without onConflict causes 23505 | Always use `{ onConflict: 'user_id' }` |
| R8 | 🔴 | Direct navigation to /stepper skips settings load | Lazy load in SettingsService — any route can call ensureLoaded() |
| R11 | 🔴 | Null settings → NOT NULL constraint violation | Non-null computed signals with `?? defaults` |
| R2 | 🟡 | Mid-session change shows stale timer | Hint text on settings page when session is active |
| R4 | 🟡 | No DB range constraints on integers | Add CHECK constraints via migration |
| R10 | 🟡 | Explicit null bypasses DB defaults | Strip nulls from upsert, coalesce on read |
| R13 | 🟢 | Concurrent tab overwrites | Column-level `.update()` instead of full-row upsert |

## Explicitly Excluded (V1)
- Rotation order / enabled rotations — only 4 rotations, existing skip UI is sufficient
- Theme (light/dark/system) — auto-follows OS already
- Language — hardcoded Ukrainian, single user
- Notification sound type — cosmetic
- Tab flash toggle — works fine

## Done When
- [ ] SettingsService loads/creates user_settings row with lazy pattern
- [ ] Settings page shows break interval, stepper defaults, rest timer — with predefined chips + custom input
- [ ] Changes persist immediately (optimistic update)
- [ ] Dashboard reads break interval from settings for new sessions
- [ ] Stepper pre-selects from settings, auto-persists last used
- [ ] Strength rest fallback chain includes user setting
- [ ] Gear icon on dashboard header navigates to /settings
- [ ] Hint shown when changing interval during active session
- [ ] Custom values validated within allowed ranges
