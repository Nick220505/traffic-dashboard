import { NextRequest, NextResponse } from "next/server"

const MOCK_DNS_RECORDS: Record<string, { ip: string; ttl: number; type: string }[]> = {
  "google.com": [
    { ip: "142.250.80.46", ttl: 300, type: "A" },
    { ip: "2607:f8b0:4004:800::200e", ttl: 300, type: "AAAA" },
  ],
  "github.com": [
    { ip: "140.82.121.3", ttl: 60, type: "A" },
  ],
  "cloudflare.com": [
    { ip: "104.16.132.229", ttl: 300, type: "A" },
    { ip: "104.16.133.229", ttl: 300, type: "A" },
  ],
  "amazon.com": [
    { ip: "205.251.242.103", ttl: 60, type: "A" },
    { ip: "52.94.236.248", ttl: 60, type: "A" },
  ],
  "netflix.com": [
    { ip: "54.237.226.164", ttl: 60, type: "A" },
  ],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get("domain") || "google.com"

  const records = MOCK_DNS_RECORDS[domain] || [
    { ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, ttl: 300, type: "A" },
  ]

  // Simulate DNS lookup delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50))

  return NextResponse.json({
    type: "dns-lookup",
    domain,
    records,
    queryTime: Math.floor(Math.random() * 50 + 5),
    server: "8.8.8.8",
    timestamp: Date.now(),
  })
}
