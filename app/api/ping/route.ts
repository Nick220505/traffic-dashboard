import { NextResponse } from "next/server"

export async function GET() {
  const timestamp = Date.now()
  return NextResponse.json({
    status: "pong",
    timestamp,
    server: "nettraffic-lab",
    protocol: "HTTP/1.1",
    method: "GET",
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const timestamp = Date.now()
  return NextResponse.json({
    status: "pong",
    timestamp,
    received: body,
    echo: true,
    bytes: JSON.stringify(body).length,
  })
}
