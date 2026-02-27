"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame } from "lucide-react"

interface FloodPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

export function FloodPanel({ onTraffic, onRequest }: FloodPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    total: number
    time: number
    bytesIn: number
    bytesOut: number
  } | null>(null)

  const runFlood = async (requestCount: number, concurrent: number) => {
    setIsRunning(true)
    setProgress(0)
    setResult(null)

    const start = performance.now()
    let totalBytesIn = 0
    let totalBytesOut = 0
    let completed = 0

    const batches = Math.ceil(requestCount / concurrent)

    for (let b = 0; b < batches; b++) {
      const batchSize = Math.min(concurrent, requestCount - b * concurrent)
      const promises = Array.from({ length: batchSize }, (_, i) => {
        const payload = { count: 10, payload: `flood-${b * concurrent + i}` }
        const payloadStr = JSON.stringify(payload)
        totalBytesOut += payloadStr.length
        onRequest()

        return fetch("/api/flood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadStr,
        }).then(async (res) => {
          const data = await res.json()
          totalBytesIn += JSON.stringify(data).length
          onTraffic(JSON.stringify(data).length, payloadStr.length)
          completed++
          setProgress((completed / requestCount) * 100)
        }).catch(() => {
          completed++
          setProgress((completed / requestCount) * 100)
        })
      })

      await Promise.all(promises)
    }

    const elapsed = Math.round(performance.now() - start)
    setResult({
      total: requestCount,
      time: elapsed,
      bytesIn: totalBytesIn,
      bytesOut: totalBytesOut,
    })
    setIsRunning(false)
    setProgress(100)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-chart-4" />
          <CardTitle className="text-sm">Flood de Requests</CardTitle>
        </div>
        <CardDescription>Envio masivo de peticiones HTTP concurrentes</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => runFlood(10, 5)} disabled={isRunning} className="text-xs">
            10 reqs / 5 conc
          </Button>
          <Button size="sm" variant="secondary" onClick={() => runFlood(25, 5)} disabled={isRunning} className="text-xs">
            25 reqs / 5 conc
          </Button>
          <Button size="sm" variant="secondary" onClick={() => runFlood(50, 10)} disabled={isRunning} className="text-xs">
            50 reqs / 10 conc
          </Button>
          <Button size="sm" onClick={() => runFlood(100, 10)} disabled={isRunning} className="text-xs">
            100 reqs / 10 conc
          </Button>
        </div>
        {isRunning && <Progress value={progress} className="h-2" />}
        {result && !isRunning && (
          <div className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {result.total} requests
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {result.time}ms total
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs text-accent">
                IN: {(result.bytesIn / 1024).toFixed(1)} KB
              </Badge>
              <Badge variant="outline" className="font-mono text-xs text-chart-3">
                OUT: {(result.bytesOut / 1024).toFixed(1)} KB
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {(result.total / (result.time / 1000)).toFixed(0)} req/s
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
