"use client"

import { Activity, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("es-MX", { hour12: false }))
    }, 1000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(timer)
    }
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">NetTraffic Lab</h1>
          <p className="text-xs text-muted-foreground">Generador de Trafico de Red</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-muted-foreground">{currentTime}</span>
        <Badge
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1.5"
        >
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
    </header>
  )
}
