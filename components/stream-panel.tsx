"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio } from "lucide-react"

interface StreamChunk {
  chunk: number
  total: number
  cpuUsage: number
  memoryUsage: number
  networkIn: number
  networkOut: number
  activeConnections: number
}

interface StreamPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
  onConnectionChange: (delta: number) => void
}

export function StreamPanel({ onTraffic, onRequest, onConnectionChange }: StreamPanelProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [chunks, setChunks] = useState<StreamChunk[]>([])
  const [currentChunk, setCurrentChunk] = useState<StreamChunk | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startStream = async (duration: number) => {
    setIsStreaming(true)
    setChunks([])
    onRequest()
    onConnectionChange(1)

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/stream?duration=${duration}&interval=500`, {
        signal: abortRef.current.signal,
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          const jsonStr = line.replace("data: ", "").trim()
          if (jsonStr === "[DONE]") break

          try {
            const chunk: StreamChunk = JSON.parse(jsonStr)
            setCurrentChunk(chunk)
            setChunks((prev) => [...prev, chunk].slice(-50))
            onTraffic(jsonStr.length, 0)
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch {
      // aborted or error
    }

    onConnectionChange(-1)
    setIsStreaming(false)
  }

  const stopStream = () => {
    abortRef.current?.abort()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-chart-4" />
          <CardTitle className="text-sm">Server-Sent Events (SSE)</CardTitle>
        </div>
        <CardDescription>Streaming de datos en tiempo real</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {isStreaming ? (
            <Button size="sm" variant="destructive" onClick={stopStream}>
              Detener Stream
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={() => startStream(5)}>5s</Button>
              <Button size="sm" variant="secondary" onClick={() => startStream(15)}>15s</Button>
              <Button size="sm" variant="secondary" onClick={() => startStream(30)}>30s</Button>
            </>
          )}
        </div>
        {isStreaming && (
          <Badge className="w-fit animate-pulse">Streaming en curso...</Badge>
        )}
        {currentChunk && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">CPU: </span>
              <span className="text-primary">{currentChunk.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">MEM: </span>
              <span className="text-accent">{currentChunk.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">IN: </span>
              <span className="text-chart-3">{currentChunk.networkIn} B/s</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">OUT: </span>
              <span className="text-chart-4">{currentChunk.networkOut} B/s</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Chunks: {chunks.length}
          </Badge>
          {currentChunk && (
            <Badge variant="outline" className="font-mono text-xs">
              {currentChunk.chunk}/{currentChunk.total}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
