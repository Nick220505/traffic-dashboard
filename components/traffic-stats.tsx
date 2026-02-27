"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Globe, Zap } from "lucide-react"

interface TrafficStatsProps {
  totalRequests: number
  totalBytesIn: number
  totalBytesOut: number
  activeConnections: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function TrafficStats({
  totalRequests,
  totalBytesIn,
  totalBytesOut,
  activeConnections,
}: TrafficStatsProps) {
  const stats = [
    {
      label: "Requests Totales",
      value: totalRequests.toLocaleString(),
      icon: Globe,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Datos Recibidos",
      value: formatBytes(totalBytesIn),
      icon: ArrowDown,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Datos Enviados",
      value: formatBytes(totalBytesOut),
      icon: ArrowUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Conexiones Activas",
      value: activeConnections.toString(),
      icon: Zap,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <div className={`flex items-center justify-center rounded-lg ${stat.bgColor} p-2`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
