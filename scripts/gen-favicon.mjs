/**
 * Generates public/favicon.ico (16×16, 24×24, 32×32, 48×48) with no external dependencies.
 * Uses 32-bpp BMP-in-ICO format (supported since Windows Vista / all modern browsers).
 *
 * Design: dark rounded-square bg (#12121a) + purple skeleton figure (#7c6af5),
 * matching Spine Viewer Pro's visual identity.
 *
 * Run: node scripts/gen-favicon.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ── Pixel renderer ────────────────────────────────────────────────────────────

function renderIcon(size) {
  // RGBA pixel buffer, fully transparent to start
  const pixels = new Uint8Array(size * size * 4)

  // Alpha-compositing setPixel
  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 4
    const sa = a / 255
    const da = pixels[i + 3] / 255
    const oa = sa + da * (1 - sa)
    if (oa < 0.001) return
    pixels[i]     = Math.round((r * sa + pixels[i]     * da * (1 - sa)) / oa)
    pixels[i + 1] = Math.round((g * sa + pixels[i + 1] * da * (1 - sa)) / oa)
    pixels[i + 2] = Math.round((b * sa + pixels[i + 2] * da * (1 - sa)) / oa)
    pixels[i + 3] = Math.round(oa * 255)
  }

  const s  = size / 32
  const [PR, PG, PB] = [0x7c, 0x6a, 0xf5]   // purple accent
  const [BR, BG, BB] = [0x12, 0x12, 0x1a]   // dark background

  // ── Rounded-rect background (SDF) ──────────────────────────────────────────
  const cr = size * 0.22  // corner radius
  const cx = size / 2, cy = size / 2
  const bx = size / 2 - cr, by = size / 2 - cr

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = Math.abs(px + 0.5 - cx) - bx
      const dy = Math.abs(py + 0.5 - cy) - by
      const dist = Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) - cr
      const alpha = Math.round(Math.max(0, Math.min(1, 0.5 - dist)) * 255)
      if (alpha > 0) setPixel(px, py, BR, BG, BB, alpha)
    }
  }

  // ── Anti-aliased filled circle ──────────────────────────────────────────────
  function circle(cfx, cfy, r) {
    const ir = Math.ceil(r + 1)
    for (let dy = -ir; dy <= ir; dy++) {
      for (let dx = -ir; dx <= ir; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy)
        const a = Math.round(Math.max(0, Math.min(1, r + 0.5 - d)) * 255)
        if (a > 0) setPixel(cfx + dx, cfy + dy, PR, PG, PB, a)
      }
    }
  }

  // ── Anti-aliased thick line (circles along the path) ───────────────────────
  function line(x0, y0, x1, y1, thickness) {
    const ddx = x1 - x0, ddy = y1 - y0
    const len  = Math.sqrt(ddx * ddx + ddy * ddy)
    const steps = Math.ceil(len * 2) + 1
    const hw   = thickness / 2
    const ir   = Math.ceil(hw + 1)

    for (let i = 0; i <= steps; i++) {
      const t  = i / steps
      const px = x0 + ddx * t
      const py = y0 + ddy * t
      for (let oy = -ir; oy <= ir; oy++) {
        for (let ox = -ir; ox <= ir; ox++) {
          const d = Math.sqrt(ox * ox + oy * oy)
          const a = Math.round(Math.max(0, Math.min(1, hw + 0.5 - d)) * 255)
          if (a > 0) setPixel(px + ox, py + oy, PR, PG, PB, a)
        }
      }
    }
  }

  const thick = Math.max(1.5, s * 2)

  // Head
  circle(16 * s, 6.5 * s, 3 * s)
  // Spine
  line(16 * s, 10 * s, 16 * s, 22 * s, thick)
  // Arms
  line(16 * s, 14.5 * s, 8.5 * s,  20 * s, thick * 0.85)
  line(16 * s, 14.5 * s, 23.5 * s, 20 * s, thick * 0.85)
  // Legs
  line(16 * s, 22 * s, 10 * s, 30 * s, thick * 0.85)
  line(16 * s, 22 * s, 22 * s, 30 * s, thick * 0.85)

  return pixels
}

// ── BMP-in-ICO encoder ────────────────────────────────────────────────────────

function pixelsToBmpData(pixels, w, h) {
  // BITMAPINFOHEADER + XOR pixel data (BGRA, bottom-to-top) + zeroed AND mask
  const headerSize    = 40
  const pixelBytes    = w * h * 4
  const maskRowBytes  = Math.ceil(w / 32) * 4   // rows padded to DWORD
  const maskBytes     = maskRowBytes * h
  const buf = Buffer.alloc(headerSize + pixelBytes + maskBytes, 0)
  let off = 0

  buf.writeUInt32LE(40,          off); off += 4  // biSize
  buf.writeInt32LE (w,           off); off += 4  // biWidth
  buf.writeInt32LE (h * 2,       off); off += 4  // biHeight (XOR + AND stacked)
  buf.writeUInt16LE(1,           off); off += 2  // biPlanes
  buf.writeUInt16LE(32,          off); off += 2  // biBitCount
  buf.writeUInt32LE(0,           off); off += 4  // biCompression (BI_RGB)
  buf.writeUInt32LE(pixelBytes,  off); off += 4  // biSizeImage
  buf.writeInt32LE (0,           off); off += 4  // biXPelsPerMeter
  buf.writeInt32LE (0,           off); off += 4  // biYPelsPerMeter
  buf.writeUInt32LE(0,           off); off += 4  // biClrUsed
  buf.writeUInt32LE(0,           off); off += 4  // biClrImportant

  // XOR mask: BGRA, bottom-to-top
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4
      buf[off++] = pixels[src + 2]  // B
      buf[off++] = pixels[src + 1]  // G
      buf[off++] = pixels[src + 0]  // R
      buf[off++] = pixels[src + 3]  // A
    }
  }
  // AND mask stays zeroed — alpha channel governs transparency for 32 bpp ICO
  return buf
}

function buildIco(images) {
  const count      = images.length
  const icoHeader  = Buffer.alloc(6)
  icoHeader.writeUInt16LE(0,     0)  // reserved
  icoHeader.writeUInt16LE(1,     2)  // type: 1 = ICO
  icoHeader.writeUInt16LE(count, 4)  // number of images

  let offset = 6 + count * 16
  const dirEntries = []
  const dataBufs   = []

  for (const { w, h, bmpData } of images) {
    const entry = Buffer.alloc(16)
    entry[0] = w >= 256 ? 0 : w    // 0 means 256
    entry[1] = h >= 256 ? 0 : h
    entry[2] = 0                    // color count (0 = no palette / 32 bpp)
    entry[3] = 0                    // reserved
    entry.writeUInt16LE(1,              4)   // planes
    entry.writeUInt16LE(32,             6)   // bit count
    entry.writeUInt32LE(bmpData.length, 8)   // size of image data
    entry.writeUInt32LE(offset,         12)  // absolute offset
    offset += bmpData.length
    dirEntries.push(entry)
    dataBufs.push(bmpData)
  }

  return Buffer.concat([icoHeader, ...dirEntries, ...dataBufs])
}

// ── Generate ──────────────────────────────────────────────────────────────────

const SIZES = [16, 24, 32, 48]

const images = SIZES.map(size => ({
  w: size,
  h: size,
  bmpData: pixelsToBmpData(renderIcon(size), size, size),
}))

const ico     = buildIco(images)
const outPath = join(__dir, '../public/favicon.ico')
writeFileSync(outPath, ico)
console.log(`✓ favicon.ico → ${outPath}  (${ico.length} bytes, sizes: ${SIZES.map(s => s + '×' + s).join(', ')})`)
