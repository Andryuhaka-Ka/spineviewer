/**
 * @file useSlotUIStore.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'

/** Global toolbar intent flags — shared across SpinesPanel, ViewerPage. */
export const useSlotUIStore = defineStore('slot-ui', () => {
  const globalSyncEnabled   = ref(true)
  const globalPinEnabled    = ref(false)
  const globalExpandEnabled = ref(false)

  return { globalSyncEnabled, globalPinEnabled, globalExpandEnabled }
})
