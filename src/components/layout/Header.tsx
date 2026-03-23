'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const title = pageTitles[pathname] ?? pageTitles[
    Object.keys(pageTitles).find(k => k !== '/' && pathname.startsWith(k)) ?? '/'
  ]

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={toggleSidebar}
        className="button-smooth rounded-xl border border-transparent p-2 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="flex-1 text-base font-semibold text-foreground md:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="button-smooth inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary dark:shadow-none"
          aria-label="Přepnout motiv"
        >
          {!mounted ? (
            <span className="h-4 w-4 rounded-full bg-muted" />
          ) : theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="button-smooth inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary dark:shadow-none"
              aria-label="Notifikace"
            >
              <Bell className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-2xl border-border bg-popover p-0 shadow-lg dark:shadow-none"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifikace</p>
              <p className="mt-1 text-xs text-muted-foreground">Žádné nové notifikace</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
