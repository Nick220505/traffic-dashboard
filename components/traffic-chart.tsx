"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface TrafficChartProps {
  data: Array<{
    time: string
    bytesIn: number
    bytesOut: number
    requests: number
  }>
}

export function TrafficChart({ data }: TrafficChartProps) {
  const latestData = data.slice(-30)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Trafico en Tiempo Real</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary" />
              Entrada
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent" />
              Salida
            </Badge>
          </div>
        </div>
        <CardDescription>Bytes transferidos por segundo</CardDescription>
      </CardHeader>
      <CardContent>
        {latestData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latestData}>
              <defs>
                <linearGradient id="bytesInGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bytesOutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.18 170)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.18 170)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 270)" />
              <XAxis
                dataKey="time"
                stroke="oklch(0.6 0.01 270)"
                tick={{ fontSize: 10, fill: "oklch(0.6 0.01 270)" }}
              />
              <YAxis
                stroke="oklch(0.6 0.01 270)"
                tick={{ fontSize: 10, fill: "oklch(0.6 0.01 270)" }}
                tickFormatter={(v) => (v > 1024 ? `${(v / 1024).toFixed(0)}K` : `${v}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 270)",
                  border: "1px solid oklch(0.25 0.01 270)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "oklch(0.95 0 0)",
                }}
              />
              <Area
                type="monotone"
                dataKey="bytesIn"
                stroke="oklch(0.65 0.2 250)"
                fill="url(#bytesInGradient)"
                strokeWidth={2}
                name="Bytes In"
              />
              <Area
                type="monotone"
                dataKey="bytesOut"
                stroke="oklch(0.7 0.18 170)"
                fill="url(#bytesOutGradient)"
                strokeWidth={2}
                name="Bytes Out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Genera trafico para ver el grafico en tiempo real
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
