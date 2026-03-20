<!--
 * @file CompareDiffPanel.vue
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
-->

<template>
  <div class="diff-panel">
    <!-- Summary bar -->
    <div class="summary-bar">
      <div class="summary-labels">
        <span class="summary-spine">
          <span class="summary-badge summary-badge--a">A</span>
          {{ labelA }}
        </span>
        <span class="summary-sep">vs</span>
        <span class="summary-spine">
          <span class="summary-badge summary-badge--b">B</span>
          {{ labelB }}
        </span>
      </div>
      <div v-if="diff" class="summary-counts">
        <span class="count count--added">+{{ diff.summary.added }}</span>
        <span class="count-sep">·</span>
        <span class="count count--removed">-{{ diff.summary.removed }}</span>
        <span class="count-sep">·</span>
        <span class="count count--changed">~{{ diff.summary.changed }}</span>
        <span class="count-sep">·</span>
        <span class="source-badge">{{ diff.source === 'json-full' ? 'JSON' : 'runtime' }}</span>
      </div>
      <div v-else-if="diffStatus === 'running'" class="summary-running">Running diff…</div>
      <div v-else-if="diffStatus === 'error'" class="summary-error">{{ diffError }}</div>
      <div v-else class="summary-idle">No diff yet — press ⚡ Run Diff</div>
    </div>

    <!-- Filter + panel controls -->
    <div class="panel-controls">
      <div class="filter-toggle">
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': !diffsOnly }"
          @click="diffsOnly = false"
        >All</button>
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': diffsOnly }"
          @click="diffsOnly = true"
        >Differences only</button>
      </div>
      <div class="panel-pos-btns">
        <button
          v-for="pos in (['left', 'right', 'bottom'] as const)"
          :key="pos"
          class="pos-btn"
          :class="{ 'pos-btn--active': compareStore.diffPanelPos === pos }"
          :title="`Panel ${pos}`"
          @click="compareStore.setPanelPos(pos)"
        >{{ posBtnIcon(pos) }}</button>
      </div>
    </div>

    <!-- Diff content -->
    <div class="diff-content">
      <template v-if="diff">
        <!-- Placeholders section — always first, always expanded -->
        <div class="placeholders-section">
          <div class="ph-header">
            <span class="ph-toggle" @click="phExpanded = !phExpanded">{{ phExpanded ? '−' : '+' }}</span>
            <span class="ph-title">⚠ Placeholders</span>
            <span v-if="diff.placeholders.length > 0" class="ph-count">
              [{{ diff.placeholders.length }} total · {{ changedPlaceholders }} changed]
            </span>
          </div>
          <div v-if="phExpanded" class="ph-items">
            <template v-if="diff.placeholders.length === 0">
              <div class="ph-empty">No placeholder elements found</div>
            </template>
            <template v-for="ph in visiblePlaceholders" :key="`${ph.kind}::${ph.name}`">
              <div class="ph-item" :class="`ph-item--${ph.status}`">
                <span class="ph-status-icon">{{ statusIcon(ph.status) }}</span>
                <span class="ph-kind">{{ ph.kind }}:</span>
                <span class="ph-name">{{ ph.name }}</span>
                <span class="ph-status-label">{{ ph.status.toUpperCase() }}</span>
              </div>
              <!-- Params -->
              <div
                v-for="param in ph.params.filter(p => p.changed || !diffsOnly)"
                :key="`${ph.name}::${param.key}`"
                class="ph-param"
                :class="{ 'ph-param--critical': param.critical }"
              >
                <span class="ph-param-key">{{ param.key }}</span>
                <span class="ph-param-val ph-param-val--a">{{ param.valueA }}</span>
                <span class="ph-param-arrow">→</span>
                <span class="ph-param-val ph-param-val--b">{{ param.valueB }}</span>
                <span v-if="param.critical" class="ph-critical-badge">⚠ critical</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Other sections -->
        <CompareDiffSection
          v-for="section in filteredSections"
          :key="section.id"
          :section="section"
          :diffs-only="diffsOnly"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import CompareDiffSection from './CompareDiffSection.vue'
import { useCompareStore } from '@/core/stores/useCompareStore'
import type { PlaceholderDiff } from '@/core/utils/spineCompare'

const compareStore = useCompareStore()

const diff       = computed(() => compareStore.diff)
const diffStatus = computed(() => compareStore.diffStatus)
const diffError  = computed(() => compareStore.diffError)

const diffsOnly  = ref(false)
const phExpanded = ref(true)

const labelA = computed(() => {
  const s = compareStore.leftSlot
  if (!s) return 'No file'
  return s.label
})

const labelB = computed(() => {
  const s = compareStore.rightSlot
  if (!s) return 'No file'
  return s.label
})

const changedPlaceholders = computed(() => {
  if (!diff.value) return 0
  return diff.value.placeholders.filter(p => p.status !== 'equal').length
})

const visiblePlaceholders = computed<PlaceholderDiff[]>(() => {
  if (!diff.value) return []
  return diffsOnly.value
    ? diff.value.placeholders.filter(p => p.status !== 'equal')
    : diff.value.placeholders
})

const filteredSections = computed(() => {
  if (!diff.value) return []
  // Skip skeleton meta (id='skeleton') in 'diffs only' mode if equal
  return diff.value.sections.filter(s => {
    if (diffsOnly.value && s.status === 'equal') return false
    return true
  })
})

function statusIcon(status: PlaceholderDiff['status']): string {
  switch (status) {
    case 'added':   return '+'
    case 'removed': return '−'
    case 'changed': return '~'
    default:        return '='
  }
}

function posBtnIcon(pos: 'left' | 'right' | 'bottom'): string {
  switch (pos) {
    case 'left':   return '◧'
    case 'right':  return '◨'
    case 'bottom': return '⬓'
  }
}
</script>

<style scoped>
.diff-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-surface);
  border-left: 1px solid var(--c-border-dim);
  min-width: 260px;
  overflow: hidden;
}

/* ── Summary bar ─────────────────────────────────────────────────── */
.summary-bar {
  flex-shrink: 0;
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border-dim);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-labels {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--c-text-dim);
  overflow: hidden;
}

.summary-spine {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-sep {
  color: var(--c-text-ghost);
  flex-shrink: 0;
  font-size: 0.7rem;
}

.summary-badge {
  flex-shrink: 0;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 3px;
  padding: 1px 5px;
}

.summary-badge--a { background: #1e3a5f; color: #60a5fa; }
.summary-badge--b { background: #1e3d2e; color: #4ade80; }

.summary-counts {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
}

.count { font-weight: 600; }
.count--added   { color: #4ade80; }
.count--removed { color: #f87171; }
.count--changed { color: #f59e0b; }
.count-sep      { color: var(--c-text-ghost); }

.source-badge {
  font-size: 0.62rem;
  color: var(--c-text-ghost);
  background: var(--c-raised);
  border-radius: 4px;
  padding: 1px 5px;
}

.summary-running { font-size: 0.72rem; color: var(--c-text-muted); font-style: italic; }
.summary-error   { font-size: 0.72rem; color: #f87171; }
.summary-idle    { font-size: 0.72rem; color: var(--c-text-ghost); font-style: italic; }

/* ── Panel controls ──────────────────────────────────────────────── */
.panel-controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid var(--c-border-dim);
  gap: 8px;
}

.filter-toggle {
  display: flex;
  background: var(--c-raised);
  border-radius: 5px;
  overflow: hidden;
}

.filter-btn {
  background: transparent;
  border: none;
  padding: 3px 8px;
  font-size: 0.7rem;
  color: var(--c-text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.filter-btn--active {
  background: #7c6af5;
  color: white;
}

.panel-pos-btns {
  display: flex;
  gap: 2px;
}

.pos-btn {
  background: transparent;
  border: 1px solid var(--c-border-dim);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.75rem;
  color: var(--c-text-ghost);
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}

.pos-btn:hover   { border-color: var(--c-text-ghost); color: var(--c-text-muted); }
.pos-btn--active { border-color: #7c6af5; color: #9d8fff; }

/* ── Diff content ─────────────────────────────────────────────────── */
.diff-content {
  flex: 1;
  overflow-y: auto;
}

/* ── Placeholders section ─────────────────────────────────────────── */
.placeholders-section {
  border-bottom: 1px solid var(--c-border-dim);
}

.ph-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
}

.ph-header:hover { background: var(--c-raised); }

.ph-toggle {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--c-text-ghost);
  min-width: 14px;
  text-align: center;
}

.ph-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: #f59e0b;
}

.ph-count {
  font-size: 0.7rem;
  color: var(--c-text-muted);
  margin-left: auto;
}

.ph-empty {
  padding: 8px 28px;
  font-size: 0.75rem;
  color: var(--c-text-ghost);
  font-style: italic;
}

.ph-items {
  padding-bottom: 4px;
}

.ph-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px 2px 28px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
}

.ph-item--added   { background: rgba(74, 222, 128, 0.05); }
.ph-item--removed { background: rgba(248, 113, 113, 0.05); }
.ph-item--changed { background: rgba(245, 158, 11, 0.05); }

.ph-status-icon {
  font-weight: 700;
  font-size: 0.75rem;
  min-width: 12px;
}

.ph-item--added   .ph-status-icon { color: #4ade80; }
.ph-item--removed .ph-status-icon { color: #f87171; }
.ph-item--changed .ph-status-icon { color: #f59e0b; }
.ph-item--equal   .ph-status-icon { color: var(--c-text-ghost); }

.ph-kind { color: var(--c-text-ghost); font-size: 0.72rem; }
.ph-name { color: var(--c-text-dim); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ph-status-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--c-text-ghost);
  flex-shrink: 0;
}

.ph-param {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 1px 12px 1px 44px;
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
}

.ph-param--critical { background: rgba(245, 158, 11, 0.07); }

.ph-param-key    { color: var(--c-text-ghost); min-width: 80px; }
.ph-param-val    { font-size: 0.72rem; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ph-param-val--a { color: #f87171; }
.ph-param-val--b { color: #4ade80; }
.ph-param-arrow  { color: var(--c-text-ghost); flex-shrink: 0; }
.ph-critical-badge {
  font-size: 0.62rem;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 3px;
  padding: 1px 5px;
  flex-shrink: 0;
}
</style>
