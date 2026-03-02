# Despliegue de Videos en Producción

## Problema

Los videos NO funcionarán en producción porque:

- Están excluidos del repositorio (.gitignore)
- Plataformas serverless (Vercel) tienen sistema de archivos de solo lectura
- Los archivos grandes no se incluyen en el build

## Soluciones Disponibles

### Opción 1: CDN Externo (RECOMENDADO) ⭐

Subir los videos a un CDN y servir desde ahí:

**Servicios gratuitos/económicos:**

- Cloudflare R2 (10GB gratis)
- AWS S3 + CloudFront
- Vercel Blob Storage
- Bunny CDN

**Implementación:**

```typescript
// app/api/video/route.ts
const VIDEO_CDN_BASE = process.env.VIDEO_CDN_URL || "https://tu-cdn.com/videos";

export async function GET(request: NextRequest) {
  const videoId = searchParams.get("id");
  const videoUrl = `${VIDEO_CDN_BASE}/${videoId}.mp4`;

  // Redirigir al CDN
  return Response.redirect(videoUrl, 302);
}
```

### Opción 2: Streaming Directo desde URLs Públicas

Usar videos de ejemplo públicos directamente:

```typescript
const VIDEO_URLS = {
  video1:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  video2:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  // ...
};

export async function GET(request: NextRequest) {
  const videoId = searchParams.get("id");
  const videoUrl = VIDEO_URLS[videoId];

  if (!videoUrl) {
    return new Response("Video no encontrado", { status: 404 });
  }

  // Redirigir a la URL pública
  return Response.redirect(videoUrl, 302);
}
```

### Opción 3: Vercel Blob Storage

Para proyectos en Vercel:

```bash
npm install @vercel/blob
```

```typescript
import { put, head } from "@vercel/blob";

// Subir videos (una vez)
const blob = await put("video1.mp4", file, {
  access: "public",
});

// Servir videos
export async function GET(request: NextRequest) {
  const videoId = searchParams.get("id");
  const metadata = await head(`${videoId}.mp4`);
  return Response.redirect(metadata.url, 302);
}
```

### Opción 4: Videos en el Cliente (Sin API)

Modificar el componente para usar URLs directas:

```tsx
// components/video-panel.tsx
const VIDEOS = [
  {
    id: "video1",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Video HD 1080p",
  },
  // ...
];

<video src={video.url} controls autoPlay />;
```

## Recomendación por Plataforma

### Vercel

- ✅ Opción 2 (URLs públicas) - Gratis, inmediato
- ✅ Opción 3 (Vercel Blob) - Integrado, 500MB gratis
- ✅ Opción 1 (CDN externo) - Más control

### Netlify

- ✅ Opción 2 (URLs públicas)
- ✅ Opción 1 (CDN externo)

### VPS/Docker

- ✅ Sistema actual funciona (tienes acceso al filesystem)
- Incluir videos en la imagen Docker

## Implementación Rápida (Opción 2)

Esta es la más simple y funciona inmediatamente:

1. No requiere configuración adicional
2. No tiene costos
3. Funciona en cualquier plataforma
4. Los videos ya están en URLs públicas

¿Quieres que implemente alguna de estas opciones?
