"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ExternalLink, Play } from "lucide-react";

const VIDEOS = [
  {
    id: "video1",
    title: "Video HD 1080p",
    description:
      "Video de alta calidad - genera trafico HTTPS streaming pesado",
    quality: "1080p",
  },
  {
    id: "video2",
    title: "Video SD 480p",
    description: "Video de calidad estandar - trafico ligero",
    quality: "480p",
  },
  {
    id: "video3",
    title: "Video HD 720p",
    description: "Video de calidad media - trafico moderado",
    quality: "720p",
  },
  {
    id: "video4",
    title: "Video Full HD",
    description: "Video de maxima calidad - genera trafico continuo",
    quality: "1080p",
  },
];

export function VideoPanel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [multipleStreams, setMultipleStreams] = useState(false);

  const loadVideo = (id: string) => {
    setActiveVideo(id);
    setLoadedVideos((prev) => new Set(prev).add(id));
  };

  const loadAllVideos = () => {
    setMultipleStreams(true);
    VIDEOS.forEach((v) => setLoadedVideos((prev) => new Set(prev).add(v.id)));
  };

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
          Reproduce videos desde el servidor para generar trafico de streaming
          local
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activeVideo && !multipleStreams && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <video
              src={`/api/video?id=${activeVideo}`}
              controls
              autoPlay
              className="h-full w-full"
            />
          </div>
        )}

        {multipleStreams && (
          <div className="grid grid-cols-2 gap-2">
            {VIDEOS.map((video) => (
              <div
                key={video.id}
                className="aspect-video overflow-hidden rounded-lg border border-border"
              >
                <video
                  src={`/api/video?id=${video.id}`}
                  controls
                  autoPlay
                  muted
                  loop
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
              onClick={() => {
                setMultipleStreams(false);
                loadVideo(video.id);
              }}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                activeVideo === video.id && !multipleStreams
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Play className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">
                    {video.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {video.description}
                  </span>
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
          Cargar {VIDEOS.length} Videos Simultaneos (Trafico Masivo)
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Cada video se sirve desde el servidor local generando trafico HTTP
            continuo con range requests, streaming de datos y carga de recursos
            multimedia pesados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
