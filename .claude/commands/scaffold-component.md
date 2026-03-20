# /scaffold-component — Generate New Vue Component

Scaffold a new Vue SFC for **Spine Viewer Pro** following project conventions.

## Step 1 — Collect info (if not provided)

Ask in one message:
1. Component name (PascalCase)?
2. Where does it go?
   - `src/components/pages/` — full pages
   - `src/components/panels/` — side panel tabs
   - `src/components/stage/` — canvas overlays
   - `src/components/compare/` — Compare feature
   - `src/components/ui/` — shared UI elements
3. What props does it accept? (name + type, or "none")
4. What events does it emit? (or "none")
5. Any Pinia stores it uses?

## Step 2 — Generate

Create the file. Template:

```vue
<!--
 * @file <ComponentName>.vue
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
-->

<template>
  <div class="<component-class>">
    <!-- TODO: implement -->
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  // TODO
}>()

// Emits
const emit = defineEmits<{
  // TODO
}>()
</script>

<style scoped>
.<component-class> {
  /* TODO */
}
</style>
```

**Rules:**
- Always `<script setup lang="ts">` — no Options API
- Auto-imports are active: `ref`, `computed`, `watch`, `onMounted` — no manual Vue imports
- Naive UI components are auto-imported — no manual imports needed
- Pinia stores: `const store = useXxxStore()` — no import needed
- Use CSS custom properties from the theme: `var(--c-bg)`, `var(--c-text)`, `var(--c-border)`, etc.
- Never import from `pixi7` and `pixi8` in the same file
- File header is required (use exact template above)

## Step 3 — Report

Tell the user:
- File path created
- How to use: `<ComponentName />` or `import ComponentName from '...'`
- Any next steps (add to parent, register props, etc.)
