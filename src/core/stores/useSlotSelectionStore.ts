/**
 * @file useSlotSelectionStore.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'
import { useFileLoaderStore } from './useFileLoaderStore'

/** Manages which spine slot is currently active and which are pinned. */
export const useSlotSelectionStore = defineStore('slot-selection', () => {
  const activeSlotId  = ref<string | null>(null)
  const pinnedSlotIds = ref<Set<string>>(new Set())

  // Cross-store join — standard Pinia setup-store pattern.
  // spineSlots is defined before this call in useFileLoaderStore's setup body.
  const fileLoader = useFileLoaderStore()

  const activeSlot = computed(() =>
    fileLoader.spineSlots.find(s => s.id === activeSlotId.value) ?? null,
  )

  function setActiveSlot(id: string): void {
    if (fileLoader.spineSlots.some(s => s.id === id)) {
      activeSlotId.value = id
    }
  }

  function setPinned(id: string, pinned: boolean): void {
    if (pinned) {
      // Child slots (parentSlotId set) live inside parent containers — never standalone-pinned.
      const slot = fileLoader.spineSlots.find(s => s.id === id)
      if (slot?.parentSlotId) return
    }
    const next = new Set(pinnedSlotIds.value)
    if (pinned) next.add(id)
    else next.delete(id)
    pinnedSlotIds.value = next
  }

  function isPinned(id: string): boolean {
    return pinnedSlotIds.value.has(id)
  }

  function clearSelection(): void {
    activeSlotId.value  = null
    pinnedSlotIds.value = new Set()
  }

  return {
    activeSlotId,
    activeSlot,
    pinnedSlotIds,
    setActiveSlot,
    setPinned,
    isPinned,
    clearSelection,
  }
})
