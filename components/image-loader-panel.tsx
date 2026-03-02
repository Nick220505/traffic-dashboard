"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, HardDrive } from "lucide-react"

const IMAGES = [
  { w: 800, h: 600, label: "800x600", size: "~41 KB" },
  { w: 1920, h: 1080, label: "1920x1080", size: "~217 KB" },
  { w: 3840, h: 2160, label: "4K", size: "~645 KB" },
  { w: 400, h: 400, label: "400x400", size: "~10 KB" },
  { w: 1200, h: 800, label: "1200x800", size: "~108 KB" },
  { w: 2560, h: 1440, label: "QHD", size: "~600 KB" },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface ImageLoaderPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
}

export function ImageLoaderPanel({ onTraffic, onRequest }: ImageLoaderPanelProps) {
  const [loadedImages, setLoadedImages] = useState<{ src: string; bytes: number; time: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadCount, setLoadCount] = useState(0)

  const loadImage = useCallback(async (img: typeof IMAGES[0]) => {
    const seed = `${Date.now()}-${Math.random()}`
    const url = `/api/image?w=${img.w}&h=${img.h}&seed=${seed}`
    const start = performance.now()

    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const latency = Math.round(performance.now() - start)
      const bytesIn = blob.size
      const objectUrl = URL.createObjectURL(blob)

      setLoadedImages((prev) => [...prev, { src: objectUrl, bytes: bytesIn, time: latency }])
      onTraffic(bytesIn, 50)
      onRequest("GET", url, res.status, bytesIn, 50, latency)
      setLoadCount((c) => c + 1)
    } catch {
      onRequest("GET", url, 0, 0, 0, Math.round(performance.now() - start))
    }
  }, [onTraffic, onRequest])

  const loadBatch = async () => {
    setIsLoading(true)
    for (const img of IMAGES) {
      await loadImage(img)
      await new Promise((r) => setTimeout(r, 200))
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-chart-3" />
          <CardTitle className="text-sm">Carga de Imagenes (Servidor)</CardTitle>
        </div>
        <CardDescription>Descarga fotos reales desde el servidor (proxy a picsum.photos) para medir trafico</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {IMAGES.map((img) => (
            <Button
              key={img.label}
              size="sm"
              variant="outline"
              onClick={() => loadImage(img)}
              disabled={isLoading}
              className="text-xs flex-col h-auto py-2 gap-0.5"
            >
              <span className="font-mono">{img.label}</span>
              <span className="text-muted-foreground">{img.size}</span>
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={loadBatch} disabled={isLoading}>
          {isLoading ? "Descargando..." : `Cargar Todas (${IMAGES.length} imagenes)`}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Cargadas: {loadCount}
          </Badge>
          {loadedImages.length > 0 && (
            <Badge variant="outline" className="font-mono text-xs">
              Total: {formatBytes(loadedImages.reduce((sum, img) => sum + img.bytes, 0))}
            </Badge>
          )}
        </div>
        {loadedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {loadedImages.slice(-6).map((entry, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="aspect-video overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.src}
                    alt={`Imagen cargada ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground text-center">
                  {formatBytes(entry.bytes)} - {entry.time}ms
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Fotos JPEG reales proxiadas a traves del servidor desde picsum.photos.
            El trafico es completamente real y medible: cada byte fluye por HTTP desde el servidor.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
