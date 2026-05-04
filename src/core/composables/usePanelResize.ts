/**
 * @file usePanelResize.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { ref } from 'vue'
import type { Ref } from 'vue'

const PANEL_MIN = 180
const PANEL_MAX = 520

export function usePanelResize(): {
  panelWidth: Ref<number>
  onResizeStart: (e: MouseEvent) => void
} {
  const panelWidth = ref(
    Math.min(PANEL_MAX, Math.max(PANEL_MIN, parseInt(localStorage.getItem('svp:panelWidth') ?? '380')))
  )

  function onResizeStart(e: MouseEvent) {
    const startX = e.clientX
    const startW = panelWidth.value

    const onMove = (ev: MouseEvent) => {
      panelWidth.value = Math.min(PANEL_MAX, Math.max(PANEL_MIN, startW + ev.clientX - startX))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      localStorage.setItem('svp:panelWidth', String(panelWidth.value))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { panelWidth, onResizeStart }
}
