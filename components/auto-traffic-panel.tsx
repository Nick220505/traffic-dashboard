"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Square, Gauge, Zap } from "lucide-react"

interface AutoTrafficPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
  onConnectionChange: (delta: number) => void
}

type TrafficMode = "light" | "medium" | "heavy" | "extreme"

const MODES: Record<TrafficMode, { label: string; interval: number; concurrent: number; description: string }> = {
  light: { label: "Ligero", interval: 2000, concurrent: 1, description: "1 req cada 2s" },
  medium: { label: "Medio", interval: 800, concurrent: 2, description: "2 req cada 0.8s" },
  heavy: { label: "Pesado", interval: 300, concurrent: 5, description: "5 req cada 0.3s" },
  extreme: { label: "Extremo", interval: 100, concurrent: 10, description: "10 req cada 0.1s" },
}

const ENDPOINTS = [
  { url: "/api/ping", method: "GET" },
  { url: "/api/data?size=50", method: "GET" },
  { url: "/api/data?size=200", method: "GET" },
  { url: "/api/dns?domain=google.com", method: "GET" },
  { url: "/api/dns?domain=github.com", method: "GET" },
  { url: "/api/headers", method: "GET" },
  { url: "/api/download?size=10&format=bin", method: "GET" },
  { url: "/api/download?size=50&format=json", method: "GET" },
  { url: "/api/external?target=jsonplaceholder", method: "GET" },
  { url: "/api/external?target=catfacts", method: "GET" },
  { url: "/api/external?target=dogapi", method: "GET" },
  { url: "/api/poll?clientId=auto", method: "GET" },
]

export function AutoTrafficPanel({ onTraffic, onRequest, onConnectionChange }: AutoTrafficPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<TrafficMode>("medium")
  const [stats, setStats] = useState({ requests: 0, errors: 0, totalBytes: 0 })
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(false)

  const fireRequest = useCallback(async () => {
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)]
    const start = performance.now()

    try {
      let res: Response
      if (endpoint.method === "POST") {
        const payload = JSON.stringify({ count: 5, payload: `auto-${Date.now()}` })
        res = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        })
        const data = await res.text()
        const latency = Math.round(performance.now() - start)
        const bytesIn = data.length
        const bytesOut = payload.length
        onTraffic(bytesIn, bytesOut)
        onRequest(endpoint.method, endpoint.url, res.status, bytesIn, bytesOut, latency)
        setStats(prev => ({ ...prev, requests: prev.requests + 1, totalBytes: prev.totalBytes + bytesIn + bytesOut }))
      } else {
        res = await fetch(endpoint.url)
        const data = await res.text()
        const latency = Math.round(performance.now() - start)
        const bytesIn = data.length
        onTraffic(bytesIn, 50)
        onRequest(endpoint.method, endpoint.url, res.status, bytesIn, 50, latency)
        setStats(prev => ({ ...prev, requests: prev.requests + 1, totalBytes: prev.totalBytes + bytesIn }))
      }
    } catch {
      const latency = Math.round(performance.now() - start)
      onRequest(endpoint.method, endpoint.url, 0, 0, 0, latency)
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
    }
  }, [onTraffic, onRequest])

  const start = useCallback(() => {
    const config = MODES[mode]
    setIsRunning(true)
    runningRef.current = true
    setStats({ requests: 0, errors: 0, totalBytes: 0 })
    setElapsed(0)
    onConnectionChange(config.concurrent)

    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    intervalRef.current = setInterval(() => {
      if (!runningRef.current) return
      for (let i = 0; i < config.concurrent; i++) {
        fireRequest()
      }
    }, config.interval)
  }, [mode, fireRequest, onConnectionChange])

  const stop = useCallback(() => {
    const config = MODES[mode]
    runningRef.current = false
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    onConnectionChange(-config.concurrent)
  }, [mode, onConnectionChange])

  useEffect(() => {
    return () => {
      runningRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatBytes = (b: number) => {
    if (b === 0) return "0 B"
    const k = 1024
    const s = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(b) / Math.log(k))
    return (b / Math.pow(k, i)).toFixed(1) + " " + s[i]
  }

  const rps = elapsed > 0 ? (stats.requests / elapsed).toFixed(1) : "0"

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Auto-Generador de Trafico</CardTitle>
        </div>
        <CardDescription>Genera trafico continuo automaticamente contra multiples endpoints</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {(Object.entries(MODES) as [TrafficMode, typeof MODES[TrafficMode]][]).map(([key, cfg]) => (
            <Button
              key={key}
              size="sm"
              variant={mode === key ? "default" : "outline"}
              onClick={() => { if (!isRunning) setMode(key) }}
              disabled={isRunning}
              className="flex flex-col h-auto py-2 gap-0.5 text-xs"
            >
              <span className="font-semibold">{cfg.label}</span>
              <span className="text-[10px] opacity-70">{cfg.description}</span>
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {isRunning ? (
            <Button size="sm" variant="destructive" onClick={stop} className="flex items-center gap-1.5">
              <Square className="h-3 w-3" />
              Detener
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="flex items-center gap-1.5">
              <Play className="h-3 w-3" />
              Iniciar Trafico
            </Button>
          )}
          {isRunning && (
            <Badge className="animate-pulse flex items-center gap-1.5">
              <Gauge className="h-3 w-3" />
              Generando...
            </Badge>
          )}
        </div>

        {(isRunning || stats.requests > 0) && (
          <>
            {isRunning && (
              <Progress value={(elapsed % 60) / 60 * 100} className="h-1.5" />
            )}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Requests</p>
                <p className="font-mono text-sm font-bold text-foreground">{stats.requests}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Bytes Total</p>
                <p className="font-mono text-sm font-bold text-accent">{formatBytes(stats.totalBytes)}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Req/s</p>
                <p className="font-mono text-sm font-bold text-primary">{rps}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Tiempo</p>
                <p className="font-mono text-sm font-bold text-foreground">{elapsed}s</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
