# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based Spine skeletal animation viewer. Vue 3 + TypeScript + Vite 5 + Pinia + Naive UI + Pixi.js 7 & 8.

Full architecture progress and conventions in `MEMORY.md` at:
`C:\Users\akarpus\.claude\projects\D--tools-spine-viewer-spine-viewer-pro\memory\MEMORY.md`

---

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # vue-tsc type check + Vite production build
npm run typecheck    # Type check only (no emit)
npm run preview      # Preview production build
```

No test runner is configured — verification is done via `typecheck` + manual QA.

---

## Architecture

### Pages & Navigation

`src/App.vue` controls top-level routing via a `page` ref (`'picker' | 'viewer' | 'compare'`). No Vue Router.

- `VersionPickerPage.vue` — selects Pixi version (7|8) + Spine version (3.8/4.0/4.1/4.2), handles file drag-drop + auto-detection, navigates to viewer
- `ViewerPage.vue` — toolbar + `PreviewStage.vue` + side panel tabs
- `ComparePage.vue` — side-by-side comparison mode with `CompareSplitStage.vue`

### Dual Pixi Strategy

Two Pixi.js instances coexist in one bundle:
- `pixi.js` (v7) — aliased as `pixi7` in Vite, used by Pixi7App + all `@pixi-spine/*` adapters
- `pixi8` (`npm:pixi.js@^8`) — aliased as `pixi8`, used by Pixi8App + `@esotericsoftware/spine-pixi-v8`

Two Vite plugins (`spinePixi7Redirect`, `spinePixi8Redirect`) intercept `pixi.js` imports inside `@pixi-spine/*` and `@esotericsoftware/*` respectively, forcing them to the correct alias. Both must have `enforce: 'pre'`.

**Critical rule:** Never import `pixi7` and `pixi8` aliases in the same file.

Pixi7 adapters use `import * as PIXI from 'pixi.js'` (NOT the `pixi7` alias) — sharing one pre-bundle with `@pixi-spine` prevents a duplicate `extensions` registry that breaks renderer auto-detection.

### Adapter Pattern

`src/core/AdapterFactory.ts` lazily imports adapters so both Pixi versions are never bundled in the same chunk:

```
createPixiApp(pixiVersion, canvas, w, h) → IPixiApp
createSpineAdapter(pixiVersion, spineVersion) → ISpineAdapter
```

Supported combos: `7-3.8`, `7-4.0`, `7-4.1`, `8-4.2`.

All adapters implement `ISpineAdapter` (`src/core/types/ISpineAdapter.ts`) — components never touch Spine or Pixi APIs directly. `BasePixi7Adapter` (`src/adapters/pixi7/`) is the shared Pixi7 base; subclasses inject their `spineModule`.

### State Management

All stores live in `src/core/stores/`. Key stores:
- `useVersionStore` — PixiVersion (7|8), SpineVersion, persisted to localStorage
- `useLoaderStore` — pending file sets, classification state
- `useViewerStore` — bgColor, zoom, posX, posY
- `useAnimationStore` — track state, playback controls
- `useSkeletonStore` — bones, slots, skins, inspector state
- `useCompareStore` — compare mode slots and diff state

localStorage keys use the prefix `svp:<feature>:<key>`.

### File Loading Flow

1. User drops files → `src/core/utils/fileLoader.ts` classifies them into `FileSet` (`skeleton + atlas + images[]`)
2. `versionDetector.ts` parses the JSON/binary to suggest a Spine version
3. `spineValidator.ts` validates the FileSet before loading
4. `PreviewStage.vue` receives the `FileSet`, calls `AdapterFactory` to build the adapter, then calls `adapter.load(fileSet)` + `adapter.mount(container)`

### Panel Tabs (ViewerPage)

Tabs rendered in `ViewerPage.vue`: Anim · Skeleton · Inspector · Events · Atlas · Perf · Compl · Export. Each tab is a separate component in `src/components/panels/`.

---

## Slash Commands (Skills)

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
- "зроби компонент" / "новий компонент" / "create component" → `/scaffold-component`
- "зроби стор" / "новий стор" / "create store" → `/scaffold-store`
- "збережи прогрес" / "зроби коміт" / "commit" → `/git-checkpoint`
- "наступний крок" / "next step" (без уточнення) → `/next-step`
- "наступний крок compare" / "continue compare" → `/compare-step`

---

## Subagents — When to Use

**Explore agent** — use proactively before writing code that touches unfamiliar parts:
- Modifying an adapter → read all files in `src/adapters/`
- Adding a panel tab → read existing panels in `src/components/panels/`
- Touching `ISpineAdapter` → read all adapter implementations to check impact

**Quick searches** (no agent needed): single file → `Read`, type usage → `Grep`, file by name → `Glob`.

**Plan agent** — use when a task spans stores + components + adapters and architectural decisions must be made first.

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
- Naive UI components auto-imported via `unplugin-vue-components` + `NaiveUiResolver` — no manual imports
- Use `<style scoped>` unless sharing styles is required

### Stores
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

## Code Navigation Serena MCP is connected and must be used for all codebase navigation. Prefer Serena tools over reading files directly:  
- mcp__serena__get_symbols_overview — get structure of a file before reading it 
- mcp__serena__find_symbol — locate any class, method, or property by name 
- mcp__serena__find_referencing_symbols — find all callers/usages of a symbol 
- mcp__serena__search_for_pattern — pattern search across the codebase Only use the Read tool when you need the full implementation body of a specific symbol that Serena has already identified.
