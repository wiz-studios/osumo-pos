"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"

export function OnlineChecker() {
    const [isOnline, setIsOnline] = useState(true)
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        // Check initial online status
        setIsOnline(navigator.onLine)

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const checkConnection = async () => {
        setChecking(true)
        try {
            // Try to fetch a small resource to verify actual connectivity
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache'
            })
            setIsOnline(response.ok)
        } catch {
            setIsOnline(false)
        } finally {
            setChecking(false)
        }
    }

    if (isOnline) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-destructive/10 p-4">
                            <WifiOff className="h-12 w-12 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl text-center">No Internet Connection</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-muted-foreground">
                        This POS requires an active internet connection to function.
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                        Please check your Wi-Fi or mobile data and try again.
                    </p>
                    <Button
                        onClick={checkConnection}
                        disabled={checking}
                        className="w-full gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'Retry Connection'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
