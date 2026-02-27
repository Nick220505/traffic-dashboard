"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface HeadersPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

export function HeadersPanel({ onTraffic, onRequest }: HeadersPanelProps) {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [meta, setMeta] = useState<{ ip: string; count: number } | null>(null)

  const fetchHeaders = async () => {
    setIsLoading(true)
    onRequest()
    try {
      const res = await fetch("/api/headers")
      const data = await res.json()
      onTraffic(JSON.stringify(data).length, 30)
      setHeaders(data.headers)
      setMeta({ ip: data.ip, count: data.count })
    } catch {
      // error
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-chart-5" />
          <CardTitle className="text-sm">HTTP Headers</CardTitle>
        </div>
        <CardDescription>Inspecciona los headers de tu peticion HTTP</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button size="sm" onClick={fetchHeaders} disabled={isLoading}>
          Inspeccionar Headers
        </Button>
        {meta && (
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              IP: {meta.ip}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {meta.count} headers
            </Badge>
          </div>
        )}
        {headers && (
          <div className="max-h-56 overflow-y-auto rounded-lg bg-secondary/50 p-2">
            <div className="flex flex-col gap-1">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 rounded px-2 py-1 text-xs font-mono">
                  <span className="text-primary font-semibold shrink-0">{key}:</span>
                  <span className="text-muted-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
