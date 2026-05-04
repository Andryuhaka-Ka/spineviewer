/**
 * @file useSeekDrag.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

/**
 * Manages seek-drag lifecycle: activates on startSeekDrag(), forwards mousemove events
 * to onSeekMove callback, and deactivates + calls onSeekEnd on mouseup.
 */
export function useSeekDrag(
  onSeekMove: (e: MouseEvent) => void,
  onSeekEnd: () => void,
) {
  let _active = false

  function _handleMove(e: MouseEvent) {
    if (!_active) return
    onSeekMove(e)
  }

  function _handleEnd() {
    _active = false
    window.removeEventListener('mousemove', _handleMove)
    window.removeEventListener('mouseup', _handleEnd)
    onSeekEnd()
  }

  function startSeekDrag() {
    _active = true
    window.addEventListener('mousemove', _handleMove)
    window.addEventListener('mouseup', _handleEnd)
  }

  function cleanup() {
    window.removeEventListener('mousemove', _handleMove)
    window.removeEventListener('mouseup', _handleEnd)
  }

  return {
    startSeekDrag,
    cleanup,
    get isActive() { return _active },
  }
}
