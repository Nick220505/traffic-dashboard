import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sizeKB = Math.min(Math.max(parseInt(searchParams.get("size") || "100"), 1), 10000)
  const format = searchParams.get("format") || "bin"

  const bytes = new Uint8Array(sizeKB * 1024)
  crypto.getRandomValues(bytes)

  const contentType =
    format === "json"
      ? "application/json"
      : format === "text"
        ? "text/plain"
        : "application/octet-stream"

  const filename =
    format === "json"
      ? "data.json"
      : format === "text"
        ? "data.txt"
        : "data.bin"

  if (format === "json") {
    const arr: number[] = []
    for (let i = 0; i < Math.min(sizeKB * 100, 50000); i++) {
      arr.push(bytes[i % bytes.length])
    }
    const json = JSON.stringify({ type: "bulk-download", sizeKB, data: arr, timestamp: Date.now() })
    return new Response(json, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(json.length),
      },
    })
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
    },
  })
}
