'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  History,
  Settings,
  Menu,
  Sparkles,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  
  return (
    <div className="flex h-full flex-col border-r border-border bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          {(isMobile || !sidebarCollapsed) && (
            <span className="text-lg font-semibold">
              Meeting Intelligence
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(isMobile || !sidebarCollapsed) && (
                <span className="overflow-hidden whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse button - desktop only */}
      {!isMobile && (
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full"
          >
            <Menu className="h-5 w-5" />
            {!sidebarCollapsed && (
              <span className="ml-2 text-sm">Collapse</span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { sidebarCollapsed } = useUIStore()

  // Desktop: Fixed sidebar
  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed ? '80px' : '256px',
      }}
      transition={{ duration: 0.2 }}
      className="hidden md:block"
    >
      <SidebarContent isMobile={false} />
    </motion.aside>
  )
}

// Mobile sidebar component (used in Topbar)
export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent isMobile={true} />
      </SheetContent>
    </Sheet>
  )
}
