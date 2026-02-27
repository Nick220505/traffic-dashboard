import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const headerEntries: Record<string, string> = {}

  request.headers.forEach((value, key) => {
    headerEntries[key] = value
  })

  return NextResponse.json({
    type: "header-inspection",
    headers: headerEntries,
    count: Object.keys(headerEntries).length,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    timestamp: Date.now(),
  })
}
