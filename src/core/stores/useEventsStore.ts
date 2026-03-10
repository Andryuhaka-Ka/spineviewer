/**
 * @file useEventsStore.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { defineStore } from 'pinia'
import type { SpineEvent, AnimationEventMarker } from '@/core/types/ISpineAdapter'

const MAX_LOG = 500

export interface AnimationMarkerEntry extends AnimationEventMarker {
  trackIndex: number
  animationName: string
}

export const useEventsStore = defineStore('events', () => {
  const log    = ref<SpineEvent[]>([])
  const filter = ref('')
  const paused = ref(false)

  // Static markers: which events fire in current animations (set by PreviewStage)
  const animationMarkers = ref<AnimationMarkerEntry[]>([])

  // Flash timestamps: event name → performance.now() when last fired
  const lastFiredAt = ref<Map<string, number>>(new Map())

  // Filtered + newest-first for display
  const filteredLog = computed(() => {
    const q = filter.value.toLowerCase()
    const items = q ? log.value.filter(e => e.name.toLowerCase().includes(q)) : log.value
    return [...items].reverse()
  })

  // Sorted by count desc for statistics
  const eventStats = computed((): Array<{ name: string; count: number }> => {
    const counts = new Map<string, number>()
    for (const e of log.value) {
      counts.set(e.name, (counts.get(e.name) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  function push(event: SpineEvent): void {
    if (paused.value) return
    log.value.push(event)
    if (log.value.length > MAX_LOG) log.value.shift()
    // Record flash timestamp
    const next = new Map(lastFiredAt.value)
    next.set(event.name, performance.now())
    lastFiredAt.value = next
  }

  function setAnimationMarkers(markers: AnimationMarkerEntry[]): void {
    animationMarkers.value = markers
  }

  function clear(): void {
    log.value = []
    lastFiredAt.value = new Map()
  }

  return {
    log, filter, paused, filteredLog, eventStats,
    animationMarkers, lastFiredAt,
    push, setAnimationMarkers, clear,
  }
})
