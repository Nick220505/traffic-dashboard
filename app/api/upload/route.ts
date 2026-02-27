import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  let totalBytes = 0

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = await value.arrayBuffer()
        totalBytes += buffer.byteLength
      } else {
        totalBytes += String(value).length
      }
    }
  } else {
    const buffer = await request.arrayBuffer()
    totalBytes = buffer.byteLength
  }

  return NextResponse.json({
    type: "upload-received",
    bytesReceived: totalBytes,
    timestamp: Date.now(),
    contentType,
    status: "ok",
  })
}
