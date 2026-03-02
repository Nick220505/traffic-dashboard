"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Video, HardDrive, Play, Download } from "lucide-react"

const VIDEOS = [
  {
    id: "sample-1",
    title: "Big Buck Bunny (Clip)",
    description: "Animacion 3D - 770 KB",
    file: "/videos/sample-1.mp4",
    size: "770 KB",
    quality: "SD",
  },
  {
    id: "sample-2",
    title: "Movie Sample",
    description: "Clip corto - 311 KB",
    file: "/videos/sample-2.mp4",
    size: "311 KB",
    quality: "SD",
  },
  {
    id: "sample-3",
    title: "For Bigger Blazes",
    description: "Google Sample - 2.4 MB",
    file: "/videos/sample-3.mp4",
    size: "2.4 MB",
    quality: "HD",
  },
  {
    id: "sample-4",
    title: "For Bigger Escapes",
    description: "Google Sample - 2.2 MB",
    file: "/videos/sample-4.mp4",
    size: "2.2 MB",
    quality: "HD",
  },
  {
    id: "sample-5",
    title: "For Bigger Fun",
    description: "Google Sample - 12.3 MB (pesado)",
    file: "/videos/sample-5.mp4",
    size: "12.3 MB",
    quality: "Full HD",
  },
  {
    id: "sample-6",
    title: "For Bigger Joyrides",
    description: "Google Sample - 2.3 MB",
    file: "/videos/sample-6.mp4",
    size: "2.3 MB",
    quality: "HD",
  },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface VideoPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
}

export function VideoPanel({ onTraffic, onRequest }: VideoPanelProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set())
  const [multipleStreams, setMultipleStreams] = useState(false)
  const [multipleUrls, setMultipleUrls] = useState<Record<string, string>>({})
  const [downloading, setDownloading] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [lastResult, setLastResult] = useState<{ bytes: number; time: number; speed: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadVideo = useCallback(async (video: typeof VIDEOS[0]) => {
    setDownloading(video.id)
    setProgress(0)
    setMultipleStreams(false)
    setLastResult(null)

    const fakeProgress = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90))
    }, 150)

    const start = performance.now()
    const url = `/api/video?name=${video.id}`
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const latency = Math.round(performance.now() - start)
      const bytesIn = blob.size
      const speed = ((bytesIn / latency) * 1000 / 1024).toFixed(1) + " KB/s"

      onTraffic(bytesIn, 50)
      onRequest("GET", url, res.status, bytesIn, 50, latency)

      // Revoke previous object URL to prevent memory leaks
      if (activeVideoUrl) URL.revokeObjectURL(activeVideoUrl)

      const objectUrl = URL.createObjectURL(blob)
      setActiveVideo(video.id)
      setActiveVideoUrl(objectUrl)
      setLoadedVideos(prev => new Set(prev).add(video.id))
      setLastResult({ bytes: bytesIn, time: latency, speed })
    } catch {
      onRequest("GET", url, 0, 0, 0, Math.round(performance.now() - start))
    }

    clearInterval(fakeProgress)
    setProgress(100)
    setTimeout(() => { setDownloading(null); setProgress(0) }, 300)
  }, [activeVideoUrl, onTraffic, onRequest])

  const loadAllVideos = useCallback(async () => {
    setMultipleStreams(true)
    setActiveVideo(null)
    setActiveVideoUrl(null)
    setDownloading("all")
    setProgress(0)

    const urls: Record<string, string> = {}
    const selected = VIDEOS.slice(0, 4)

    for (let i = 0; i < selected.length; i++) {
      const video = selected[i]
      const start = performance.now()
      const url = `/api/video?name=${video.id}`
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const latency = Math.round(performance.now() - start)
        onTraffic(blob.size, 50)
        onRequest("GET", url, res.status, blob.size, 50, latency)
        urls[video.id] = URL.createObjectURL(blob)
        setLoadedVideos(prev => new Set(prev).add(video.id))
      } catch {
        onRequest("GET", url, 0, 0, 0, Math.round(performance.now() - start))
      }
      setProgress(((i + 1) / selected.length) * 100)
    }

    // Revoke old URLs
    Object.values(multipleUrls).forEach(u => URL.revokeObjectURL(u))
    setMultipleUrls(urls)
    setDownloading(null)
  }, [multipleUrls, onTraffic, onRequest])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-chart-4" />
            <CardTitle className="text-sm">Video Streaming (Servidor)</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {loadedVideos.size} descargados
          </Badge>
        </div>
        <CardDescription>
          Descarga y reproduce videos MP4 reales desde el servidor para medir trafico
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activeVideoUrl && !multipleStreams && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary/30">
            <video
              ref={videoRef}
              src={activeVideoUrl}
              controls
              className="h-full w-full"
            >
              Tu navegador no soporta el elemento video.
            </video>
          </div>
        )}

        {multipleStreams && Object.keys(multipleUrls).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {VIDEOS.slice(0, 4).map(video => (
              multipleUrls[video.id] ? (
                <div key={video.id} className="aspect-video overflow-hidden rounded-lg border border-border bg-secondary/30">
                  <video
                    src={multipleUrls[video.id]}
                    controls
                    muted
                    className="h-full w-full"
                  />
                </div>
              ) : null
            ))}
          </div>
        )}

        {downloading && <Progress value={progress} className="h-2" />}

        {lastResult && !downloading && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">descargado</Badge>
            <Badge variant="outline" className="font-mono text-xs">{formatBytes(lastResult.bytes)}</Badge>
            <Badge variant="outline" className="font-mono text-xs">{lastResult.time}ms</Badge>
            <Badge variant="outline" className="font-mono text-xs text-accent">{lastResult.speed}</Badge>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {VIDEOS.map((video) => (
            <button
              key={video.id}
              onClick={() => loadVideo(video)}
              disabled={downloading !== null}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                activeVideo === video.id && !multipleStreams
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {downloading === video.id ? (
                  <Download className="h-3 w-3 text-primary shrink-0 animate-pulse" />
                ) : (
                  <Play className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{video.title}</span>
                  <span className="text-[10px] text-muted-foreground">{video.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {video.size}
                </Badge>
                {loadedVideos.has(video.id) && (
                  <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={loadAllVideos}
          disabled={downloading !== null}
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <Video className="h-3.5 w-3.5" />
          Descargar 4 Videos Simultaneos (Trafico Masivo)
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Videos MP4 reales servidos desde el servidor. Cada descarga genera trafico HTTP
            medible: request, response, transferencia binaria y reproduccion con buffering.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
