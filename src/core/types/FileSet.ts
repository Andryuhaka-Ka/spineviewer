/**
 * @file FileSet.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

export type SpineFileType = 'skeleton-json' | 'skeleton-skel' | 'atlas' | 'image'

export interface SpineFile {
  filename: string
  /** DataURL for images, plain text for json/atlas, ArrayBuffer for .skel */
  fileBody: string | ArrayBuffer
  type: SpineFileType
  mimeType: string
}

export interface FileSet {
  skeleton: SpineFile   // .json or .skel
  atlas: SpineFile      // .atlas
  images: SpineFile[]   // .png / .jpg / .webp / .avif
}

export interface SpineSlotSavedState {
  // Viewport
  speed: number
  posX: number
  posY: number
  zoom: number
  // Animation
  selectedAnimation: string | null
  currentTrack: number
  loop: boolean
  trackEnabled: Record<number, boolean>
  /** Full playlists per track — same shape as TrackQueueEntry[] */
  trackPlaylists: Record<number, Array<{ animationName: string; loop: boolean }>>
  wasPlaying: boolean
}

export interface SpineSlot {
  id: string
  name: string
  fileSet?: FileSet             // undefined when error is set
  error?: string                // set for unmatched / incomplete slots
  savedState?: SpineSlotSavedState
}
