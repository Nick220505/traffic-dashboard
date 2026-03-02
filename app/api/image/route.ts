import { NextRequest } from "next/server"

// Real images proxied from picsum.photos (public domain).
// Routing through the server makes the traffic measurable by the dashboard.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const w = Math.min(Math.max(parseInt(searchParams.get("w") || "800"), 100), 3840)
  const h = Math.min(Math.max(parseInt(searchParams.get("h") || "600"), 100), 2160)
  // Use seed to get a deterministic but varied image each call
  const seed = searchParams.get("seed") || String(Date.now())
  // Pick an image ID from the seed so different seeds give different photos
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const imageId = (Math.abs(hash) % 1000) + 1

  const sourceUrl = `https://picsum.photos/id/${imageId}/${w}/${h}`
  const upstream = await fetch(sourceUrl)

  const headers = new Headers()
  headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "image/jpeg")
  const contentLength = upstream.headers.get("Content-Length")
  if (contentLength) headers.set("Content-Length", contentLength)
  headers.set("Cache-Control", "no-store")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
