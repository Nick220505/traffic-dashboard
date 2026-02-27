"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, ExternalLink, Play } from "lucide-react"

const VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    description: "Video clasico - genera trafico HTTPS streaming pesado",
    quality: "1080p",
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    description: "Primer video de YouTube - trafico ligero",
    quality: "240p",
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE",
    description: "Video viral - alta calidad, mucho trafico CDN",
    quality: "1080p",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito",
    description: "Video mas visto - genera trafico continuo",
    quality: "4K",
  },
  {
    id: "hTWKbfoikeg",
    title: "Nirvana - Smells Like Teen Spirit",
    description: "Trafico de streaming prolongado",
    quality: "720p",
  },
  {
    id: "YQHsXMglC9A",
    title: "Adele - Hello",
    description: "Alta calidad de audio y video",
    quality: "1080p",
  },
]

export function VideoPanel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set())
  const [multipleStreams, setMultipleStreams] = useState(false)

  const loadVideo = (id: string) => {
    setActiveVideo(id)
    setLoadedVideos((prev) => new Set(prev).add(id))
  }

  const loadAllVideos = () => {
    setMultipleStreams(true)
    VIDEOS.forEach(v => setLoadedVideos(prev => new Set(prev).add(v.id)))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-chart-4" />
            <CardTitle className="text-sm">Video Streaming</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {loadedVideos.size} cargados
          </Badge>
        </div>
        <CardDescription>
          Reproduce videos de YouTube para generar trafico de streaming real (TLS, DNS, CDN)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activeVideo && !multipleStreams && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Video Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}

        {multipleStreams && (
          <div className="grid grid-cols-2 gap-2">
            {VIDEOS.slice(0, 4).map(video => (
              <div key={video.id} className="aspect-video overflow-hidden rounded-lg border border-border">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {VIDEOS.map((video) => (
            <button
              key={video.id}
              onClick={() => { setMultipleStreams(false); loadVideo(video.id) }}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                activeVideo === video.id && !multipleStreams
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Play className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{video.title}</span>
                  <span className="text-[10px] text-muted-foreground">{video.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {video.quality}
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
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Video className="h-3.5 w-3.5" />
          Cargar 4 Videos Simultaneos (Trafico Masivo)
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Cada video genera: handshake TLS, resolucion DNS (googleapis.com, youtube.com, googlevideo.com),
            requests a CDN, y streaming continuo de datos via QUIC/HTTP3.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
