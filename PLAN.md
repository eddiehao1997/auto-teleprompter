# Auto-Teleprompter: AI Agent Team & Development Plan

## Context

The goal is to transform an existing basic React teleprompter web app into a full-featured mobile/tablet teleprompter with **voice-driven auto-scroll** (adapts to speaking pace) and **multi-speaker support** (multiple speakers on a single device, color-coded sections). The current app has: script editor, constant-speed auto-scroll, countdown, mirror mode, play/pause, and progress bar — but no voice integration, no speaker concept, and limited responsive design.

### Key Decisions
- **Multi-speaker**: Single device only (no multi-device sync). Speakers share one screen; sections color-coded by speaker.
- **Language**: Migrate from JavaScript (.jsx) to **TypeScript (.tsx)** for type safety.
- **Priority**: Voice-driven scroll first, then multi-speaker support.

### What Are the AI Agents?
The AI agents are **NOT part of the app**. They are the **development team** — specialized AI coding agents that each build a different part of the app. Think of them as developers with different expertise. Each agent is a Claude Code session with a focused prompt and specific files to work on. The final app is a normal React web app with no AI components inside it.

---

## 1. AI Agent Team Structure

### Agent 1: Architect Agent
**Role**: Technical lead. Defines data models, state management, module boundaries.

**Tasks**:
- Design structured script data model (sections, speakers, content blocks)
- Set up state management (`useReducer` + React Context — two contexts: `ScriptContext` and `SessionContext`)
- Create folder structure: `hooks/`, `services/`, `contexts/`, `utils/`, `constants/`
- Define interface contracts between all modules
- Refactor `App.jsx` from individual `useState` calls to context providers

**Outputs**: Data models, context providers, folder structure, architecture contracts.

### Agent 2: Voice/Speech Agent
**Role**: Speech recognition and voice-driven scroll specialist.

**Tasks**:
- Build `useSpeechRecognition` hook (wraps Web Speech API with browser compat)
- Build text-matching algorithm (`utils/voiceMatch.js`) — forward-only sliding window with fuzzy matching
- Build `useVoiceScroll` hook — combines recognition + matching → target scroll position
- Build `useScrollEngine` hook — unified controller for constant-speed vs. voice-driven modes
- Handle continuous recognition restart, Safari quirks, microphone permissions, graceful fallback

**Outputs**: Speech hooks, matching algorithm, scroll engine.

### Agent 3: Script Management Agent
**Role**: Multi-speaker script editor and data management.

**Tasks**:
- Build `useSpeakers` hook (CRUD for speakers with color assignment)
- Build `SpeakerManager` component (add/edit/delete speakers, color picker)
- Refactor `ScriptEditor.jsx` from plain textarea → structured section editor with speaker assignment
- Build `useScriptStorage` hook for localStorage persistence
- Maintain backward compat: plain text paste → single section, no speaker

**Outputs**: Speaker management UI, enhanced script editor, persistence hooks.

### Agent 4: Teleprompter Display Agent
**Role**: Playback rendering, section highlighting, mode switching.

**Tasks**:
- Build `ScriptRenderer` component — renders sections with speaker colors
- Refactor `Teleprompter.jsx` to use `useScrollEngine` instead of inline scroll logic
- Add voice-scroll mode toggle in controls
- Add current-word/section highlighting in voice mode
- Add speaker name labels at section transitions
- Add microphone status indicator

**Outputs**: Refactored teleprompter with multi-mode scroll support.

### Agent 5: UX/Responsive Agent
**Role**: CSS, responsive layouts, design system, accessibility.

**Tasks**:
- Extract hardcoded colors into CSS custom properties on `:root`
- Define breakpoints: phone (<768px), tablet (768-1024px)
- Add responsive layouts (tablet: wider editor, side-by-side settings)
- Fix touch targets to 44x44px minimum (currently 40px)
- Add safe area insets for notched phones
- Define speaker color palette (8 high-contrast colors for dark backgrounds, WCAG AA compliant)
- Test landscape orientation

**Outputs**: Responsive CSS, design tokens, accessible layouts.

### Agent 6: TypeScript Migration Agent
**Role**: Migrate codebase from JSX to TSX, define type system.

**Tasks**:
- Add TypeScript to the project (tsconfig.json, vite TS support)
- Convert `.jsx` files to `.tsx` with proper type annotations
- Define shared types/interfaces for Script, Speaker, Section, SpeechState, ScrollState
- Type all hooks, context providers, and component props

**Outputs**: TypeScript configuration, type definitions, converted components.

### Agent 7: Testing/Quality Agent
**Role**: Test infrastructure and quality assurance.

**Tasks**:
- Set up Vitest + React Testing Library (with TypeScript support)
- Unit test the voice matching algorithm thoroughly (the most critical pure-logic code)
- Component tests for ScriptEditor, Teleprompter
- Mock SpeechRecognition API for deterministic tests
- Accessibility linting (eslint-plugin-jsx-a11y)

**Outputs**: Test infrastructure, test suites, CI-ready test commands.

### Agent Interaction Model
```
                    Architect Agent
                   /    |    |    \
                  /     |    |     \
           Voice   Script   Display  UX/Responsive
           Agent    Mgmt     Agent   Agent
              \      |   \    /      /
               \     |    \  /     /
          TS Migration + Testing/Quality Agents
```

---

## 2. How Agents Work Together (Coordination Protocol)

### 2.1 Shared Contracts (The "API" Between Agents)

Agents don't communicate directly. Instead, they coordinate through **shared artifacts in the codebase**:

| Artifact | Purpose | Created By | Used By |
|----------|---------|------------|---------|
| `src/types/index.ts` | All TypeScript interfaces (Script, Speaker, Section, SpeechState, etc.) | Architect Agent | ALL agents |
| `src/contexts/ScriptContext.tsx` | Script data state + dispatch actions | Architect Agent | Script Mgmt, Display, Voice agents |
| `src/contexts/SessionContext.tsx` | Playback state + dispatch actions | Architect Agent | Display, Voice agents |
| CSS custom properties in `index.css` | Design tokens (colors, spacing, breakpoints) | UX Agent | ALL frontend agents |
| `src/hooks/useScrollEngine.ts` | Scroll control interface | Voice Agent | Display Agent |

**Rule**: Before an agent writes code, it must check if the types and interfaces it depends on already exist. If they don't, the Architect Agent must create them first.

### 2.2 Execution Model

Each agent runs as a **separate Claude Code session** (or subagent). They operate on the **same Git branch** and the **same codebase**. Coordination happens through:

1. **Sequential gates**: Phase 0 must complete before Phase 1A/1C can start. Phase 1A must complete before Phase 1B.
2. **File ownership**: Each agent "owns" specific files and only modifies those. Prevents merge conflicts.
3. **Type contracts**: The Architect Agent defines all shared types FIRST. Other agents code against those types.
4. **Verification after each phase**: Run `tsc --noEmit` (type check), `npx vitest` (tests), and `npm run dev` (dev server) before starting the next phase.

### 2.3 File Ownership Map

| Agent | Files Owned (creates/modifies) | Files Read-Only |
|-------|-------------------------------|-----------------|
| Architect | `types/`, `contexts/`, `App.tsx`, folder structure | — |
| Voice/Speech | `hooks/useSpeechRecognition.ts`, `hooks/useVoiceScroll.ts`, `hooks/useScrollEngine.ts`, `utils/voiceMatch.ts` | `types/`, `contexts/` |
| Script Management | `components/ScriptEditor.tsx`, `components/SpeakerManager.tsx`, `hooks/useSpeakers.ts`, `hooks/useScriptStorage.ts` | `types/`, `contexts/` |
| Display | `components/Teleprompter.tsx`, `components/ScriptRenderer.tsx` | `types/`, `contexts/`, `hooks/useScrollEngine.ts` |
| UX/Responsive | All `.css` files, `index.css` (design tokens) | Component `.tsx` files (reads for class names) |
| TS Migration | `tsconfig.json`, `vite.config.ts`, renames `.jsx` → `.tsx` | — |
| Testing | `__tests__/`, `vitest.config.ts`, test setup files | All source files (read to write tests) |

### 2.4 Handoff Protocol

When one agent finishes and the next depends on it:

1. **Agent A completes** → commits to branch with descriptive message
2. **Verify gate**: Run type check + tests + dev server. Must all pass.
3. **Agent B starts** → reads Agent A's outputs (types, hooks, components) as its input context
4. **If conflicts arise**: The Architect Agent resolves — it has authority over shared interfaces

### 2.5 Parallel Execution Rules

- **Agents in the same phase CAN run in parallel** only if they own different files (see ownership map)
- **Phase 1A (Voice) and Phase 1C (Responsive)** can run in parallel — zero file overlap
- **Phase 2A (Multi-Speaker) and Phase 2B (Responsive)** can run in parallel — CSS vs. TSX file split
- **Never run two agents that modify the same file** simultaneously

### 2.6 Conflict Resolution

If two agents need to modify the same file (e.g., `Teleprompter.tsx`):
1. **First agent writes the base** (whoever's phase comes first)
2. **Second agent extends it** (reads what's there, adds its piece)
3. The Architect Agent reviews and resolves any structural conflicts

### 2.7 Quality Gates Between Phases

| Transition | Gate Checks |
|------------|-------------|
| Phase 0 → Phase 1 | `tsc --noEmit` passes, `npm run dev` loads, all types defined |
| Phase 1A → Phase 1B | Voice matching unit tests pass, `useSpeechRecognition` hook compiles |
| Phase 1B → Phase 2 | Voice scroll works end-to-end on dev server, mode toggle functional |
| Phase 2 → Phase 3 | Multi-speaker editor + display work, responsive layouts verified at 375px/768px/1024px |

---

## 3. Development Principles

1. **Progressive Enhancement**: App must work fully without voice/sync. Voice-scroll enhances manual scroll. Multi-speaker enhances single-speaker. Every feature degrades gracefully.

2. **Hook-Based Architecture**: All complex logic in custom hooks, not component bodies. Components are thin render layers. Enables independent testing.

3. **Browser API Abstraction**: Wrap `SpeechRecognition`, `WebRTC`, `MediaDevices` behind hooks. Enables mocking, browser-difference handling, and fallbacks.

4. **Forward-Only Matching**: Voice scroll cursor only moves forward in the script, never backward. Prevents jitter from recognition errors.

5. **Mobile-First CSS**: Base styles for smallest screens, `min-width` media queries for larger. CSS custom properties for all shared values.

6. **No Premature Dependencies**: Prefer Context API over Redux, plain CSS over Tailwind, native APIs over wrappers. Add packages only when demonstrably needed.

7. **Performance Discipline**: Single `requestAnimationFrame` loop (not competing ones). Debounce speech callbacks. Use refs for hot-path state. `React.memo` for section rendering.

8. **Feature Detection**: Check for API availability at runtime (`window.SpeechRecognition || window.webkitSpeechRecognition`), never browser-sniff.

---

## 4. Development Phases

### Phase 0: Foundation + TypeScript Migration (blocks everything)
**Agents**: Architect, TS Migration, Testing
**Files**: All existing `.jsx` → `.tsx`, new `contexts/`, `hooks/`, `utils/`, `types/`

1. Add TypeScript to the project (`tsconfig.json`, update Vite config)
2. Convert all existing `.jsx` files to `.tsx` with proper typing
3. Define shared types in `src/types/`:
   ```ts
   interface Speaker { id: string; name: string; color: string }
   interface ScriptSection { id: string; speakerId: string | null; content: string; order: number }
   interface Script { id: string; title: string; sections: ScriptSection[]; speakers: Speaker[] }
   interface SpeechState { transcript: string; isListening: boolean; confidence: number; error: string | null }
   interface ScrollEngineState { mode: 'constant' | 'voice'; position: number; isActive: boolean; progress: number }
   ```
4. Create `ScriptContext` (script data CRUD) and `SessionContext` (playback state) with typed reducers
5. Refactor `App.tsx` to use context providers
6. Set up Vitest + React Testing Library (with TS support)
7. Build migration utility: plain string ↔ structured script
8. Establish folder structure and CSS custom properties in `index.css`

### Phase 1A: Voice Recognition Foundation (HIGH PRIORITY, parallel with 1C)
**Agents**: Voice Agent, Testing Agent

1. Build `useSpeechRecognition` hook (`src/hooks/useSpeechRecognition.ts`)
   - Wraps Web Speech API with browser compat (`SpeechRecognition` / `webkitSpeechRecognition`)
   - Handles continuous mode, interim results, auto-restart on silence
   - Microphone permissions, error states, graceful fallback
   - Returns typed `SpeechState`
2. Build text-matching algorithm (`src/utils/voiceMatch.ts`)
   - Forward-only sliding window with Levenshtein/edit distance
   - Normalize text (lowercase, strip punctuation)
   - Confidence threshold to ignore bad matches
   - Returns matched word index + confidence
3. Write comprehensive unit tests for matching algorithm (edge cases: repeated words, filler words, misrecognitions)
4. Build debug overlay showing recognized text and matched position

### Phase 1B: Voice-Driven Scroll Integration (requires 1A)
**Agents**: Voice Agent, Display Agent

1. Build `useVoiceScroll` hook (recognition + matching → scroll target with smooth interpolation)
2. Build `useScrollEngine` hook (unified constant-speed vs. voice-driven, single `requestAnimationFrame` loop)
3. Refactor `Teleprompter.tsx` to use `useScrollEngine` instead of inline scroll logic
4. Add mode toggle in controls (constant speed vs. voice-driven)
5. Add microphone status indicator and current-word highlighting

### Phase 2A: Script Management + Multi-Speaker (after voice scroll works)
**Agents**: Script Management Agent, UX Agent

1. Build `useSpeakers` hook and `SpeakerManager` component
2. Refactor `ScriptEditor.tsx` to structured section editor with paragraph-based speaker assignment
3. Build `useScriptStorage` for localStorage persistence
4. Build `ScriptRenderer` component (color-coded sections, speaker labels)
5. Integrate multi-speaker display into `Teleprompter.tsx`
6. Add "current speaker" indicator

### Phase 2B: Responsive Design (parallel with 2A)
**Agents**: UX/Responsive Agent

1. Extract colors to CSS custom properties on `:root`
2. Add tablet breakpoints to `ScriptEditor.css` and `Teleprompter.css`
3. Tablet: wider editor (800px+), side-by-side settings, larger controls
4. Fix touch targets (40px → 44px), safe area insets, landscape orientation
5. Define speaker color palette (8 high-contrast colors, WCAG AA on dark bg)

### Phase 3: Polish & Integration
**Agents**: Testing, UX, All

1. Cross-browser testing (Chrome Android, Safari iOS, Chrome/Safari desktop)
2. Performance profiling (60fps with voice active)
3. Error state UX (mic denied, API unavailable)
4. Onboarding/help UI for new features
5. PWA setup (manifest, service worker)

### Parallelization Diagram
```
Phase 0 (Foundation + TS) ────────┐
                                   ├─> Phase 1A (Voice Recognition) ─> Phase 1B (Voice Scroll Integration)
                                   │                                          │
                                   │                                   ┌──────┘
                                   │                                   ├─> Phase 2A (Multi-Speaker)
                                   └───────────────────────────────────├─> Phase 2B (Responsive Design)
                                                                       └─> Phase 3 (Polish)
```
**Voice scroll is the critical path**: Phase 0 → 1A → 1B → 2A/2B → 3

---

## 5. Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript (.tsx) | Type safety for complex data models, catches bugs at compile time |
| State management | `useReducer` + Context (2 contexts) | App is small enough; avoids external deps |
| Speech API | Native Web Speech API | Free, no server, works in Chrome + partial Safari |
| Text matching | Forward-only sliding window + Levenshtein | Testable pure logic, prevents scroll jitter |
| Scroll control | Single unified `useScrollEngine` | Replaces inline logic, avoids competing animation loops |
| Multi-speaker | Single device only, sections color-coded | No network infra needed; covers primary use case |
| CSS approach | Plain CSS + custom properties | Consistent with existing codebase |
| Persistence | localStorage + JSON | No backend needed; import/export for sharing |

---

## 6. Key Technical Constraints

- **Web Speech API requires internet** (Chrome sends audio to Google servers)
- **Safari limits**: May not support `continuous: true` reliably; needs "tap to re-listen" fallback
- **Firefox**: No Speech API support — falls back to constant-speed scroll
- **iOS PWA**: Web Speech API may not work in standalone mode — document limitation
- **Single animation loop**: Voice scroll must feed into the same `requestAnimationFrame` loop, not create a second one

---

## 7. Critical Files to Modify

| File | Changes |
|------|---------|
| `src/App.jsx` → `src/App.tsx` | Migrate to TS, refactor to context providers, structured script state |
| `src/main.jsx` → `src/main.tsx` | Migrate to TS |
| `src/components/Teleprompter.jsx` → `.tsx` | Migrate to TS, replace scroll logic (lines 29-52) with `useScrollEngine`, render structured sections |
| `src/components/ScriptEditor.jsx` → `.tsx` | Migrate to TS, transform to structured section editor with speakers |
| `src/components/ScriptEditor.css` | Remove 600px max-width constraint, add responsive breakpoints |
| `src/components/Teleprompter.css` | Add speaker-color styles, responsive tablet layout |
| `src/index.css` | Add CSS custom properties for design tokens |
| NEW `src/types/index.ts` | Shared type definitions (Script, Speaker, Section, SpeechState, etc.) |
| NEW `src/hooks/useSpeechRecognition.ts` | Web Speech API wrapper hook |
| NEW `src/hooks/useVoiceScroll.ts` | Speech → scroll position mapping |
| NEW `src/hooks/useScrollEngine.ts` | Unified scroll controller (constant + voice modes) |
| NEW `src/utils/voiceMatch.ts` | Text matching algorithm (forward-only, fuzzy) |
| NEW `src/contexts/ScriptContext.tsx` | Structured script state + reducer |
| NEW `src/contexts/SessionContext.tsx` | Playback/voice/scroll state + reducer |
| NEW `tsconfig.json` | TypeScript configuration |

---

## 8. Agent Management & Failure Recovery

### 8.1 How Agents Are Technically Managed

Each "agent" is a **Claude Code subagent** launched via the `Agent` tool from a **Project Manager (PM) session** — that's this session. The PM:

- **Orchestrates**: Decides which agent to launch, when, and with what prompt
- **Monitors**: Reads each agent's output when it completes
- **Verifies**: Runs quality gate checks (type check, tests, dev server) between phases
- **Decides**: Determines if the output is good enough to proceed or needs rework

```
┌─────────────────────────────────────────────────┐
│              PM Session (this session)           │
│  - Holds the master plan                         │
│  - Launches agents sequentially per phase        │
│  - Runs verification gates between phases        │
│  - Tracks progress via git commits + todo list   │
└──────┬──────────┬──────────┬──────────┬─────────┘
       │          │          │          │
       v          v          v          v
   Architect   Voice     Script     UX/Responsive
   Agent       Agent     Mgmt Agent Agent
   (subagent)  (subagent) (subagent)  (subagent)
```

**Each agent receives**:
1. A detailed prompt describing exactly what to build
2. The file ownership rules (which files to create/modify)
3. The type contracts to code against (from `src/types/index.ts`)
4. Explicit instructions to commit work before finishing

**Each agent returns**:
1. A summary of what was built
2. Files created/modified
3. Any issues or decisions made

### 8.2 Progress Tracking

Progress is tracked through **three mechanisms**:

1. **Git commits**: Each agent commits its work with descriptive messages. If a session dies, committed work is preserved.
2. **Todo list**: The PM maintains a todo list tracking which tasks within each phase are complete.
3. **Quality gates**: Between phases, the PM runs automated checks:
   - `tsc --noEmit` — TypeScript compiles
   - `npx vitest --run` — tests pass
   - `npm run dev` — app starts without errors
   - `npm run lint` — no lint errors

### 8.3 Handling Token Exhaustion / Session Interruption

This is the most critical failure mode. Here's the recovery protocol:

**Prevention: Small, Committed Units of Work**
- Each agent is scoped to a **single, well-defined task** (e.g., "build the voice matching algorithm and its tests")
- Agents are instructed to **commit early and often** — after each meaningful piece of work, not just at the end
- Each phase is broken into sub-tasks small enough to complete within a single agent session

**Recovery When an Agent Runs Out of Tokens Mid-Task**:

1. **Check what was committed**: Run `git log --oneline -10` and `git diff` to see what the interrupted agent completed vs. what's uncommitted
2. **Stash or commit partial work**: If there's uncommitted but useful work, commit it as `WIP: [description]`
3. **Launch a new agent to continue**: Give it a prompt that says:
   - "You are continuing work that was interrupted. Here's what's already done: [git log summary]. Here's what remains: [remaining tasks]. Pick up from where the previous agent left off."
   - Include the file paths the previous agent was working on
4. **The new agent reads existing code** before writing — it sees the committed state and continues

**Recovery When the PM Session Itself Runs Out of Tokens**:

1. A new PM session can be started at any time
2. The PM reads the plan file (`/root/.claude/plans/rosy-jumping-tome.md`) to restore context
3. The PM runs `git log --oneline -20` to see what's been completed
4. The PM runs the quality gates to verify the current state
5. The PM resumes orchestration from wherever the previous PM left off

**This works because all state is in the codebase, not in any agent's memory.**

### 8.4 Agent Prompt Template

Every agent is launched with this structure:

```
You are the [ROLE] Agent for the Auto-Teleprompter project.

## Your Task
[Specific deliverables for this agent]

## Files You Own (create/modify)
[List of files]

## Files You Must Read First (do NOT modify)
[List of shared contract files — types, contexts, etc.]

## Constraints
- Commit your work after each meaningful piece (not just at the end)
- Use descriptive commit messages prefixed with the phase: "phase-1a: add voice matching algorithm"
- Do NOT modify files outside your ownership list
- Code against the types in src/types/index.ts
- Run `tsc --noEmit` before your final commit to ensure types are correct

## Current State
[Git log summary, what other agents have already built]
```

### 8.5 Monitoring Checklist (PM runs after each agent)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Agent committed work? | `git log --oneline -5` | New commits visible |
| Types still compile? | `npx tsc --noEmit` | Exit code 0 |
| Tests pass? | `npx vitest --run` | All green |
| App starts? | `npm run dev` (check for errors) | No compile errors |
| Lint clean? | `npm run lint` | No errors |
| Files within ownership? | `git diff --name-only HEAD~N` | Only expected files changed |

### 8.6 Rollback Strategy

If an agent produces broken or incorrect work:
1. **Identify the last good commit**: `git log --oneline`
2. **Revert**: `git revert <bad-commit>` (safe, creates new commit) — NOT `git reset --hard`
3. **Re-launch the agent** with updated instructions addressing what went wrong
4. **Never lose work**: Always revert, never force-reset

---

## 9. Verification Plan

1. **Unit tests**: Run `npx vitest` — voice matching algorithm tests must pass
2. **Dev server**: Run `npm run dev` — verify editor and teleprompter work on phone and tablet viewports
3. **Voice scroll**: Test on Chrome Android with microphone — scroll should follow speaking pace
4. **Multi-speaker**: Create script with 2+ speakers, verify color-coded display in editor and teleprompter
5. **Fallback**: Test on Firefox — should gracefully show manual scroll only
6. **Responsive**: Test at 375px, 768px, and 1024px widths
7. **Lint**: Run `npm run lint` — no errors
