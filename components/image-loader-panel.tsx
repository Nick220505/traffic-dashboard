"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

const IMAGES = [
  { url: "https://picsum.photos/800/600?random=1", label: "800x600", size: "~50KB" },
  { url: "https://picsum.photos/1920/1080?random=2", label: "1920x1080", size: "~200KB" },
  { url: "https://picsum.photos/3840/2160?random=3", label: "4K", size: "~500KB" },
  { url: "https://picsum.photos/400/400?random=4", label: "400x400", size: "~20KB" },
  { url: "https://picsum.photos/1200/800?random=5", label: "1200x800", size: "~100KB" },
  { url: "https://picsum.photos/2560/1440?random=6", label: "QHD", size: "~350KB" },
]

interface ImageLoaderPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

export function ImageLoaderPanel({ onTraffic, onRequest }: ImageLoaderPanelProps) {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadCount, setLoadCount] = useState(0)

  const loadImage = async (url: string) => {
    onRequest()
    return new Promise<void>((resolve) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setLoadedImages((prev) => [...prev, `${url}&t=${Date.now()}`])
        onTraffic(50000, 200)
        setLoadCount((c) => c + 1)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = `${url}&t=${Date.now()}`
    })
  }

  const loadBatch = async () => {
    setIsLoading(true)
    for (const img of IMAGES) {
      await loadImage(img.url)
      await new Promise((r) => setTimeout(r, 300))
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-chart-3" />
          <CardTitle className="text-sm">Carga de Imagenes</CardTitle>
        </div>
        <CardDescription>Descarga imagenes de diferentes resoluciones desde CDN externo</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {IMAGES.map((img) => (
            <Button
              key={img.url}
              size="sm"
              variant="outline"
              onClick={() => loadImage(img.url)}
              disabled={isLoading}
              className="text-xs flex-col h-auto py-2 gap-0.5"
            >
              <span className="font-mono">{img.label}</span>
              <span className="text-muted-foreground">{img.size}</span>
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={loadBatch} disabled={isLoading}>
          Cargar Todas ({IMAGES.length} imagenes)
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Cargadas: {loadCount}
          </Badge>
        </div>
        {loadedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {loadedImages.slice(-6).map((src, i) => (
              <div key={i} className="aspect-video overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Imagen cargada ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
