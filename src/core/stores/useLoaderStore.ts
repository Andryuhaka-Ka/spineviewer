/**
 * @file useLoaderStore.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'
import { guessFileType } from '@/core/utils/fileLoader'
import type { SpineFileType, SpineSlot, SpineSlotSavedState } from '@/core/types/FileSet'

export interface PendingFileInfo {
  name: string
  size: number
  type: SpineFileType
}

/** Hard limit on simultaneously loaded spine slots */
export const SPINE_SLOTS_LIMIT = 30

export const useLoaderStore = defineStore('loader', () => {
  /** Raw File objects shown in the file list (not yet read into memory) */
  const pendingFiles = ref<File[]>([])
  /** All loaded spine slots (up to SPINE_SLOTS_LIMIT) */
  const spineSlots = ref<SpineSlot[]>([])
  /** ID of the currently active spine slot */
  const activeSlotId = ref<string | null>(null)
  /** Spine version detected from the first valid slot's skeleton */
  const detectedVersion = ref<string | null>(null)

  /** Currently active slot */
  const activeSlot = computed(() =>
    spineSlots.value.find(s => s.id === activeSlotId.value) ?? null,
  )

  /** Backward-compat: fileSet of active slot */
  const fileSet = computed(() => activeSlot.value?.fileSet ?? null)

  /** Recognised files from pendingFiles (ignores unknown extensions) */
  const pendingFileInfos = computed<PendingFileInfo[]>(() =>
    pendingFiles.value
      .map(f => ({ name: f.name, size: f.size, type: guessFileType(f.name) }))
      .filter((f): f is PendingFileInfo => f.type !== null),
  )

  const hasFiles = computed(() => pendingFiles.value.length > 0)
  const isLoaded = computed(() => spineSlots.value.some(s => !s.error))

  function setPendingFiles(files: File[]) {
    pendingFiles.value    = files
    spineSlots.value      = []
    activeSlotId.value    = null
    detectedVersion.value = null
  }

  /** Replace all slots; activates the first valid one. */
  function setSlots(slots: SpineSlot[], version: string | null) {
    spineSlots.value      = slots.slice(0, SPINE_SLOTS_LIMIT)
    detectedVersion.value = version
    const first           = spineSlots.value.find(s => !s.error)
    activeSlotId.value    = first?.id ?? null
  }

  function setActiveSlot(id: string) {
    if (spineSlots.value.some(s => s.id === id)) {
      activeSlotId.value = id
    }
  }

  function saveSlotState(id: string, state: SpineSlotSavedState) {
    const slot = spineSlots.value.find(s => s.id === id)
    if (slot) slot.savedState = state
  }

  function removeSlot(id: string) {
    const idx = spineSlots.value.findIndex(s => s.id === id)
    if (idx < 0) return
    spineSlots.value.splice(idx, 1)
    if (activeSlotId.value === id) {
      const next = spineSlots.value.find(s => !s.error)
      activeSlotId.value = next?.id ?? null
    }
  }

  function clear() {
    pendingFiles.value    = []
    spineSlots.value      = []
    activeSlotId.value    = null
    detectedVersion.value = null
  }

  return {
    pendingFiles,
    spineSlots,
    activeSlotId,
    activeSlot,
    fileSet,
    detectedVersion,
    pendingFileInfos,
    hasFiles,
    isLoaded,
    setPendingFiles,
    setSlots,
    setActiveSlot,
    saveSlotState,
    removeSlot,
    clear,
  }
})
