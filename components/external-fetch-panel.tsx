"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, ExternalLink } from "lucide-react"

interface ExternalFetchPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => void
}

const TARGETS = [
  { key: "jsonplaceholder", label: "JSONPlaceholder", desc: "REST API de prueba" },
  { key: "catfacts", label: "Cat Facts", desc: "API de datos curiosos" },
  { key: "dogapi", label: "Dog API", desc: "Imagenes aleatorias" },
  { key: "universities", label: "Universidades MX", desc: "Lista de universidades" },
  { key: "numbersapi", label: "Numbers API", desc: "Datos sobre numeros" },
]

interface FetchResult {
  target: string
  status: number
  bytesReceived: number
  latency: number
  data: unknown
  externalUrl: string
}

export function ExternalFetchPanel({ onTraffic, onRequest }: ExternalFetchPanelProps) {
  const [results, setResults] = useState<FetchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null)

  const fetchExternal = useCallback(async (target: string) => {
    setLoadingTarget(target)
    setIsLoading(true)
    const url = `/api/external?target=${target}`
    const start = performance.now()

    try {
      const res = await fetch(url)
      const data = await res.json()
      const latency = Math.round(performance.now() - start)
      const bytesIn = JSON.stringify(data).length

      onTraffic(bytesIn, target.length + 30)
      onRequest("GET", url, res.status, bytesIn, target.length + 30, latency)

      setResults(prev => [{
        target: data.target || target,
        status: data.status || res.status,
        bytesReceived: data.bytesReceived || bytesIn,
        latency: data.latency || latency,
        data: data.data,
        externalUrl: data.url || "",
      }, ...prev].slice(0, 10))
    } catch {
      onRequest("GET", url, 0, 0, 0, Math.round(performance.now() - start))
    }

    setIsLoading(false)
    setLoadingTarget(null)
  }, [onTraffic, onRequest])

  const fetchAll = async () => {
    setIsLoading(true)
    for (const t of TARGETS) {
      await fetchExternal(t.key)
      await new Promise(r => setTimeout(r, 500))
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-chart-3" />
          <CardTitle className="text-sm">Fetch a APIs Externas</CardTitle>
        </div>
        <CardDescription>
          El servidor hace requests reales a APIs externas (trafico de ida y vuelta real)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {TARGETS.map(t => (
            <button
              key={t.key}
              onClick={() => fetchExternal(t.key)}
              disabled={isLoading}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                loadingTarget === t.key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              } disabled:opacity-50`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">{t.desc}</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
        <Button size="sm" onClick={fetchAll} disabled={isLoading}>
          Consultar Todas
        </Button>
        {results.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg bg-secondary/50 p-2">
            <div className="flex flex-col gap-2">
              {results.map((r, i) => (
                <div key={`${r.target}-${i}`} className="rounded bg-background/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{r.target}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.status}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.latency}ms
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{r.externalUrl}</p>
                  <p className="font-mono text-[10px] text-accent">{r.bytesReceived} bytes</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
