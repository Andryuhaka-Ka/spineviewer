/**
 * @file usePickerHistory.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

import {
  getSessions, reloadSession, getSessionHandles, deleteSession, clearHistory,
  isFileSystemAccessSupported, pickFilesViaFSAA,
  type HistorySession,
} from '@/core/utils/fileHistory'

type HandleFilesFn = (
  files: File[],
  handles?: FileSystemFileHandle[],
  skipHistory?: boolean,
) => Promise<void>

export function usePickerHistory(
  handleFiles: HandleFilesFn,
  onNavigate: () => void,
) {
  const historySessions = ref<HistorySession[]>(getSessions())
  const reloadingId     = ref<string | null>(null)
  const reloadHint      = ref<string[]>([])

  const groupedHistory = computed(() => {
    const groups = new Map<string, HistorySession[]>()
    for (const s of historySessions.value) {
      const key = new Date(s.timestamp).toDateString()
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }
    const today     = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86_400_000).toDateString()
    return [...groups.entries()].map(([key, sessions]) => ({
      dateLabel: key === today ? 'Today' : key === yesterday ? 'Yesterday' : key,
      sessions,
    }))
  })

  function formatSessionTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function refresh(): void {
    historySessions.value = getSessions()
  }

  function clearReloadHint(): void {
    reloadHint.value = []
  }

  async function onSessionClick(session: HistorySession): Promise<void> {
    reloadHint.value = []

    if (isFileSystemAccessSupported()) {
      reloadingId.value = session.id
      try {
        // Variant B: try silent auto-reload from stored handles
        if (session.hasHandles) {
          const files = await reloadSession(session)
          if (files && files.length > 0) {
            await handleFiles(files, undefined, true)
            onNavigate()
            return
          }
        }
        // Variant B fallback: open picker starting in the session's directory
        const handles   = await getSessionHandles(session.id)
        const startHandle = handles?.[0] ?? undefined
        const result    = await pickFilesViaFSAA(true, startHandle)
        if (result) {
          await handleFiles(result.files, result.handles, true)
          onNavigate()
          return
        }
      } finally {
        reloadingId.value = null
      }
      return
    }

    // Variant A (no FSAA): show file list hint only, user must pick files manually
    reloadHint.value = session.fileNames
  }

  async function onDeleteSession(session: HistorySession): Promise<void> {
    await deleteSession(session.id)
    historySessions.value = getSessions()
    if (reloadHint.value.length > 0 && reloadHint.value.join() === session.fileNames.join()) {
      reloadHint.value = []
    }
  }

  async function onClearHistory(): Promise<void> {
    await clearHistory()
    historySessions.value = []
    reloadHint.value      = []
  }

  return {
    historySessions,
    reloadingId,
    reloadHint,
    groupedHistory,
    formatSessionTime,
    refresh,
    clearReloadHint,
    onSessionClick,
    onDeleteSession,
    onClearHistory,
  }
}
