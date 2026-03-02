# Configuración de Videos para Streaming

## Instalación Rápida

### Desarrollo Local (Opcional)

Para usar videos locales en desarrollo y generar tráfico desde tu servidor:

```bash
npm run download-videos
```

Este comando descargará 4 videos de muestra en el directorio `public/videos/`:

- video1.mp4 - Video HD 1080p (~150MB)
- video2.mp4 - Video SD 480p (~160MB)
- video3.mp4 - Video HD 720p (~2MB)
- video4.mp4 - Video Full HD (~2MB)

### Producción

**No necesitas hacer nada especial.** El sistema automáticamente:

- En desarrollo: Sirve videos desde `public/videos/` si existen
- En producción: Redirige a URLs públicas de Google Cloud Storage

## Cómo funciona

### Modo Desarrollo (con videos locales)

1. Los videos se sirven desde el servidor local a través de `/api/video`
2. La API soporta HTTP Range Requests para streaming eficiente
3. Genera tráfico HTTP/TCP continuo desde tu servidor
4. Perfecto para testing de tráfico de red

### Modo Producción (sin videos locales)

1. La API detecta que los videos no existen localmente
2. Redirige automáticamente a URLs públicas (HTTP 302)
3. Los videos se sirven desde Google Cloud Storage CDN
4. Funciona en Vercel, Netlify, y cualquier plataforma serverless

## Protocolo de Transporte

El streaming usa **TCP** (Transmission Control Protocol):

- HTTP sobre TCP en puerto 3000 (desarrollo) o 443 (producción)
- Handshake TCP de 3 vías para cada conexión
- Range Requests para carga parcial eficiente
- Transferencia continua con ACKs bidireccionales
- Tráfico medible y confiable

## Agregar tus propios videos

### Para desarrollo local:

1. Coloca archivos MP4 en `public/videos/`
2. Nómbralos como: `video1.mp4`, `video2.mp4`, etc.

### Para producción:

1. Sube tus videos a un CDN (Cloudflare R2, AWS S3, etc.)
2. Actualiza las URLs en `app/api/video/route.ts`:

```typescript
const PUBLIC_VIDEO_URLS: Record<string, string> = {
  video1: "https://tu-cdn.com/video1.mp4",
  video2: "https://tu-cdn.com/video2.mp4",
  // ...
};
```

## Notas

- Los archivos de video están excluidos del control de versiones (.gitignore)
- El sistema funciona en desarrollo y producción sin configuración adicional
- En desarrollo, genera tráfico desde tu servidor
- En producción, usa CDN público (sin costo adicional)
- Cada video genera tráfico HTTP/TCP continuo mientras se reproduce
