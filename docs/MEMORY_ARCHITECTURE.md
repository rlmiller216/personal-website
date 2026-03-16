# Memory Architecture

How Claude Code remembers context across sessions. The project uses a **hot/warm/cold** pattern: hot memory loads automatically every session, warm memory is read on demand during deep work, and cold memory (git history) is searched only when needed.

---

## 1. The Three Layers

| Property | Layer 1: CLAUDE.md | Layer 2: memory/ | Layer 3: plans/ |
|---|---|---|---|
| Location | `./CLAUDE.md` (repo root) | `~/.claude/projects/.../memory/` | `~/.claude/plans/` |
| In git? | Yes | No | No |
| Auto-loaded? | Yes, every session | Yes, every session | Only if referenced |
| Content | How to build, run, extend the codebase | Who the user is, why decisions were made, working preferences | Step-by-step task checklists with progress tracking |
| Update trigger | After significant code changes | After planning/design sessions with new decisions | During active multi-session work |
| Lifespan | Permanent (versioned) | Semi-permanent (persists across sessions) | Ephemeral (per-task) |

**Why three layers:**

- **CLAUDE.md** — Shared via git so any clone gets full context. Answers: *"What is this project?"*
- **memory/** — Machine-local because it contains personal info that doesn't belong in a public repo. Answers: *"Who am I building for?"*
- **plans/** — Ephemeral task tracking with auto-generated filenames. Answers: *"What step am I on?"*

---

## 2. File Inventory

| File | Location | Lines | Purpose |
|---|---|---|---|
| CLAUDE.md | `./` | ~290 | Project rules, architecture, schemas, dev rules, deployment |
| MEMORY.md | `memory/` | ~15 | Index + current project status |
| user_profile.md | `memory/` | 15 | Rebecca's background, expectations, interests |
| project_decisions.md | `memory/` | ~55 | Dated design/tech decisions with rationale (lightweight ADRs) |
| feedback_skills.md | `memory/` | 13 | Proactive skill usage preferences |
| Plan files | `~/.claude/plans/` | varies | Active task plans with checkbox tracking |
| SRC_ARCHITECTURE.md | `docs/` | 270 | Source code map (warm reference) |
| SYSTEM_ARCHITECTURE.md | `docs/` | 260 | System design (warm reference) |
| WORKFLOWS.md | `docs/` | 325 | Data flows and pipelines (warm reference) |
| product-requirements.md | `docs/` | 52 | MoSCoW feature tracking (warm reference) |

---

## 3. Content Boundaries

Where does X go? This prevents duplication across layers.

| Content Type | Lives In | NOT In |
|---|---|---|
| Build/test/dev commands | CLAUDE.md | memory/ (would duplicate) |
| Tech stack + architecture overview | CLAUDE.md | memory/ (outcome only; rationale in project_decisions.md) |
| Decision rationale (why X over Y) | memory/project_decisions.md | CLAUDE.md (only the outcome) |
| User background + preferences | memory/user_profile.md | CLAUDE.md or docs/ |
| Code structure deep-dive | docs/SRC_ARCHITECTURE.md | CLAUDE.md (summary only) |
| Data flow diagrams | docs/WORKFLOWS.md | CLAUDE.md |
| Task progress tracking | plans/*.md | memory/ or CLAUDE.md |
| Skill usage preferences | memory/feedback_skills.md | CLAUDE.md |

---

## 4. Maintenance

- **CLAUDE.md**: Update after significant code changes. Use `claude-md-management:revise-claude-md` skill.
- **memory/MEMORY.md**: Update "Current Status" at end of major sessions.
- **memory/project_decisions.md**: Add entry whenever a non-trivial decision is made. Use lightweight ADR format: Title (date), Context, Decision, Consequence.
- **memory/user_profile.md**: Rarely changes. Update if Rebecca's role or preferences shift.
- **memory/feedback_skills.md**: Update if new skills are added or renamed.
- **Plan files**: Created per-task, cleaned up when work completes.
- **docs/**: Update when code architecture changes significantly. These are reference docs, not session-level memory.
