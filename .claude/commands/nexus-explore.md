---
description: "Feature preparation pipeline — consult product, UX, architecture, and QA perspectives to create a comprehensive Feature Spec before coding. Use for Level 2+ tasks."
---

# Nexus Explore

You are running the preparation pipeline — the core value of Nexus.
Before any code is written, the feature is examined from multiple perspectives.
The output is a Feature Spec that makes implementation focused and high-quality.

**Reference:** `.nexus/nexus-helpers.md#Feature-Spec-Format` for output format.

## Input

CEO provides: feature name/description, and optionally initial thoughts or constraints.
If no level is specified, assess using `.nexus/nexus-helpers.md#Level-Assessment`.

## Steps

### 1. Load context

Read:
- `.nexus/evergreen/PROJECT-IDENTITY.md` — north star, boundaries, target user
- `.nexus/evergreen/ARCHITECTURE.md` — current patterns, anti-patterns
- `.nexus/evergreen/DECISION-LOG.md` — relevant past decisions
- `.nexus/evergreen/EXECUTION-PLAN.md` — where this feature fits in the plan

### 2. Product perspective

Delegate to `nexus-product-lead` agent (or apply product thinking):

- Why are we building this? What user problem does it solve?
- Write user stories with concrete acceptance criteria
- Identify edge cases from user perspective
- Check alignment with PROJECT-IDENTITY boundaries
- Define what "done" looks like

Present to CEO for feedback before proceeding.

### 3. UX & Accessibility perspective

Delegate to `nexus-ux-designer` agent (or apply UX thinking):

- Design the user flow (step by step)
- Identify all UI states: empty, loading, error, success, edge
- Accessibility requirements for this feature
- Cognitive load considerations
- Mobile/responsive behavior

Present to CEO for feedback before proceeding.

### 4. Technical perspective

Delegate to `nexus-frontend-architect` and/or `nexus-backend-engineer` agents:

- Components to create or modify
- State management approach
- Data model changes (if any)
- API contracts (if any)
- Integration with existing architecture
- Performance considerations

Present to CEO for feedback before proceeding.

### 5. QA perspective

Apply QA thinking (or delegate to QA agent if exists):

- Edge cases that could break
- Error scenarios and recovery
- What needs testing
- Risk assessment (what's the blast radius if this goes wrong?)

### 6. Synthesize Feature Spec

Create `.nexus/active/feature-[name].md` using format from
`nexus-helpers.md#Feature-Spec-Format`.

Combine all perspectives into one document. Flag any conflicts
between perspectives (e.g., PM wants feature X but architect says it conflicts with pattern Y).

### 7. CEO Review

Present the complete Feature Spec summary:

```
📐 Feature Spec: [Name]
━━━━━━━━━━━━━━━━━━━━━━

📋 User Stories: [N] stories, [N] acceptance criteria
🎨 UX Flow: [brief description]
🏗️ Technical: [components, state changes, data model]
⚠️ Risks: [top 2-3 risks]
❓ Open Questions: [unresolved items]

📄 Full spec: .nexus/active/feature-[name].md

Ready to implement? Proceed with coding using the spec above.
```

Ask CEO if anything needs adjustment before implementation begins.

## Rules

- Each perspective step should be concise but thorough. Not a 10-page doc, but not 2 sentences either.
- Present each perspective to CEO before moving to the next — they may have input that changes direction.
- If a feature clearly violates PROJECT-IDENTITY boundaries, flag it at step 2 and let CEO decide.
- Don't skip perspectives even if they seem unnecessary — UX review on a "simple" feature often catches the most issues.
- Open Questions section is important — it's okay to not resolve everything. Better to flag unknowns than pretend certainty.
- If CEO wants to skip a perspective for speed, respect that but note what was skipped.
