# /compare-step — Implement Next Compare Feature Step

Find and implement the next incomplete step from `COMPARE_PLAN.md`.

## Process

1. Read `COMPARE_PLAN.md` from the project root.
   - Find the **Implementation Order** table at the bottom.
   - Cross-reference with git log / existing files to determine which steps are done.
   - Identify the **first incomplete step**.

2. **Launch Explore agent** to read all relevant existing files for context:
   - Files listed in "Modified Files" section of the plan
   - Any existing files from the same directory as new files to be created
   - `src/core/types/ISpineAdapter.ts` and `src/core/types/IPixiApp.ts` for interface contracts

3. **Present the plan** for this step to the user:
   - What files will be created / modified
   - Key interfaces or types that will be introduced
   - Any architectural decisions or potential issues

4. **After user approval** — implement:
   - Follow all conventions in `COMPARE_PLAN.md` and `CLAUDE.md`
   - Every new `.ts` file gets a JSDoc header, every new `.vue` gets an HTML comment header
   - Use exact types from the plan (do not simplify or skip fields)

5. Run `/check` after implementation.

6. Report: "✅ Compare Step N done — `<files created/modified>`"

## Conventions specific to Compare feature

- All new files go to `src/components/compare/` (components) or `src/core/stores/` (store) or `src/core/utils/` (engine)
- Store file: `src/core/stores/useCompareStore.ts`
- Engine file: `src/core/utils/spineCompare.ts`
- localStorage key prefix: `svp:compare:`
- Component style: use existing CSS custom properties (`var(--c-bg)`, `var(--c-border)`, etc.) — do not hardcode colors except for status indicators (+green, -red, ~amber)
- Each canvas slot gets its own independent `IPixiApp` + `ISpineAdapter` instance
- Sync logic lives in `CompareSplitStage.vue`, not in the store

## Implementation order reference

| # | Task |
|---|------|
| 1 | Navigation — new `compare` page state in `App.vue` |
| 2 | Entry point buttons in `VersionPickerPage.vue` + `ViewerPage.vue` |
| 3 | `useCompareStore` |
| 4 | `spineCompare.ts` — JSON comparison |
| 5 | `spineCompare.ts` — runtime comparison |
| 6 | `spineCompare.ts` — placeholder extraction |
| 7 | `CompareCanvasSlot.vue` |
| 8 | `CompareSplitStage.vue` |
| 9 | `CompareDiffSection.vue` |
| 10 | `CompareDiffPanel.vue` |
| 11 | `CompareFileSlot.vue` |
| 12 | `CompareToolbar.vue` |
| 13 | `ComparePage.vue` |
