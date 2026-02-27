"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal } from "lucide-react"

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
}

export function RequestLog({ logs }: RequestLogProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm">Log de Peticiones</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {logs.length} entries
          </Badge>
        </div>
        <CardDescription>Registro en tiempo real de todas las peticiones HTTP</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px]">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Esperando peticiones...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 font-mono text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary/50"
                >
                  <span className="text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString("es-MX", { hour12: false })}
                  </span>
                  <Badge
                    variant={log.method === "GET" ? "secondary" : "default"}
                    className="shrink-0 text-xs px-1.5 py-0"
                  >
                    {log.method}
                  </Badge>
                  <span className="text-foreground truncate">{log.url}</span>
                  <span
                    className={`ml-auto shrink-0 ${
                      log.status === 200 ? "text-accent" : "text-destructive"
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-muted-foreground shrink-0">{log.latency}ms</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
