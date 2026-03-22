'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore(s => s.sidebarOpen)

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-hidden',
        'transition-[margin-left] duration-300 ease-in-out',
        // Mobile: sidebar overlays, no margin
        // Desktop: margin matches sidebar width
        sidebarOpen ? 'md:ml-[256px]' : 'md:ml-[72px]',
      )}
    >
      {children}
    </div>
  )
}
