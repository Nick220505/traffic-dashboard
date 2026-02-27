import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { count = 1, payload = "test" } = body

  const clampedCount = Math.min(Math.max(count, 1), 100)

  const responses: Array<{
    id: number
    timestamp: number
    payload: string
    size: number
  }> = []

  for (let i = 0; i < clampedCount; i++) {
    responses.push({
      id: i + 1,
      timestamp: Date.now(),
      payload: `response-${i}-${payload}`,
      size: Math.floor(Math.random() * 1024),
    })
  }

  return NextResponse.json({
    type: "flood-response",
    totalResponses: clampedCount,
    totalBytes: JSON.stringify(responses).length,
    timestamp: Date.now(),
    responses,
  })
}
