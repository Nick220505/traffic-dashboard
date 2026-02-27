"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrafficStats } from "@/components/traffic-stats"
import { TrafficChart } from "@/components/traffic-chart"
import { AutoTrafficPanel } from "@/components/auto-traffic-panel"
import { PingPanel } from "@/components/ping-panel"
import { DataTransferPanel } from "@/components/data-transfer-panel"
import { StreamPanel } from "@/components/stream-panel"
import { FloodPanel } from "@/components/flood-panel"
import { DownloadPanel } from "@/components/download-panel"
import { ExternalFetchPanel } from "@/components/external-fetch-panel"
import { PollingPanel } from "@/components/polling-panel"
import { DnsPanel } from "@/components/dns-panel"
import { HeadersPanel } from "@/components/headers-panel"
import { VideoPanel } from "@/components/video-panel"
import { ImageLoaderPanel } from "@/components/image-loader-panel"
import { RequestLog, type LogEntry } from "@/components/request-log"
import { Activity, Globe, Video, BarChart3, ArrowUpDown, Zap } from "lucide-react"

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

  // Detailed log for new components
  const handleDetailedRequest = useCallback(
    (method: string, url: string, status: number, bytesIn: number, bytesOut: number, latency: number) => {
      setTotalRequests((prev) => prev + 1)
      accumulatorRef.current.requests += 1

      const logEntry: LogEntry = {
        id: logIdRef.current++,
        timestamp: Date.now(),
        type: "HTTP",
        method,
        url,
        status,
        bytesIn,
        bytesOut,
        latency,
      }
      setLogs((prev) => [logEntry, ...prev].slice(0, 200))
    },
    []
  )

  // Simple log for legacy components
  const handleSimpleRequest = useCallback(() => {
    setTotalRequests((prev) => prev + 1)
    accumulatorRef.current.requests += 1
  }, [])

  const handleConnectionChange = useCallback((delta: number) => {
    setActiveConnections((prev) => Math.max(0, prev + delta))
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
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
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <TrafficStats
          totalRequests={totalRequests}
          totalBytesIn={totalBytesIn}
          totalBytesOut={totalBytesOut}
          activeConnections={activeConnections}
        />

        <AutoTrafficPanel
          onTraffic={handleTraffic}
          onRequest={handleDetailedRequest}
          onConnectionChange={handleConnectionChange}
        />

        <TrafficChart data={chartData} />

        <Tabs defaultValue="transfers" className="flex flex-col gap-4">
          <TabsList className="w-fit flex-wrap h-auto gap-1">
            <TabsTrigger value="transfers" className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Transferencias
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Red
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Externo
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Media
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Tiempo Real
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfers">
            <div className="grid gap-4 md:grid-cols-2">
              <DownloadPanel onTraffic={handleTraffic} onRequest={handleDetailedRequest} />
              <DataTransferPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="network">
            <div className="grid gap-4 md:grid-cols-2">
              <PingPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
              <FloodPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
              <DnsPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
              <HeadersPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="external">
            <div className="grid gap-4 md:grid-cols-2">
              <ExternalFetchPanel onTraffic={handleTraffic} onRequest={handleDetailedRequest} />
              <DnsPanel onTraffic={handleTraffic} onRequest={handleSimpleRequest} />
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-4 md:grid-cols-2">
              <VideoPanel onTraffic={handleTraffic} onRequest={handleDetailedRequest} />
              <ImageLoaderPanel onTraffic={handleTraffic} onRequest={handleDetailedRequest} />
            </div>
          </TabsContent>

          <TabsContent value="realtime">
            <div className="grid gap-4 md:grid-cols-2">
              <StreamPanel
                onTraffic={handleTraffic}
                onRequest={handleSimpleRequest}
                onConnectionChange={handleConnectionChange}
              />
              <PollingPanel
                onTraffic={handleTraffic}
                onRequest={handleDetailedRequest}
                onConnectionChange={handleConnectionChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <RequestLog logs={logs} onClear={clearLogs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
