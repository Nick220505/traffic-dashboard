import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageId = searchParams.get("id");

  if (!imageId) {
    return new Response("Image ID requerido", { status: 400 });
  }

  try {
    const imagePath = join(process.cwd(), "public", "images", `${imageId}.jpg`);
    const imageBuffer = await readFile(imagePath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response("Imagen no encontrada", { status: 404 });
  }
}
