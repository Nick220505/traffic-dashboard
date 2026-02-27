"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrafficStats } from "@/components/traffic-stats"
import { TrafficChart } from "@/components/traffic-chart"
import { PingPanel } from "@/components/ping-panel"
import { DataTransferPanel } from "@/components/data-transfer-panel"
import { StreamPanel } from "@/components/stream-panel"
import { FloodPanel } from "@/components/flood-panel"
import { DnsPanel } from "@/components/dns-panel"
import { HeadersPanel } from "@/components/headers-panel"
import { VideoPanel } from "@/components/video-panel"
import { ImageLoaderPanel } from "@/components/image-loader-panel"
import { RequestLog, type LogEntry } from "@/components/request-log"
import { Activity, Globe, Video, BarChart3 } from "lucide-react"

interface ChartDataPoint {
  time: string
  bytesIn: number
  bytesOut: number
  requests: number
}

export default function Home() {
  const [totalRequests, setTotalRequests] = useState(0)
  const [totalBytesIn, setTotalBytesIn] = useState(0)
  const [totalBytesOut, setTotalBytesOut] = useState(0)
  const [activeConnections, setActiveConnections] = useState(0)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])

  const logIdRef = useRef(0)
  const accumulatorRef = useRef({ bytesIn: 0, bytesOut: 0, requests: 0 })

  const handleTraffic = useCallback((bytesIn: number, bytesOut: number) => {
    setTotalBytesIn((prev) => prev + bytesIn)
    setTotalBytesOut((prev) => prev + bytesOut)
    accumulatorRef.current.bytesIn += bytesIn
    accumulatorRef.current.bytesOut += bytesOut
  }, [])

  const handleRequest = useCallback(() => {
    setTotalRequests((prev) => prev + 1)
    accumulatorRef.current.requests += 1

    const logEntry: LogEntry = {
      id: logIdRef.current++,
      timestamp: Date.now(),
      type: "HTTP",
      method: "GET",
      url: "/api/*",
      status: 200,
      bytesIn: 0,
      bytesOut: 0,
      latency: Math.floor(Math.random() * 200 + 10),
    }
    setLogs((prev) => [logEntry, ...prev].slice(0, 100))
  }, [])

  const handleConnectionChange = useCallback((delta: number) => {
    setActiveConnections((prev) => Math.max(0, prev + delta))
  }, [])

  // Chart data accumulator - ticks every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const { bytesIn, bytesOut, requests } = accumulatorRef.current

      if (bytesIn > 0 || bytesOut > 0 || requests > 0) {
        setChartData((prev) => {
          const now = new Date()
          const time = now.toLocaleTimeString("es-MX", {
            hour12: false,
            minute: "2-digit",
            second: "2-digit",
          })
          const newPoint: ChartDataPoint = { time, bytesIn, bytesOut, requests }
          accumulatorRef.current = { bytesIn: 0, bytesOut: 0, requests: 0 }
          return [...prev, newPoint].slice(-60)
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <TrafficStats
          totalRequests={totalRequests}
          totalBytesIn={totalBytesIn}
          totalBytesOut={totalBytesOut}
          activeConnections={activeConnections}
        />

        <TrafficChart data={chartData} />

        <Tabs defaultValue="network" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="network" className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Red
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Protocolos
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Media
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network">
            <div className="grid gap-4 md:grid-cols-2">
              <PingPanel onTraffic={handleTraffic} onRequest={handleRequest} />
              <DataTransferPanel onTraffic={handleTraffic} onRequest={handleRequest} />
              <FloodPanel onTraffic={handleTraffic} onRequest={handleRequest} />
              <StreamPanel
                onTraffic={handleTraffic}
                onRequest={handleRequest}
                onConnectionChange={handleConnectionChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="protocols">
            <div className="grid gap-4 md:grid-cols-2">
              <DnsPanel onTraffic={handleTraffic} onRequest={handleRequest} />
              <HeadersPanel onTraffic={handleTraffic} onRequest={handleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-4 md:grid-cols-2">
              <VideoPanel />
              <ImageLoaderPanel onTraffic={handleTraffic} onRequest={handleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <RequestLog logs={logs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
