import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const duration = parseInt(searchParams.get("duration") || "10")
  const interval = parseInt(searchParams.get("interval") || "1000")

  const clampedDuration = Math.min(Math.max(duration, 1), 60)
  const clampedInterval = Math.min(Math.max(interval, 100), 5000)

  const encoder = new TextEncoder()
  const totalChunks = Math.floor((clampedDuration * 1000) / clampedInterval)

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = JSON.stringify({
          chunk: i + 1,
          total: totalChunks,
          timestamp: Date.now(),
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          networkIn: Math.floor(Math.random() * 10000),
          networkOut: Math.floor(Math.random() * 10000),
          activeConnections: Math.floor(Math.random() * 500),
        }) + "\n"
        controller.enqueue(encoder.encode(`data: ${chunk}\n`))
        await new Promise((resolve) => setTimeout(resolve, clampedInterval))
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
