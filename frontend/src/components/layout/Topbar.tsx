'use client'

import { Moon, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { MobileSidebar } from './Sidebar'

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4">
      <div className="flex items-center gap-4">
        {/* Mobile sidebar trigger */}
        <div className="md:hidden">
          <MobileSidebar />
        </div>
        <h1 className="text-lg font-semibold">AI Assistant</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* User profile (mock) */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
