<!--
 * @file SpinesPanel.vue
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
-->

<template>
  <div class="spines-panel">
    <div class="spines-list">
      <div
        v-for="slot in loaderStore.spineSlots"
        :key="slot.id"
        class="spine-item"
        :class="{
          'spine-item--active':   slot.id === loaderStore.activeSlotId,
          'spine-item--error':    !!slot.error,
          'spine-item--modified': isModified(slot),
        }"
        :title="slot.error ?? slot.name"
        @click="!slot.error && loaderStore.setActiveSlot(slot.id)"
      >
        <span class="spine-dot" />
        <span class="spine-name">{{ slot.name }}</span>
        <span
          v-if="isModified(slot) && !slot.error"
          class="spine-modified-dot"
          :title="modifiedHint(slot)"
        />
        <span v-if="slot.error" class="spine-err-badge" :title="slot.error">!</span>
      </div>
    </div>

    <div class="spines-footer">
      {{ validCount }} spine{{ validCount !== 1 ? 's' : '' }} loaded
      <template v-if="errorCount > 0">
        &middot; {{ errorCount }} error{{ errorCount !== 1 ? 's' : '' }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoaderStore } from '@/core/stores/useLoaderStore'
import { useAnimationStore } from '@/core/stores/useAnimationStore'
import { useViewerStore } from '@/core/stores/useViewerStore'
import type { SpineSlot } from '@/core/types/FileSet'

const loaderStore    = useLoaderStore()
const animationStore = useAnimationStore()
const viewerStore    = useViewerStore()

const validCount = computed(() => loaderStore.spineSlots.filter(s => !s.error).length)
const errorCount = computed(() => loaderStore.spineSlots.filter(s =>  s.error).length)

/** Returns true if the slot has been changed from its default state. */
function isModified(slot: SpineSlot): boolean {
  if (slot.error) return false

  // Active slot — read live state from stores
  if (slot.id === loaderStore.activeSlotId) {
    return (
      Object.keys(animationStore.trackPlaylists).length > 0 ||
      animationStore.speed !== 1 ||
      viewerStore.zoom !== 1 ||
      viewerStore.posX !== 0 ||
      viewerStore.posY !== 0
    )
  }

  // Inactive slot — read from saved state
  const s = slot.savedState
  if (!s) return false
  return (
    Object.keys(s.trackPlaylists).length > 0 ||
    s.speed !== 1 ||
    s.zoom !== 1 ||
    s.posX !== 0 ||
    s.posY !== 0
  )
}

/** Tooltip describing what was changed. */
function modifiedHint(slot: SpineSlot): string {
  const parts: string[] = []

  const playlists = slot.id === loaderStore.activeSlotId
    ? animationStore.trackPlaylists
    : slot.savedState?.trackPlaylists ?? {}

  const zoom = slot.id === loaderStore.activeSlotId
    ? viewerStore.zoom
    : (slot.savedState?.zoom ?? 1)

  const posX = slot.id === loaderStore.activeSlotId
    ? viewerStore.posX
    : (slot.savedState?.posX ?? 0)

  const posY = slot.id === loaderStore.activeSlotId
    ? viewerStore.posY
    : (slot.savedState?.posY ?? 0)

  const speed = slot.id === loaderStore.activeSlotId
    ? animationStore.speed
    : (slot.savedState?.speed ?? 1)

  if (Object.keys(playlists).length > 0) {
    const names = Object.values(playlists)
      .flat()
      .map(e => e.animationName)
    parts.push(`Anim: ${[...new Set(names)].join(', ')}`)
  }
  if (zoom !== 1)            parts.push(`Zoom: ${zoom.toFixed(2)}×`)
  if (posX !== 0 || posY !== 0) parts.push(`Pan: (${Math.round(posX)}, ${Math.round(posY)})`)
  if (speed !== 1)           parts.push(`Speed: ${speed}×`)

  return parts.join(' · ')
}
</script>

<style scoped>
.spines-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.spines-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.spine-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 0 6px 2px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
  min-width: 0;
}

.spine-item:hover:not(.spine-item--error) {
  background: rgba(255, 255, 255, 0.06);
}

.spine-item--active {
  background: rgba(124, 106, 245, 0.18) !important;
}

.spine-item--error {
  opacity: 0.45;
  cursor: default;
}

.spine-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  transition: background 0.12s;
}

.spine-item--active .spine-dot {
  background: #9d8fff;
}

.spine-name {
  flex: 1;
  font-size: 0.8rem;
  color: var(--c-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spine-item--active .spine-name {
  color: var(--c-text);
}

/* Modified indicator — small amber dot on the right */
.spine-modified-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  opacity: 0.8;
}

.spine-item--active .spine-modified-dot {
  opacity: 1;
}

.spine-err-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #f87171;
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 4px;
  padding: 1px 5px;
  flex-shrink: 0;
}

.spines-footer {
  padding: 8px 12px;
  font-size: 0.7rem;
  color: var(--c-text-ghost);
  border-top: 1px solid var(--c-border);
}
</style>
