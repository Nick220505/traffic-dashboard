import { NextRequest } from "next/server"

// Real MP4 sample videos from public domain sources.
// The server proxies these requests so all traffic flows through the server
// and is measurable by the dashboard.
const VIDEO_SOURCES: Record<string, string> = {
  "sample-1": "https://www.w3schools.com/html/mov_bbb.mp4",
  "sample-2": "https://www.w3schools.com/html/movie.mp4",
  "sample-3": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "sample-4": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "sample-5": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "sample-6": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") || "sample-1"
  const sourceUrl = VIDEO_SOURCES[name] ?? VIDEO_SOURCES["sample-1"]

  // Forward any Range header so the browser can seek
  const rangeHeader = request.headers.get("range")
  const upstreamHeaders: HeadersInit = {}
  if (rangeHeader) upstreamHeaders["Range"] = rangeHeader

  const upstream = await fetch(sourceUrl, { headers: upstreamHeaders })

  // Forward the upstream response body and relevant headers back to the client
  const headers = new Headers()
  headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "video/mp4")
  const contentLength = upstream.headers.get("Content-Length")
  if (contentLength) headers.set("Content-Length", contentLength)
  const contentRange = upstream.headers.get("Content-Range")
  if (contentRange) headers.set("Content-Range", contentRange)
  headers.set("Accept-Ranges", "bytes")
  headers.set("Cache-Control", "no-store")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
