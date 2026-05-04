/**
 * @file PixiSpriteObject.ts
 * @project Spine Viewer Pro
 * @author Andrii Karpus <andryuha.ka@gmail.com>
 * @copyright 2026 Andrii Karpus
 * @built-with Claude Code (https://claude.ai/claude-code)
 */

/** Minimal positional interface for a Pixi sprite managed by PreviewStage. */
export interface PixiSpriteObject {
  x: number
  y: number
  scale: { set(v: number): void }
  zIndex: number
  destroy?(opts?: { texture?: boolean }): void
}
