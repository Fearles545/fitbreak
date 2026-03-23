---
description: "Multi-perspective code review — examine recent changes from architecture, QA, and UX viewpoints. Run after implementation, before considering work done."
---

# Nexus Review

You are running a multi-perspective code review. This is not a generic "check my code" —
it's structured examination from different expert viewpoints, each catching different issues.

## Input

CEO provides one of:
- Specific files or directory to review
- "Review my last changes" (use git diff)
- "Review the implementation of [feature]" (check against spec in `.nexus/active/`)

## Steps

### 1. Gather context

- Run `git diff` or `git diff --staged` to see recent changes
- If a Feature Spec exists in `.nexus/active/`, read it for acceptance criteria
- Read `.nexus/evergreen/ARCHITECTURE.md` for patterns and conventions

### 2. Architecture Review

Delegate to `nexus-frontend-architect` agent (or apply architectural thinking):

- Does the implementation follow patterns in ARCHITECTURE.md?
- Component design: SRP, proper composition, reusability where appropriate
- State management: consistent with project conventions
- File structure and naming: follows Key Conventions
- Any anti-patterns from ARCHITECTURE.md present?
- Performance: unnecessary re-renders, heavy computations, memory leaks
- Would this code be easy to modify in 3 months?

### 3. QA Review

Apply QA thinking:

- Edge cases: what inputs/states aren't handled?
- Error handling: are errors caught, logged, and shown to user appropriately?
- Are there missing null/undefined checks?
- What would break if [unexpected thing] happened?
- Test coverage: are critical paths testable? Are there tests?
- If Feature Spec exists: do acceptance criteria pass?

### 4. UX Review

Delegate to `nexus-ux-designer` agent (or apply UX thinking):

- Are all UI states handled? (empty, loading, error, success)
- Accessibility: keyboard navigation, aria labels, screen reader support, contrast
- Responsive behavior: does it work on mobile?
- Error messages: are they helpful? Can user recover?
- Is the interaction intuitive or does user need to think?

### 5. Compile findings

Categorize issues by severity:

```
🔍 Nexus Review: [scope]
━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Critical (must fix):
   - [issue + specific file/line + suggestion]

🟡 Important (should fix):
   - [issue + specific file/line + suggestion]

🟢 Minor (nice to have):
   - [issue + specific file/line + suggestion]

✅ What's good:
   - [positive observations — don't skip this]

📊 Summary: [N] critical, [N] important, [N] minor
```

If a Feature Spec exists, add:

```
📋 Spec Compliance:
   - [x] [met criteria]
   - [ ] [unmet criteria + what's missing]
```

## Rules

- Be specific. "Line 42 in timer.component.ts: missing error handling for..." not "consider adding error handling."
- Every issue must include a concrete suggestion, not just a complaint.
- Include positive feedback — what's done well. Review is not just about problems.
- Don't nitpick style when architecture has issues. Prioritize what matters.
- If Feature Spec exists, explicitly check each acceptance criterion.
- If no issues found in a category — say "No issues found" rather than inventing concerns.
- Respect existing patterns even if you'd do it differently — flag only actual problems, not preferences.
- Save review findings to `.nexus/active/review-[scope].md` for absorption during `/nexus-save`.
