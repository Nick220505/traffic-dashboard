import { NextRequest } from "next/server"

// Generates a minimal valid MP4 file of the requested size.
// The file is a real MP4 container (ftyp + mdat boxes) filled with random data
// so the browser will attempt to decode/buffer it just like a real video download.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sizeKB = Math.min(Math.max(parseInt(searchParams.get("size") || "500"), 10), 20000)
  const totalBytes = sizeKB * 1024

  // Minimal ftyp box (file type) – 20 bytes
  const ftyp = new Uint8Array([
    0x00, 0x00, 0x00, 0x14, // size = 20
    0x66, 0x74, 0x79, 0x70, // 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, // major_brand = 'isom'
    0x00, 0x00, 0x02, 0x00, // minor_version
    0x69, 0x73, 0x6f, 0x6d, // compatible_brands = 'isom'
  ])

  // mdat box header (8 bytes) + random payload
  const mdatPayloadSize = Math.max(totalBytes - ftyp.length - 8, 0)
  const mdatHeader = new Uint8Array(8)
  const mdatSize = mdatPayloadSize + 8
  mdatHeader[0] = (mdatSize >> 24) & 0xff
  mdatHeader[1] = (mdatSize >> 16) & 0xff
  mdatHeader[2] = (mdatSize >> 8) & 0xff
  mdatHeader[3] = mdatSize & 0xff
  mdatHeader[4] = 0x6d // 'm'
  mdatHeader[5] = 0x64 // 'd'
  mdatHeader[6] = 0x61 // 'a'
  mdatHeader[7] = 0x74 // 't'

  const payload = new Uint8Array(mdatPayloadSize)
  // Fill with random data in chunks to avoid memory issues with large sizes
  const chunkSize = 65536
  for (let i = 0; i < mdatPayloadSize; i += chunkSize) {
    const end = Math.min(i + chunkSize, mdatPayloadSize)
    crypto.getRandomValues(payload.subarray(i, end))
  }

  // Combine into a single buffer
  const output = new Uint8Array(ftyp.length + mdatHeader.length + mdatPayloadSize)
  output.set(ftyp, 0)
  output.set(mdatHeader, ftyp.length)
  output.set(payload, ftyp.length + mdatHeader.length)

  const name = searchParams.get("name") || "video"

  return new Response(output, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${name}.mp4"`,
      "Content-Length": String(output.byteLength),
      "Accept-Ranges": "bytes",
    },
  })
}
