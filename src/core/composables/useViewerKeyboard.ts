/**
 * @file useViewerKeyboard.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { useAnimationStore } from '@/core/stores/useAnimationStore'
import type PreviewStage from '@/components/stage/PreviewStage.vue'

export function useViewerKeyboard(
  stageRef: Ref<InstanceType<typeof PreviewStage> | null>
): void {
  const animationStore = useAnimationStore()

  function onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    // isComposing=true means an IME/dead-key sequence is in progress — ignore to avoid
    // misfires when switching to a non-Latin keyboard layout (e.g. Ukrainian/CJK)
    if (e.isComposing || e.keyCode === 229) return

    // Space on focused interactive controls (checkbox, switch, button) would toggle them
    // in addition to firing our shortcut. Stop propagation here (capture phase) so the
    // control never receives the Space event — our handler takes over instead.
    if (e.code === 'Space') {
      const role = (e.target as HTMLElement).getAttribute?.('role') ?? ''
      if (role === 'checkbox' || role === 'switch' || role === 'button') {
        e.stopPropagation()
      }
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        animationStore.isPlaying ? animationStore.pause() : animationStore.play()
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (animationStore.isPlaying) animationStore.pause()
        stageRef.value?.seekDelta(animationStore.currentTrack, -1 / 30)
        break
      case 'ArrowRight':
        e.preventDefault()
        if (animationStore.isPlaying) animationStore.pause()
        stageRef.value?.seekDelta(animationStore.currentTrack, 1 / 30)
        break
      case 'KeyR':
        stageRef.value?.clearTracks()
        break
      case 'KeyL': {
        const targets = e.shiftKey
          ? animationStore.tracks
          : animationStore.tracks.filter(t => t.trackIndex === animationStore.currentTrack)
        for (const t of targets) {
          stageRef.value?.setTrackLoop(t.trackIndex, !t.loop)
        }
        break
      }
      default:
        if (/^Digit[0-9]$/.test(e.code)) {
          animationStore.currentTrack = Number(e.code.replace('Digit', ''))
        }
    }
  }

  // Block Space keyup on interactive controls (NaiveUI handles toggle on keyup,
  // so keydown stopPropagation alone is not enough).
  function onKeyUpCapture(e: KeyboardEvent) {
    if (e.code !== 'Space') return
    const role = (e.target as HTMLElement).getAttribute?.('role') ?? ''
    if (role === 'checkbox' || role === 'switch' || role === 'button') {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUpCapture, true)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('keyup', onKeyUpCapture, true)
  })
}
