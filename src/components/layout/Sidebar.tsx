'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Building2,
  LayoutDashboard,
  MessageSquare,
  Home,
  Users,
  CheckSquare,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react'
import { useHydrated } from '@/hooks/useHydrated'
import { selectConversationList, useChatStore } from '@/lib/chat-store'
import { translations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/useTranslation'

function formatConversationTime(timestamp: string, language: 'cs' | 'en') {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const hours = Math.max(0, Math.floor(diffMs / 3_600_000))

  if (hours < 1) {
    return language === 'en' ? 'just now' : 'prave ted'
  }

  if (hours < 24) {
    return language === 'en' ? `${hours}h ago` : `pred ${hours}h`
  }

  const days = Math.max(1, Math.floor(hours / 24))
  return language === 'en' ? `${days}d ago` : `pred ${days}d`
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language } = useTranslation()
  const hydrated = useHydrated()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()
  const createNewConversation = useChatStore((state) => state.createNewConversation)
  const setActiveConversation = useChatStore((state) => state.setActiveConversation)
  const deleteConversation = useChatStore((state) => state.deleteConversation)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const conversationList = useChatStore(selectConversationList)
  const [historyOpen, setHistoryOpen] = useState(true)
  const currentT = hydrated ? t : translations.cs
  const currentLanguage = hydrated ? language : 'cs'
  const visibleConversationList = hydrated ? conversationList : []

  const navItems = [
    { href: '/', label: currentT.nav.dashboard, icon: LayoutDashboard },
    { href: '/chat', label: currentT.nav.chat, icon: MessageSquare },
    { href: '/properties', label: currentT.nav.properties, icon: Home },
    { href: '/clients', label: currentT.nav.clients, icon: Users },
    { href: '/tasks', label: currentT.nav.tasks, icon: CheckSquare },
    { href: '/monitoring', label: currentT.nav.monitoring, icon: Bell },
  ]

  const handleNewChat = () => {
    createNewConversation()
    router.push('/chat')
  }

  // Collapse by default on mobile
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setSidebarOpen])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        style={{
          width: sidebarOpen ? 256 : 72,
          background: 'linear-gradient(180deg, var(--sidebar-gradient-start) 0%, var(--sidebar-gradient-end) 100%)',
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col text-sidebar-foreground',
          'transition-[width] duration-300 ease-in-out',
          'border-r border-sidebar-border shadow-sm dark:shadow-none',
          !sidebarOpen && 'max-md:-translate-x-full md:translate-x-0',
          sidebarOpen && 'max-md:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="block truncate font-semibold tracking-tight text-sidebar-foreground">
                RE:Agent
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                {currentT.nav.appCaption}
              </span>
            </div>
          )}
        </div>

        <div className="px-2 pt-3 pb-1">
          <button
            onClick={handleNewChat}
            className={cn(
              'button-smooth flex w-full items-center gap-2.5 rounded-xl border border-primary/25 bg-primary px-3 py-2 text-primary-foreground',
              'shadow-sm hover:scale-[1.01] hover:bg-primary/90 dark:shadow-none',
              !sidebarOpen && 'justify-center px-0',
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{currentT.nav.newChat}</span>}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-2 pb-2">
            <button
              type="button"
              onClick={() => setHistoryOpen((current) => !current)}
              className="button-smooth flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground/80"
            >
              <span>{currentT.nav.history}</span>
              <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', historyOpen && 'rotate-90')} />
            </button>

            {historyOpen ? (
              <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto">
                {visibleConversationList.map((conversation) => {
                  const isActive = conversation.id === activeConversationId
                  const displayTitle = conversation.title || currentT.nav.newChat

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setActiveConversation(conversation.id)
                        router.push('/chat')
                      }}
                      className={cn(
                        'group/button flex w-full items-start gap-2 rounded-2xl px-3 py-2 text-left transition-all duration-200',
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{displayTitle}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-sidebar-foreground/45">
                          <span>{formatConversationTime(conversation.updatedAt, currentLanguage)}</span>
                          <span className="rounded-full bg-sidebar-accent/80 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-foreground/70">
                            {conversation.messageCount}
                          </span>
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation()
                          deleteConversation(conversation.id)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
                            deleteConversation(conversation.id)
                          }
                        }}
                        className="button-smooth mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 opacity-0 hover:bg-sidebar-accent hover:text-sidebar-foreground/80 group-hover/button:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <ul className="space-y-1 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
                      'button-smooth',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80',
                      )}
                    />
                    {sidebarOpen && (
                      <span className="truncate">{label}</span>
                    )}
                    {isActive && sidebarOpen && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white shadow-sm dark:shadow-none">
              PN
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Pepa Novotný</p>
                <p className="truncate text-[11px] text-sidebar-foreground/50">{currentT.nav.userRole}</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className={cn(
            'button-smooth flex h-11 w-full items-center gap-3 border-t border-sidebar-border px-3',
            'text-sidebar-foreground/50 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground/80',
          )}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="text-xs">{currentT.nav.collapse}</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
      </aside>
    </>
  )
}
