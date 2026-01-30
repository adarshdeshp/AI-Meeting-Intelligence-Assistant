'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { RightPanel } from './RightPanel'
import { useUIStore } from '@/store/uiStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { rightPanelOpen } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Center content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-4xl px-4 py-6">
              {children}
            </div>
          </main>

          {/* Right Panel - Desktop only */}
          {rightPanelOpen && (
            <div className="hidden lg:block">
              <RightPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
