<!--
 * @file CompareCanvasSlot.vue
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
-->

<template>
  <div
    class="canvas-slot"
    :class="{
      'canvas-slot--empty': !currentFileSet,
      'canvas-slot--drag':  isDragging,
    }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <!-- Canvas -->
    <canvas ref="canvasRef" class="slot-canvas" />

    <!-- Empty state (shown over canvas when no file) -->
    <div v-if="!currentFileSet" class="empty-state">
      <span class="empty-icon">{{ isDragging ? '⬇' : '○' }}</span>
      <span class="empty-label">{{ isDragging ? 'Drop Spine files' : 'No file loaded' }}</span>
      <span class="empty-hint">Drop files here or use the toolbar selector</span>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <span class="loading-text">Loading…</span>
    </div>

    <!-- Error state -->
    <div v-if="loadError" class="error-overlay">
      <span class="error-text">{{ loadError }}</span>
    </div>

    <!-- Control bar -->
    <div class="control-bar">
      <span class="slot-side-badge">{{ side === 'left' ? 'A' : 'B' }}</span>

      <template v-if="adapter">
        <!-- Animation selector -->
        <select
          class="anim-select"
          :value="currentAnimName"
          @change="onAnimChange"
        >
          <option v-if="!currentAnimName" value="" disabled>— select animation —</option>
          <option v-for="name in animationNames" :key="name" :value="name">{{ name }}</option>
        </select>

        <!-- Play / Pause (master only) -->
        <template v-if="isMaster">
          <button class="ctrl-btn" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
        </template>
        <template v-else>
          <span class="sync-badge" :class="{ 'sync-badge--on': syncEnabled }">
            {{ syncEnabled ? '↔' : '—' }}
          </span>
        </template>

        <!-- Current time -->
        <span class="time-display">{{ timeDisplay }}</span>

        <!-- FPS -->
        <span class="fps-display">{{ fps }} FPS</span>
      </template>
      <template v-else>
        <span class="empty-bar-hint">—</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IPixiApp } from '@/core/types/IPixiApp'
import type { ISpineAdapter } from '@/core/types/ISpineAdapter'
import type { FileSet } from '@/core/types/FileSet'
import { createPixiApp, createSpineAdapter } from '@/core/AdapterFactory'
import { useVersionStore } from '@/core/stores/useVersionStore'
import { useCompareStore } from '@/core/stores/useCompareStore'

// ── Props ──────────────────────────────────────────────────────────────────────

const props = defineProps<{
  side:        'left' | 'right'
  fileSet:     FileSet | null
}>()

// ── Refs ───────────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)

const pixiApp  = ref<IPixiApp | null>(null)
const adapter  = ref<ISpineAdapter | null>(null)

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isDragging = ref(false)

const currentAnimName = ref<string | null>(null)
const isPlaying       = ref(false)
const fps             = ref(0)
const currentTime     = ref(0)
const animDuration    = ref(0)

// ── Stores ─────────────────────────────────────────────────────────────────────

const versionStore = useVersionStore()
const compareStore = useCompareStore()

// ── Computed ───────────────────────────────────────────────────────────────────

const animationNames = computed(() => adapter.value?.animations ?? [])
const isMaster       = computed(() => compareStore.masterSide === props.side)
const syncEnabled    = computed(() => compareStore.syncEnabled)

const timeDisplay = computed(() => {
  const t = currentTime.value
  const d = animDuration.value
  return `${t.toFixed(2)}s${d > 0 ? ` / ${d.toFixed(2)}s` : ''}`
})

const currentFileSet = computed(() => props.fileSet)

// ── Pixi app lifecycle ─────────────────────────────────────────────────────────

onMounted(async () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const w = canvas.parentElement?.clientWidth  || 400
  const h = canvas.parentElement?.clientHeight || 400
  try {
    if (!versionStore.pixiVersion) return
    pixiApp.value = await createPixiApp(versionStore.pixiVersion, canvas, w, h)

    // FPS ticker
    pixiApp.value.ticker.add(() => {
      fps.value = Math.round(pixiApp.value!.ticker.FPS)
      if (adapter.value) {
        const states = adapter.value.getTrackStates()
        const t0 = states.find(s => s.trackIndex === 0)
        if (t0) {
          currentTime.value = t0.time
          animDuration.value = t0.duration
        }
      }
    })

    // ResizeObserver
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry && pixiApp.value) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) pixiApp.value.resize(width, height)
      }
    })
    ro.observe(canvas.parentElement ?? canvas)
    onUnmounted(() => ro.disconnect())
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to initialize canvas'
  }
})

onUnmounted(() => {
  destroyAdapter()
  pixiApp.value?.destroy()
  pixiApp.value = null
})

// ── Watch fileSet prop ─────────────────────────────────────────────────────────

watch(
  () => props.fileSet,
  async (fileSet) => {
    if (!fileSet) {
      destroyAdapter()
      return
    }
    await loadFileSet(fileSet)
  },
)

// ── Load / destroy ─────────────────────────────────────────────────────────────

async function loadFileSet(fileSet: FileSet) {
  if (!pixiApp.value) return
  destroyAdapter()

  isLoading.value = true
  loadError.value = null

  try {
    if (!versionStore.pixiVersion || !versionStore.spineVersion) return
    const newAdapter = await createSpineAdapter(versionStore.pixiVersion, versionStore.spineVersion)
    await newAdapter.load(fileSet)
    newAdapter.mount(pixiApp.value.stage)
    adapter.value = newAdapter

    // Start first animation
    const anims = newAdapter.animations
    if (anims.length > 0) {
      currentAnimName.value = anims[0]
      newAdapter.setAnimation(0, anims[0], true)
      isPlaying.value = true
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load spine'
  } finally {
    isLoading.value = false
  }
}

function destroyAdapter() {
  if (!adapter.value) return
  adapter.value.destroy()
  adapter.value = null
  currentAnimName.value = null
  isPlaying.value = false
  currentTime.value = 0
  animDuration.value = 0
}

// ── Control handlers ───────────────────────────────────────────────────────────

function togglePlay() {
  if (!adapter.value || !isMaster.value) return
  isPlaying.value = !isPlaying.value
  adapter.value.setTimeScale(isPlaying.value ? 1 : 0)
}

function onAnimChange(e: Event) {
  const name = (e.target as HTMLSelectElement).value
  if (!adapter.value || !name) return
  currentAnimName.value = name
  adapter.value.setAnimation(0, name, true)
  isPlaying.value = true
}

// ── Public methods (exposed) ───────────────────────────────────────────────────

function getTrackTime(): number {
  if (!adapter.value) return 0
  const states = adapter.value.getTrackStates()
  return states.find(s => s.trackIndex === 0)?.time ?? 0
}

function seekToTime(time: number) {
  adapter.value?.seekTo(0, time)
}

// ── Drag-and-drop (direct file load) ──────────────────────────────────────────

async function onDrop(e: DragEvent) {
  isDragging.value = false
  if (!e.dataTransfer) return
  const files = Array.from(e.dataTransfer.files)
  if (files.length === 0) return
  const { error } = await compareStore.loadDirect(props.side, files)
  if (error) loadError.value = error
}

// ── Sync methods (called by CompareSplitStage) ─────────────────────────────────

/** Set animation by name — called on secondary when master changes animation */
function setAnimationByName(name: string) {
  if (!adapter.value) return
  const hasAnim = adapter.value.animations.includes(name)
  if (hasAnim) {
    currentAnimName.value = name
    adapter.value.setAnimation(0, name, true)
  }
}

defineExpose({ adapter, pixiApp, getTrackTime, seekTo: seekToTime, setAnimationByName, getAnimationNames: () => animationNames.value })
</script>

<style scoped>
.canvas-slot {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  overflow: hidden;
}

.canvas-slot--drag {
  outline: 2px dashed #7c6af5;
  outline-offset: -2px;
}

.slot-canvas {
  flex: 1;
  min-height: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  position: absolute;
  inset: 0 0 36px 0; /* above control bar */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.empty-icon {
  font-size: 2rem;
  color: var(--c-text-ghost);
  line-height: 1;
}

.empty-label {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  font-weight: 500;
}

.empty-hint {
  font-size: 0.72rem;
  color: var(--c-text-ghost);
}

/* ── Loading / error overlay ─────────────────────────────────────── */
.loading-overlay,
.error-overlay {
  position: absolute;
  inset: 0 0 36px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  pointer-events: none;
}

.loading-text { color: var(--c-text-muted); }
.error-text   { color: #f87171; }

/* ── Control bar ─────────────────────────────────────────────────── */
.control-bar {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-top: 1px solid var(--c-border-dim);
  background: var(--c-surface);
}

.slot-side-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--c-raised);
  color: var(--c-text-muted);
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.anim-select {
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  background: var(--c-raised);
  border: 1px solid var(--c-border-dim);
  border-radius: 4px;
  color: var(--c-text-dim);
  padding: 2px 6px;
  height: 24px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ctrl-btn {
  background: none;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  color: var(--c-text-muted);
  font-size: 0.75rem;
  padding: 2px 8px;
  cursor: pointer;
  height: 24px;
  flex-shrink: 0;
}

.ctrl-btn:hover {
  border-color: #7c6af5;
  color: #9d8fff;
}

.sync-badge {
  font-size: 0.72rem;
  color: var(--c-text-ghost);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  flex-shrink: 0;
}

.sync-badge--on {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.2);
}

.time-display {
  font-size: 0.7rem;
  color: var(--c-text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.fps-display {
  font-size: 0.68rem;
  color: var(--c-text-ghost);
  flex-shrink: 0;
}

.empty-bar-hint {
  font-size: 0.72rem;
  color: var(--c-text-ghost);
}
</style>
