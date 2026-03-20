# /scaffold-store — Generate New Pinia Store

Scaffold a new Pinia store for **Spine Viewer Pro** following project conventions.

## Step 1 — Collect info (if not provided)

Ask in one message:
1. Store name? (e.g., `useCompareStore` → file `useCompareStore.ts`)
2. What state does it manage? (list fields + types)
3. What actions does it need?
4. Does it persist to `localStorage`? (yes/no — which keys?)

## Step 2 — Generate

Create the file at `src/core/stores/use<Name>Store.ts`:

```typescript
/**
 * @file use<Name>Store.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'

export const use<Name>Store = defineStore('<name>', () => {
  // --- State ---
  // const field = ref<Type>(defaultValue)

  // --- Getters ---
  // const derived = computed(() => ...)

  // --- Actions ---
  // function doSomething() { ... }

  return {
    // expose state, getters, actions
  }
})
```

**Rules:**
- Always use **composition API style** (`() => { ... }`) — not options API
- `defineStore` and `ref`/`computed` are auto-imported — no manual imports needed
- If localStorage persistence is needed, use `localStorage.getItem` in the init expression and `watch` to persist on change
- localStorage key format: `svp:<feature>:<key>` (e.g., `svp:compare:panelPos`)
- Store ID (first arg to `defineStore`) must be unique — use camelCase: `'compare'`, `'animation'`, etc.
- Keep store focused — one store per feature/domain

**localStorage persistence pattern:**
```typescript
const panelPos = ref<'left' | 'right' | 'bottom'>(
  (localStorage.getItem('svp:feature:panelPos') as 'left' | 'right' | 'bottom') ?? 'right'
)
watch(panelPos, v => localStorage.setItem('svp:feature:panelPos', v))
```

## Step 3 — Report

Tell the user:
- File path created
- Usage: `const store = use<Name>Store()`
- Any next steps (use in component, add to index if needed)
