'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useNotificationStore } from '@/lib/notification-store'
import { cn, relativeTime } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Header() {
  const pathname = usePathname()
  const { t, language } = useTranslation()
  const { toggleSidebar, theme, toggleTheme, setLanguage } = useAppStore()
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
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
  const visibleNotifications = mounted ? notifications : []

  const typeStyles = {
    info: 'border-primary/70',
    warning: 'border-amber-500/80',
    success: 'border-green-500/80',
  } as const

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
              className="button-smooth relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary dark:shadow-none"
              aria-label={t.header.notifications}
            >
              <Bell className="h-4 w-4" />
              {mounted && unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[360px] rounded-2xl border-border bg-popover p-0 shadow-lg dark:shadow-none"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t.header.notifications}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {visibleNotifications.length === 0
                    ? t.header.noNotifications
                    : unreadCount > 0
                      ? `${unreadCount} ${t.header.unread}`
                      : t.header.allRead}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={!mounted || unreadCount === 0}
                className="button-smooth text-xs font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                {t.header.markAllRead}
              </button>
            </div>
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-5 text-sm text-muted-foreground">{t.header.noNotifications}</div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto p-2">
                {visibleNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'button-smooth w-full rounded-2xl border border-border border-l-4 px-4 py-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-muted/60',
                        typeStyles[notification.type],
                        notification.read ? 'bg-card/70' : 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground/80">
                          {relativeTime(notification.timestamp, language)}
                        </span>
                      </div>
                    </button>
                    {index < visibleNotifications.length - 1 ? <DropdownMenuSeparator className="mx-1 my-1.5" /> : null}
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
