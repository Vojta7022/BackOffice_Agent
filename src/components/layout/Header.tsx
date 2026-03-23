'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/useTranslation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Header() {
  const pathname = usePathname()
  const { t, language } = useTranslation()
  const { toggleSidebar, theme, toggleTheme, setLanguage } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pageTitles: Record<string, string> = {
    '/': t.nav.dashboard,
    '/chat': t.nav.chat,
    '/properties': t.nav.properties,
    '/clients': t.nav.clients,
    '/tasks': t.nav.tasks,
    '/monitoring': t.nav.monitoring,
  }

  const title = pageTitles[pathname] ?? pageTitles[
    Object.keys(pageTitles).find((key) => key !== '/' && pathname.startsWith(key)) ?? '/'
  ]

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={toggleSidebar}
        className="button-smooth rounded-xl border border-transparent p-2 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground md:hidden"
        aria-label={t.header.toggleMenu}
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="flex-1 text-base font-semibold text-foreground md:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'cs' ? 'en' : 'cs')}
          className="button-smooth inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-card px-2 text-xs font-semibold text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary dark:shadow-none"
          aria-label={t.header.toggleLanguage}
        >
          {language.toUpperCase()}
        </button>

        <button
          onClick={toggleTheme}
          className="button-smooth inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary dark:shadow-none"
          aria-label={t.header.toggleTheme}
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
              aria-label={t.header.notifications}
            >
              <Bell className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-2xl border-border bg-popover p-0 shadow-lg dark:shadow-none"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{t.header.notifications}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.header.noNotifications}</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
