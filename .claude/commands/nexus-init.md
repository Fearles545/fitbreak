---
description: "Initialize Nexus on a project — analyze codebase, interview CEO, generate agents and evergreen docs. Run once per project."
---

# Nexus Init

You are onboarding a new project onto Nexus. This creates the project's "brain" —
the `.nexus/` directory with evergreen docs and `.claude/agents/` with specialized team.

**This command runs ONCE per project.**

## Steps

### 1. Analyze codebase

Explore the project structure, tech stack, and architecture:
- Read package.json / Cargo.toml / requirements.txt (dependencies and scripts)
- Scan directory structure (component organization, patterns)
- Identify key configuration files
- Look at existing documentation (README, docs/, comments)
- Check for existing CLAUDE.md

Formulate initial impressions:
- Tech stack with versions
- Architecture style (component-based, MVC, etc.)
- Project maturity (MVP, growing, mature)
- Strengths you observe
- Gaps or potential improvements
- Estimated project level (0-4 scale)

### 2. Present findings to CEO

```
🔍 Project Analysis: [detected project name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Tech Stack: [list with versions]
🏗️ Architecture: [style and patterns detected]
📊 Maturity: [MVP / Growing / Mature]
📁 Structure: [brief overview]

💪 Strengths:
   - [observed strength]

🔍 Gaps/Opportunities:
   - [observed gap]

📐 Estimated Level: [0-4]
```

Ask CEO: "Does this look accurate? Anything I'm missing or misreading?"

### 3. Interview CEO

Ask these questions one at a time (or in small groups). Wait for answers.

**Identity:**
- "In one sentence — what does this project do and for whom?"
- "What's the north star — the one principle that guides all decisions?"
- "What do you explicitly NOT want this project to become? Any rejected directions?"

**Context:**
- "Tell me about yourself — your background, strengths, and areas where you want AI team support."
- "How much time do you dedicate to this project? (hours per week)"

**Direction:**
- "What are you working on right now or planning next?"
- "Any pain points or technical debt you're aware of?"

### 4. Propose team

Based on tech stack and CEO's answers, propose a set of agents:

```
👥 Proposed Nexus Team:
━━━━━━━━━━━━━━━━━━━━━━

1. nexus-product-lead (sonnet) — [tailored description]
2. nexus-frontend-architect (opus) — [tailored description]
3. nexus-backend-engineer (sonnet) — [tailored description]
4. nexus-ux-designer (sonnet) — [tailored description]

Add/remove/modify? Or approve this team?
```

Adjust agent set based on project needs:
- Pure frontend project? Maybe skip backend engineer.
- No UI? Skip UX designer.
- Complex domain? Add domain-specific expert.
- API-only? Different composition.

Wait for CEO approval before generating.

### 5. Generate files

After CEO approves, create:

**`.nexus/` directory structure:**
```
.nexus/
├── NEXUS-INDEX.md          (from template, filled with project info)
├── nexus-helpers.md         (from template, as-is)
├── evergreen/
│   ├── PROJECT-IDENTITY.md  (filled from interview)
│   ├── ARCHITECTURE.md      (filled from analysis)
│   ├── DECISION-LOG.md      (empty template)
│   ├── EXECUTION-PLAN.md    (empty template with parking lot from interview)
│   ├── RETROSPECTIVE-LOG.md (empty template)
│   └── WORKFLOW-STATUS.md   (initialized with "Just onboarded" state)
├── active/                  (empty directory)
├── handoffs/                (empty directory)
└── archive/                 (empty directory)
```

**`.claude/agents/nexus-*.md`** for each approved agent:
- Fill `{{PLACEHOLDERS}}` with project-specific context
- Set correct tools and model per agent role
- Include references to `.nexus/evergreen/` files
- Include memory instructions

**Update `CLAUDE.md`** — add Nexus integration section:
```markdown
## Nexus Integration
This project uses Nexus for project context management.
CEO: [brief description from interview]
Entry point: .nexus/NEXUS-INDEX.md
Agents: .claude/agents/nexus-* (auto-delegated)
Always consult .nexus/evergreen/ files before major decisions.
```

### 6. Confirm

```
✅ Nexus Initialized!
━━━━━━━━━━━━━━━━━━━━

📁 Created: .nexus/ with 6 evergreen docs
👥 Team: [N] agents in .claude/agents/
📋 Updated: CLAUDE.md

⏭️ Next steps:
   1. Review generated files — adjust anything that doesn't feel right
   2. Run /nexus-plan to define your first sprint
   3. Start building!
```

## Rules

- This is a CONVERSATION, not a script. Ask questions, wait for answers, adapt.
- If the project already has `.nexus/`, warn CEO and ask if they want to reinitialize.
- Be thorough in analysis but concise in presentation.
- Don't generate agents CEO didn't approve.
- PROJECT-IDENTITY north star and boundaries MUST come from CEO, not from your analysis.
- ARCHITECTURE observations should be presented for CEO validation, not stated as facts.
- If CEO seems unsure about north star or boundaries, help them think through it — but the final words are theirs.
