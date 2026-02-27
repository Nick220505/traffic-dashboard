"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio } from "lucide-react"

interface PingResult {
  id: number
  status: string
  latency: number
  timestamp: number
}

interface PingPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

export function PingPanel({ onTraffic, onRequest }: PingPanelProps) {
  const [results, setResults] = useState<PingResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [count, setCount] = useState(0)

  const sendPing = useCallback(async () => {
    const start = performance.now()
    onRequest()
    try {
      const res = await fetch("/api/ping")
      const data = await res.json()
      const latency = Math.round(performance.now() - start)
      const bytesIn = JSON.stringify(data).length
      onTraffic(bytesIn, 0)
      return { id: count, status: data.status, latency, timestamp: data.timestamp }
    } catch {
      return { id: count, status: "error", latency: -1, timestamp: Date.now() }
    }
  }, [count, onTraffic, onRequest])

  const runPingBurst = async (burstCount: number) => {
    setIsRunning(true)
    const newResults: PingResult[] = []
    for (let i = 0; i < burstCount; i++) {
      const result = await sendPing()
      setCount((prev) => prev + 1)
      newResults.push({ ...result, id: count + i })
      setResults((prev) => [{ ...result, id: count + i }, ...prev].slice(0, 20))
      await new Promise((r) => setTimeout(r, 200))
    }
    setIsRunning(false)
  }

  const avgLatency =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.latency > 0 ? r.latency : 0), 0) / results.filter((r) => r.latency > 0).length) || 0
      : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Ping / Latencia</CardTitle>
        </div>
        <CardDescription>Envia paquetes ICMP simulados al servidor</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => runPingBurst(1)} disabled={isRunning}>
            1 Ping
          </Button>
          <Button size="sm" variant="secondary" onClick={() => runPingBurst(5)} disabled={isRunning}>
            5 Pings
          </Button>
          <Button size="sm" variant="secondary" onClick={() => runPingBurst(20)} disabled={isRunning}>
            20 Pings
          </Button>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              AVG: {avgLatency}ms
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Total: {results.length}
            </Badge>
          </div>
        )}
        <div className="max-h-48 overflow-y-auto rounded-lg bg-secondary/50 p-2">
          {results.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Sin resultados. Haz clic en un boton para iniciar.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((r, i) => (
                <div key={`${r.id}-${i}`} className="flex items-center justify-between rounded px-2 py-1 text-xs font-mono">
                  <span className="text-muted-foreground">#{r.id + 1}</span>
                  <span className={r.status === "pong" ? "text-accent" : "text-destructive"}>
                    {r.status}
                  </span>
                  <span className={r.latency < 100 ? "text-accent" : r.latency < 300 ? "text-chart-3" : "text-chart-4"}>
                    {r.latency > 0 ? `${r.latency}ms` : "timeout"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
