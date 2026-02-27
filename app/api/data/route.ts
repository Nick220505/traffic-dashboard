import { NextRequest, NextResponse } from "next/server"

function generateRandomData(sizeKB: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const targetBytes = sizeKB * 1024
  let data = ""
  for (let i = 0; i < targetBytes; i++) {
    data += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return data
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const size = parseInt(searchParams.get("size") || "10")
  const clampedSize = Math.min(Math.max(size, 1), 5000)

  const data = generateRandomData(clampedSize)

  return NextResponse.json({
    type: "bulk-data",
    requestedSizeKB: clampedSize,
    actualBytes: data.length,
    timestamp: Date.now(),
    payload: data,
  })
}
