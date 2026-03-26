---
name: Dashboard nextRotation uses hardcoded rotation order
description: dashboard.component.ts nextRotation computed uses ROTATION_ORDER constant instead of user's settings.rotation_order -- shows wrong next rotation for customized users
type: project
---

In `dashboard.component.ts:548-555`, the `nextRotation` computed uses the hardcoded `ROTATION_ORDER` from `rotation.constants.ts` to look up the next rotation by `current_rotation_index`. The user can customize their rotation order in settings (`user_settings.rotation_order`), so the dashboard shows the wrong rotation name.

**Why:** The user's custom rotation order is stored in `user_settings.rotation_order` and loaded by SettingsService. The dashboard should read from there instead of the constant.

**How to apply:** When reviewing rotation-related code, always check whether it respects the user's custom `rotation_order` and `enabled_rotations` from SettingsService rather than the hardcoded constants.
