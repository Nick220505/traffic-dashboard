# Configuración de Videos para Streaming

## Instalación

Para descargar los videos de muestra y configurar el sistema de streaming:

```bash
npm run download-videos
```

Este comando descargará 4 videos de muestra en el directorio `public/videos/`:

- video1.mp4 - Video HD 1080p (~10MB)
- video2.mp4 - Video SD 480p (~5MB)
- video3.mp4 - Video HD 720p (~7MB)
- video4.mp4 - Video Full HD (~12MB)

## Cómo funciona

1. Los videos se sirven desde el servidor local a través de `/api/video`
2. La API soporta HTTP Range Requests para streaming eficiente
3. Los videos se cargan bajo demanda generando tráfico HTTP continuo
4. Puedes cargar múltiples videos simultáneamente para generar tráfico masivo

## Agregar tus propios videos

1. Coloca archivos MP4 en `public/videos/`
2. Nómbralos como: `video1.mp4`, `video2.mp4`, etc.
3. Actualiza el array `VIDEOS` en `components/video-panel.tsx` si es necesario

## Notas

- Los archivos de video están excluidos del control de versiones (.gitignore)
- El streaming usa range requests para optimizar el ancho de banda
- Cada video genera tráfico HTTP continuo mientras se reproduce
