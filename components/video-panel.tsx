"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, ExternalLink } from "lucide-react"

const VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    description: "Video clasico - genera trafico de streaming pesado",
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
    description: "Video viral - alta calidad, mucho trafico",
    quality: "1080p",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito",
    description: "Video mas visto - genera trafico continuo",
    quality: "4K",
  },
]

export function VideoPanel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set())

  const loadVideo = (id: string) => {
    setActiveVideo(id)
    setLoadedVideos((prev) => new Set(prev).add(id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-chart-4" />
          <CardTitle className="text-sm">Video Streaming</CardTitle>
        </div>
        <CardDescription>
          Reproduce videos de YouTube para generar trafico de streaming significativo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activeVideo && (
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
        <div className="flex flex-col gap-2">
          {VIDEOS.map((video) => (
            <button
              key={video.id}
              onClick={() => loadVideo(video.id)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                activeVideo === video.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">{video.title}</span>
                <span className="text-xs text-muted-foreground">{video.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {video.quality}
                </Badge>
                {loadedVideos.has(video.id) && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Cargado
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Los videos de YouTube generan trafico HTTPS significativo: handshake TLS, DNS, requests CDN, y streaming de datos.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
