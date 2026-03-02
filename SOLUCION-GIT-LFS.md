# Solución al Problema de Videos Grandes en Git

## Problema Original

Los archivos de video (150MB y 161MB) excedían el límite de GitHub de 100MB por archivo, causando errores al hacer push.

## Solución Implementada

### 1. Limpieza del Historial

```bash
# Resetear al último commit bueno
git reset --hard 4c423b0

# Verificar que los videos no estén en el historial
git log --oneline
```

### 2. Configuración del .gitignore

Los videos están excluidos permanentemente:

```
# Videos (archivos grandes)
public/videos/*.mp4
public/videos/*.webm
public/videos/*.mov
!public/videos/.gitkeep
```

### 3. Sistema de Descarga Automática

Los usuarios clonan el repo y ejecutan:

```bash
npm run download-videos
```

## Estado Actual

✅ **Repositorio limpio**: Solo código fuente, sin archivos grandes
✅ **Videos locales**: Descargados en tu máquina (316MB total)
✅ **Push exitoso**: Sin errores de tamaño de archivo
✅ **Fácil setup**: Otros usuarios pueden descargar videos con un comando

## Archivos en el Repositorio

- `scripts/download-videos.js` - Script de descarga automática
- `public/videos/.gitkeep` - Mantiene el directorio en Git
- `README-VIDEOS.md` - Instrucciones para usuarios
- Videos \*.mp4 - **EXCLUIDOS** del repositorio

## Para Nuevos Colaboradores

1. Clonar el repositorio
2. Ejecutar `npm install`
3. Ejecutar `npm run download-videos`
4. Ejecutar `npm run dev`

Los videos se descargarán automáticamente desde Google Cloud Storage.

## Alternativa: Git LFS (No Implementada)

Si en el futuro quieres incluir los videos en el repo, puedes usar Git Large File Storage:

```bash
# Instalar Git LFS
git lfs install

# Trackear archivos grandes
git lfs track "public/videos/*.mp4"

# Agregar y commitear
git add .gitattributes
git add public/videos/*.mp4
git commit -m "Add videos with Git LFS"
git push
```

**Nota**: Git LFS tiene límites de ancho de banda en GitHub (1GB/mes gratis).
