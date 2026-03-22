'use client'

import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const pageTitles: Record<string, string> = {
  '/':            'Dashboard',
  '/chat':        'Chat s agentem',
  '/properties':  'Nemovitosti',
  '/clients':     'Klienti',
  '/tasks':       'Úkoly',
  '/monitoring':  'Monitoring',
}

export default function Header() {
  const pathname = usePathname()
  const { toggleSidebar, theme, toggleTheme } = useAppStore()

  const title = pageTitles[pathname] ?? pageTitles[
    Object.keys(pageTitles).find(k => k !== '/' && pathname.startsWith(k)) ?? '/'
  ]

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-md md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base font-semibold text-[var(--foreground)] md:text-lg">
        {title}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--background)]" />
        </button>
      </div>
    </header>
  )
}
