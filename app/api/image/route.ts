import { NextRequest } from "next/server"

// Generates a valid BMP image of the requested dimensions filled with a random color.
// BMP format is used because it can be generated without any external libraries
// and browsers render it natively – perfect for generating real image traffic from the server.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const width = Math.min(Math.max(parseInt(searchParams.get("w") || "400"), 1), 3840)
  const height = Math.min(Math.max(parseInt(searchParams.get("h") || "300"), 1), 2160)
  const seed = searchParams.get("seed") || String(Date.now())

  // Simple hash to get deterministic color from seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const r = Math.abs(hash % 200) + 40
  const g = Math.abs((hash >> 8) % 200) + 40
  const b = Math.abs((hash >> 16) % 200) + 40

  // Generate a gradient pattern for more visual interest
  const rowSize = Math.ceil((width * 3) / 4) * 4 // rows must be aligned to 4 bytes
  const pixelDataSize = rowSize * height
  const fileSize = 54 + pixelDataSize // 14 (file header) + 40 (info header) + pixel data

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // --- BMP File Header (14 bytes) ---
  view.setUint8(0, 0x42) // 'B'
  view.setUint8(1, 0x4d) // 'M'
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true) // reserved
  view.setUint32(10, 54, true) // pixel data offset

  // --- DIB Header (BITMAPINFOHEADER – 40 bytes) ---
  view.setUint32(14, 40, true) // header size
  view.setInt32(18, width, true)
  view.setInt32(22, -height, true) // negative = top-down
  view.setUint16(26, 1, true) // color planes
  view.setUint16(28, 24, true) // bits per pixel
  view.setUint32(30, 0, true) // no compression
  view.setUint32(34, pixelDataSize, true)
  view.setUint32(38, 2835, true) // horizontal resolution (72 DPI)
  view.setUint32(42, 2835, true) // vertical resolution
  view.setUint32(46, 0, true) // colors in palette
  view.setUint32(50, 0, true) // important colors

  // --- Pixel Data with gradient pattern ---
  const pixels = new Uint8Array(buffer, 54)
  for (let y = 0; y < height; y++) {
    const yFactor = y / height
    for (let x = 0; x < width; x++) {
      const xFactor = x / width
      const offset = y * rowSize + x * 3
      // BMP stores in BGR order; create a diagonal gradient
      const blend = (xFactor + yFactor) / 2
      pixels[offset] = Math.round(b * (1 - blend) + 60 * blend) // B
      pixels[offset + 1] = Math.round(g * (1 - blend) + 180 * blend) // G
      pixels[offset + 2] = Math.round(r * (1 - blend) + 100 * blend) // R
    }
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/bmp",
      "Content-Length": String(fileSize),
      "Cache-Control": "no-store",
    },
  })
}
