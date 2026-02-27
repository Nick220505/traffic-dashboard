import { NextRequest, NextResponse } from "next/server"

const EXTERNAL_URLS: Record<string, string> = {
  jsonplaceholder: "https://jsonplaceholder.typicode.com/posts",
  httpbin: "https://httpbin.org/get",
  catfacts: "https://catfact.ninja/fact",
  ipinfo: "https://ipinfo.io/json",
  universities: "https://universities.hipolabs.com/search?country=Mexico&limit=5",
  dogapi: "https://dog.ceo/api/breeds/image/random",
  boredapi: "https://www.boredapi.com/api/activity",
  numbersapi: "http://numbersapi.com/random/trivia",
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const target = searchParams.get("target") || "jsonplaceholder"
  const url = EXTERNAL_URLS[target]

  if (!url) {
    return NextResponse.json({ error: "Unknown target" }, { status: 400 })
  }

  const start = Date.now()

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    })

    const text = await res.text()
    const elapsed = Date.now() - start

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text.slice(0, 500)
    }

    return NextResponse.json({
      type: "external-fetch",
      target,
      url,
      status: res.status,
      bytesReceived: text.length,
      latency: elapsed,
      headers: Object.fromEntries(res.headers.entries()),
      data: parsed,
      timestamp: Date.now(),
    })
  } catch (err) {
    return NextResponse.json({
      type: "external-fetch",
      target,
      url,
      error: err instanceof Error ? err.message : "Unknown error",
      latency: Date.now() - start,
      timestamp: Date.now(),
    }, { status: 502 })
  }
}
