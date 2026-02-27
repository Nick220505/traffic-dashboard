"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

interface PollEvent {
  id: string
  type: string
  message: string
  timestamp: number
}

interface PollData {
  pollId: number
  metrics: {
    cpu: string
    memory: string
    disk: string
    network: { rx: number; tx: number; packets: number; errors: number }
  }
  events: PollEvent[]
}

interface PollingPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
  onConnectionChange: (delta: number) => void
}

export function PollingPanel({ onTraffic, onRequest, onConnectionChange }: PollingPanelProps) {
  const [isPolling, setIsPolling] = useState(false)
  const [data, setData] = useState<PollData | null>(null)
  const [events, setEvents] = useState<PollEvent[]>([])
  const [pollCount, setPollCount] = useState(0)
  const [interval, setIntervalMs] = useState(1000)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(false)

  const doPoll = useCallback(async () => {
    if (!runningRef.current) return
    const url = `/api/poll?clientId=panel-${Date.now()}`
    const start = performance.now()
    try {
      const res = await fetch(url)
      const json = await res.json()
      const latency = Math.round(performance.now() - start)
      const bytesIn = JSON.stringify(json).length
      onTraffic(bytesIn, url.length)
      onRequest("GET", "/api/poll", res.status, bytesIn, url.length, latency)
      setData(json)
      setEvents(prev => [...(json.events || []), ...prev].slice(0, 50))
      setPollCount(prev => prev + 1)
    } catch {
      onRequest("GET", "/api/poll", 0, 0, 0, Math.round(performance.now() - start))
    }
  }, [onTraffic, onRequest])

  const startPolling = useCallback(() => {
    setIsPolling(true)
    runningRef.current = true
    setPollCount(0)
    setEvents([])
    onConnectionChange(1)
    doPoll()
    intervalRef.current = setInterval(doPoll, interval)
  }, [doPoll, interval, onConnectionChange])

  const stopPolling = useCallback(() => {
    runningRef.current = false
    setIsPolling(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    onConnectionChange(-1)
  }, [onConnectionChange])

  useEffect(() => {
    return () => {
      runningRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const eventTypeColor: Record<string, string> = {
    INFO: "text-primary",
    WARN: "text-chart-3",
    DEBUG: "text-muted-foreground",
    METRIC: "text-accent",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 text-chart-5 ${isPolling ? "animate-spin" : ""}`} />
          <CardTitle className="text-sm">Long Polling</CardTitle>
        </div>
        <CardDescription>Polling continuo que simula comunicacion en tiempo real</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "500ms", ms: 500 },
            { label: "1s", ms: 1000 },
            { label: "2s", ms: 2000 },
          ].map(opt => (
            <Button
              key={opt.ms}
              size="sm"
              variant={interval === opt.ms ? "default" : "outline"}
              disabled={isPolling}
              onClick={() => setIntervalMs(opt.ms)}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {isPolling ? (
            <Button size="sm" variant="destructive" onClick={stopPolling}>
              Detener Polling
            </Button>
          ) : (
            <Button size="sm" onClick={startPolling}>
              Iniciar Polling
            </Button>
          )}
          {isPolling && (
            <Badge className="animate-pulse">Polls: {pollCount}</Badge>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">CPU: </span>
              <span className="text-primary">{data.metrics.cpu}%</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">MEM: </span>
              <span className="text-accent">{data.metrics.memory}%</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">RX: </span>
              <span className="text-chart-3">{data.metrics.network.rx} B</span>
            </div>
            <div className="rounded bg-secondary/50 px-2 py-1.5">
              <span className="text-muted-foreground">TX: </span>
              <span className="text-chart-4">{data.metrics.network.tx} B</span>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-lg bg-secondary/50 p-2">
            <div className="flex flex-col gap-0.5">
              {events.slice(0, 20).map((ev, i) => (
                <div key={`${ev.id}-${i}`} className="flex items-center gap-2 text-[10px] font-mono px-1 py-0.5">
                  <span className={`shrink-0 font-bold ${eventTypeColor[ev.type] || "text-foreground"}`}>
                    [{ev.type}]
                  </span>
                  <span className="text-foreground truncate">{ev.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
