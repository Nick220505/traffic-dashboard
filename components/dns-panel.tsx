"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface DnsRecord {
  ip: string
  ttl: number
  type: string
}

interface DnsResult {
  domain: string
  records: DnsRecord[]
  queryTime: number
  server: string
}

interface DnsPanelProps {
  onTraffic: (bytesIn: number, bytesOut: number) => void
  onRequest: () => void
}

const DOMAINS = ["google.com", "github.com", "cloudflare.com", "amazon.com", "netflix.com"]

export function DnsPanel({ onTraffic, onRequest }: DnsPanelProps) {
  const [results, setResults] = useState<DnsResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const lookupDns = async (domain: string) => {
    setIsLoading(true)
    onRequest()
    try {
      const res = await fetch(`/api/dns?domain=${domain}`)
      const data = await res.json()
      onTraffic(JSON.stringify(data).length, domain.length + 20)
      setResults((prev) => [data, ...prev].slice(0, 10))
    } catch {
      // error
    }
    setIsLoading(false)
  }

  const lookupAll = async () => {
    setIsLoading(true)
    for (const domain of DOMAINS) {
      await lookupDns(domain)
      await new Promise((r) => setTimeout(r, 300))
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm">DNS Lookup</CardTitle>
        </div>
        <CardDescription>Consultas DNS simuladas a dominios populares</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((domain) => (
            <Button
              key={domain}
              size="sm"
              variant="outline"
              onClick={() => lookupDns(domain)}
              disabled={isLoading}
              className="font-mono text-xs"
            >
              {domain}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={lookupAll} disabled={isLoading}>
          Consultar Todos
        </Button>
        <div className="max-h-48 overflow-y-auto rounded-lg bg-secondary/50 p-2">
          {results.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Sin resultados. Selecciona un dominio.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((r, i) => (
                <div key={`${r.domain}-${i}`} className="rounded bg-background/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{r.domain}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {r.queryTime}ms
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.records.map((rec, j) => (
                      <Badge key={j} variant="secondary" className="font-mono text-xs">
                        {rec.type}: {rec.ip}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
