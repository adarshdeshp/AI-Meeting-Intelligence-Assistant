'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-muted-foreground">
            View and manage your past meetings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meeting History</CardTitle>
            <CardDescription>
              History endpoint not yet configured
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              Meeting history will appear here once the list endpoint is enabled.
            </p>
            <Button onClick={() => router.push('/')}>
              Upload a Meeting
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
