"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Terminal, Trash2 } from "lucide-react"

export interface LogEntry {
  id: number
  timestamp: number
  type: string
  method: string
  url: string
  status: number
  bytesIn: number
  bytesOut: number
  latency: number
}

interface RequestLogProps {
  logs: LogEntry[]
  onClear?: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(0) + sizes[i]
}

export function RequestLog({ logs, onClear }: RequestLogProps) {
  const statusColor = (s: number) => {
    if (s >= 200 && s < 300) return "text-accent"
    if (s >= 300 && s < 400) return "text-chart-3"
    if (s >= 400 && s < 500) return "text-chart-4"
    if (s === 0) return "text-destructive"
    return "text-destructive"
  }

  const methodColor = (m: string) => {
    switch (m) {
      case "GET": return "bg-primary/15 text-primary"
      case "POST": return "bg-accent/15 text-accent"
      case "PUT": return "bg-chart-3/15 text-chart-3"
      case "DELETE": return "bg-destructive/15 text-destructive"
      default: return "bg-secondary text-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm">Log de Peticiones HTTP</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {logs.length} entries
            </Badge>
            {onClear && logs.length > 0 && (
              <Button size="sm" variant="ghost" onClick={onClear} className="h-6 px-2">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Registro detallado de todas las peticiones HTTP realizadas</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Esperando peticiones...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 font-mono text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary/50"
                >
                  <span className="text-muted-foreground shrink-0 w-16">
                    {new Date(log.timestamp).toLocaleTimeString("es-MX", { hour12: false })}
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor(log.method)}`}>
                    {log.method}
                  </span>
                  <span className="text-foreground truncate flex-1 min-w-0">{log.url}</span>
                  <span className={`shrink-0 font-bold ${statusColor(log.status)}`}>
                    {log.status || "ERR"}
                  </span>
                  {log.bytesIn > 0 && (
                    <span className="text-primary shrink-0">{formatBytes(log.bytesIn)}</span>
                  )}
                  <span className="text-muted-foreground shrink-0 w-12 text-right">{log.latency}ms</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
