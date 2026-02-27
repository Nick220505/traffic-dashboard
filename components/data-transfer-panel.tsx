"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"

interface DataTransferPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function DataTransferPanel({ onTraffic, onRequest }: DataTransferPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastTransfer, setLastTransfer] = useState<{ size: number; time: number } | null>(null)
  const [progress, setProgress] = useState(0)

  const fetchData = async (sizeKB: number) => {
    setIsLoading(true)
    setProgress(0)
    onRequest()

    const fakeProgress = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90))
    }, 100)

    const start = performance.now()
    try {
      const res = await fetch(`/api/data?size=${sizeKB}`)
      const text = await res.text()
      const elapsed = Math.round(performance.now() - start)
      const bytesIn = text.length
      onTraffic(bytesIn, 50)
      setLastTransfer({ size: bytesIn, time: elapsed })
    } catch {
      setLastTransfer(null)
    }

    clearInterval(fakeProgress)
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 500)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-chart-3" />
          <CardTitle className="text-sm">Transferencia de Datos</CardTitle>
        </div>
        <CardDescription>Descarga payloads de diferentes tamanos</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "10 KB", size: 10 },
            { label: "100 KB", size: 100 },
            { label: "500 KB", size: 500 },
            { label: "1 MB", size: 1024 },
            { label: "2 MB", size: 2048 },
            { label: "5 MB", size: 5000 },
          ].map((opt) => (
            <Button
              key={opt.size}
              size="sm"
              variant="secondary"
              onClick={() => fetchData(opt.size)}
              disabled={isLoading}
              className="font-mono text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        {isLoading && <Progress value={progress} className="h-2" />}
        {lastTransfer && !isLoading && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              {formatBytes(lastTransfer.size)}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {lastTransfer.time}ms
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {((lastTransfer.size / lastTransfer.time) * 1000 / 1024).toFixed(1)} KB/s
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
