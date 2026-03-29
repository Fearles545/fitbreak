---
name: Multi-user model — Leo-curated assignment, not self-service
description: Users don't create their own rotations; Leo curates and assigns them. Marketplace concept parked for future.
type: project
---

The user management model is "Leo-curated assignment" — Leo creates workout templates and rotations, then assigns them to specific users. Users do not self-serve or browse a catalog.

Marketplace concept was discussed (system-owned templates browseable by all users, adopt as copy with `source_template_id` link, `is_marketplace` flag + RLS for read access) but parked — too early for 2 users, would be scope creep now.

**Why:** With only 2 users, building self-service or marketplace UX is premature. Leo knows each user's needs personally. The architecture supports marketplace later (template ownership model, `source_template_id` field planned) without requiring it now.

**How to apply:** Don't propose features that assume users manage their own exercise libraries. Any "template management" UI should be admin-level (Leo assigning to users), not end-user facing. If marketplace comes up again, the bar is: does user count justify the UX investment? Until there are 5+ users with diverse needs, the answer is no.
