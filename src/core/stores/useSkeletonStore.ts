/**
 * @file useSkeletonStore.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'
import type { BoneInfo, SlotInfo, EventInfo } from '@/core/types/ISpineAdapter'

export const useSkeletonStore = defineStore('skeleton', () => {
  const animations   = ref<string[]>([])
  const skins        = ref<string[]>([])
  const bones        = ref<BoneInfo[]>([])
  const slots        = ref<SlotInfo[]>([])
  const events       = ref<EventInfo[]>([])
  const selectedBone    = ref<string | null>(null)
  const selectedSlot    = ref<string | null>(null)
  const syncSelection   = ref(true)

  const isLoaded = computed(() => animations.value.length > 0)

  function selectBone(name: string | null): void {
    selectedBone.value = selectedBone.value === name ? null : name
  }

  function selectSlot(name: string | null): void {
    selectedSlot.value = selectedSlot.value === name ? null : name
  }

  function populate(data: {
    animations: string[]
    skins: string[]
    bones: BoneInfo[]
    slots: SlotInfo[]
    events: EventInfo[]
  }) {
    animations.value = data.animations
    skins.value      = data.skins
    bones.value      = data.bones
    slots.value      = data.slots
    events.value     = data.events
  }

  function clear() {
    animations.value   = []
    skins.value        = []
    bones.value        = []
    slots.value        = []
    events.value       = []
    selectedBone.value = null
    selectedSlot.value = null
  }

  return { animations, skins, bones, slots, events, isLoaded, selectedBone, selectBone, selectedSlot, selectSlot, syncSelection, populate, clear }
})
