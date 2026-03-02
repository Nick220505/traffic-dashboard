import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// URLs públicas de videos para producción
const PUBLIC_VIDEO_URLS: Record<string, string> = {
  video1:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  video2:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  video3:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  video4:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("id");

  if (!videoId) {
    return new Response("Video ID requerido", { status: 400 });
  }

  // Intentar servir desde filesystem local (desarrollo)
  const videoPath = join(process.cwd(), "public", "videos", `${videoId}.mp4`);

  if (existsSync(videoPath)) {
    try {
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
      // Si falla, continuar a la URL pública
    }
  }

  // Fallback: redirigir a URL pública (producción)
  const publicUrl = PUBLIC_VIDEO_URLS[videoId];

  if (!publicUrl) {
    return new Response("Video no encontrado", { status: 404 });
  }

  // Redirigir al video público
  return Response.redirect(publicUrl, 302);
}
