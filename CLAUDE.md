# Spine Viewer Pro — Claude Instructions

## Project

Browser-based Spine skeletal animation viewer. Vue 3 + TypeScript + Vite 5 + Pinia + Naive UI + Pixi.js 7 & 8.

Full architecture, progress, and conventions in `MEMORY.md` at:
`C:\Users\akarpus\.claude\projects\D--tools-spine-viewer-spine-viewer-pro\memory\MEMORY.md`

---

## Slash Commands (Skills)

Use these commands to avoid repetitive setup work:

| Command | When to use |
|---------|-------------|
| `/check` | After any implementation — verify TypeScript + build |
| `/dev` | Start the Vite dev server |
| `/next-step` | Implement the next incomplete step from `PLAN.md` |
| `/compare-step` | Implement the next incomplete step from `COMPARE_PLAN.md` |
| `/scaffold-component` | Create a new Vue SFC with proper headers and structure |
| `/scaffold-store` | Create a new Pinia store with proper structure |
| `/git-checkpoint` | Stage and commit current progress |

**Trigger rules:**
- Say "зроби компонент" / "новий компонент" / "create component" → `/scaffold-component`
- Say "зроби стор" / "новий стор" / "create store" → `/scaffold-store`
- Say "збережи прогрес" / "зроби коміт" / "commit" → `/git-checkpoint`
- Say "наступний крок" / "next step" (без уточнення) → `/next-step`
- Say "наступний крок compare" / "continue compare" → `/compare-step`

---

## Subagents — When to Use

### Explore agent
Use **proactively** before writing code that touches unfamiliar parts of the codebase.

| Trigger | What to explore |
|---------|----------------|
| Modifying an adapter | Read all adapter files in `src/adapters/` to understand the pattern |
| Adding a new panel tab | Read existing panel components in `src/components/panels/` |
| Touching `ISpineAdapter` | Read all adapter implementations to check impact |
| Implementing Compare steps 7–13 | Read `CompareSplitStage.vue` + `useCompareStore.ts` before adding components |

**Quick searches** (Glob/Grep directly, no agent needed):
- Finding a specific file → `Glob`
- Finding where a type is used → `Grep`
- Reading 1–3 specific files → `Read`

### Plan agent
Use when the task is complex and architectural decisions matter before writing code.

| Trigger | What to plan |
|---------|-------------|
| Starting a new Compare step that touches 3+ files | Full implementation plan with order + pitfalls |
| Adding a new feature that spans stores + components + adapters | Interface design + integration points |
| Unsure about sync mechanism or state flow | Explicit data flow diagram before coding |

**Do NOT** use Plan agent for:
- Simple component additions
- CSS fixes
- Single-file changes

### General-purpose agent
Use when a search requires multiple rounds (Glob → Grep → Read → Grep again).

| Trigger | Example |
|---------|---------|
| "Find where X is called across the whole project" | `getAnimationNames()` usage |
| "Check if there are any TypeScript errors related to Y" | After a type refactor |

---

## Code Conventions

### File headers (required for every new file)

`.ts` files:
```typescript
/**
 * @file filename.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */
```

`.vue` files:
```vue
<!--
 * @file ComponentName.vue
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
-->
```

### Vue components
- Always `<script setup lang="ts">` — never Options API
- Auto-imports: `ref`, `computed`, `watch`, `onMounted`, `defineStore` — no manual Vue/Pinia imports
- Naive UI components auto-imported — no manual imports
- Use `<style scoped>` unless sharing styles is required

### Stores (`src/core/stores/`)
- Composition API style only: `defineStore('id', () => { ... })`
- localStorage keys: `svp:<feature>:<key>`

### Adapters
- Never import `pixi7` and `pixi8` in the same file
- Pixi7 adapters: `import * as PIXI from 'pixi.js'` (NOT `pixi7` alias)
- Pixi8 adapters: `import * as PIXI from 'pixi8'`

### CSS
- Use CSS custom properties: `var(--c-bg)`, `var(--c-text)`, `var(--c-border)`, `var(--c-surface)`, `var(--c-text-muted)`, `var(--c-text-dim)`, `var(--c-text-ghost)`
- Do not hardcode dark-mode colors except for status indicators (green/red/amber)

---

## After Every Implementation Step

1. Run `/check` — fix any TypeScript errors before moving on
2. Run `/git-checkpoint` if the step is complete and working
3. Update `MEMORY.md` progress section if a plan step is done
