import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("id");

  if (!videoId) {
    return new Response("Video ID requerido", { status: 400 });
  }

  try {
    const videoPath = join(process.cwd(), "public", "videos", `${videoId}.mp4`);
    const videoBuffer = await readFile(videoPath);

    const range = request.headers.get("range");
    const videoSize = videoBuffer.length;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
      const chunkSize = end - start + 1;
      const chunk = videoBuffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    }

    return new Response(videoBuffer, {
      headers: {
        "Content-Length": videoSize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    return new Response("Video no encontrado", { status: 404 });
  }
}
