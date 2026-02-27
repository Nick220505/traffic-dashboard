import { NextRequest, NextResponse } from "next/server"

let pollCounter = 0

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get("clientId") || "unknown"

  pollCounter++

  const data = {
    type: "poll-response",
    pollId: pollCounter,
    clientId,
    timestamp: Date.now(),
    serverTime: new Date().toISOString(),
    metrics: {
      cpu: (Math.random() * 80 + 10).toFixed(1),
      memory: (Math.random() * 70 + 20).toFixed(1),
      disk: (Math.random() * 50 + 30).toFixed(1),
      network: {
        rx: Math.floor(Math.random() * 100000),
        tx: Math.floor(Math.random() * 80000),
        packets: Math.floor(Math.random() * 5000),
        errors: Math.floor(Math.random() * 10),
      },
    },
    events: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `evt-${pollCounter}-${i}`,
      type: ["INFO", "WARN", "DEBUG", "METRIC"][Math.floor(Math.random() * 4)],
      message: [
        "Connection established",
        "Packet received",
        "Route updated",
        "Cache miss",
        "DNS resolved",
        "TLS handshake complete",
        "Keepalive sent",
        "Timeout warning",
      ][Math.floor(Math.random() * 8)],
      timestamp: Date.now() - Math.floor(Math.random() * 2000),
    })),
  }

  return NextResponse.json(data)
}
