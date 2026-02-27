"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Upload, ArrowUpDown } from "lucide-react"

interface DownloadPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function DownloadPanel({ onTraffic, onRequest }: DownloadPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastResult, setLastResult] = useState<{ type: string; bytes: number; time: number; speed: string } | null>(null)

  const downloadFile = async (sizeKB: number, format: string) => {
    setIsDownloading(true)
    setProgress(0)
    setLastResult(null)

    const fakeProgress = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 20, 90))
    }, 150)

    const start = performance.now()
    const url = `/api/download?size=${sizeKB}&format=${format}`
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const latency = Math.round(performance.now() - start)
      const bytesIn = blob.size
      const speed = ((bytesIn / latency) * 1000 / 1024).toFixed(1) + " KB/s"
      onTraffic(bytesIn, 50)
      onRequest("GET", url, res.status, bytesIn, 50, latency)
      setLastResult({ type: `download-${format}`, bytes: bytesIn, time: latency, speed })
    } catch {
      onRequest("GET", url, 0, 0, 0, Math.round(performance.now() - start))
    }

    clearInterval(fakeProgress)
    setProgress(100)
    setTimeout(() => { setIsDownloading(false); setProgress(0) }, 400)
  }

  const uploadData = async (sizeKB: number) => {
    setIsUploading(true)
    setProgress(0)
    setLastResult(null)

    const fakeProgress = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 85))
    }, 150)

    const bytes = new Uint8Array(sizeKB * 1024)
    crypto.getRandomValues(bytes)
    const blob = new Blob([bytes])

    const start = performance.now()
    const url = "/api/upload"
    try {
      const res = await fetch(url, {
        method: "POST",
        body: blob,
        headers: { "Content-Type": "application/octet-stream" },
      })
      const data = await res.json()
      const latency = Math.round(performance.now() - start)
      const bytesOut = sizeKB * 1024
      const bytesIn = JSON.stringify(data).length
      const speed = ((bytesOut / latency) * 1000 / 1024).toFixed(1) + " KB/s"
      onTraffic(bytesIn, bytesOut)
      onRequest("POST", url, res.status, bytesIn, bytesOut, latency)
      setLastResult({ type: "upload", bytes: bytesOut, time: latency, speed })
    } catch {
      onRequest("POST", url, 0, 0, 0, Math.round(performance.now() - start))
    }

    clearInterval(fakeProgress)
    setProgress(100)
    setTimeout(() => { setIsUploading(false); setProgress(0) }, 400)
  }

  const isBusy = isDownloading || isUploading

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm">Descarga y Subida de Archivos</CardTitle>
        </div>
        <CardDescription>Genera trafico pesado con descargas/subidas binarias reales</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Download className="h-3 w-3" /> Descargar desde servidor
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "100 KB", size: 100 },
              { label: "500 KB", size: 500 },
              { label: "1 MB", size: 1024 },
              { label: "2 MB", size: 2048 },
              { label: "5 MB", size: 5000 },
              { label: "10 MB", size: 10000 },
            ].map(opt => (
              <Button
                key={opt.size}
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => downloadFile(opt.size, "bin")}
                className="font-mono text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Upload className="h-3 w-3" /> Subir al servidor
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "50 KB", size: 50 },
              { label: "200 KB", size: 200 },
              { label: "500 KB", size: 500 },
              { label: "1 MB", size: 1024 },
              { label: "2 MB", size: 2048 },
              { label: "5 MB", size: 5000 },
            ].map(opt => (
              <Button
                key={opt.size}
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => uploadData(opt.size)}
                className="font-mono text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {isBusy && <Progress value={progress} className="h-2" />}

        {lastResult && !isBusy && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">{lastResult.type}</Badge>
            <Badge variant="outline" className="font-mono text-xs">{formatBytes(lastResult.bytes)}</Badge>
            <Badge variant="outline" className="font-mono text-xs">{lastResult.time}ms</Badge>
            <Badge variant="outline" className="font-mono text-xs text-accent">{lastResult.speed}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
