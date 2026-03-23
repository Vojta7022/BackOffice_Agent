'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useChatStore } from '@/lib/chat-store'

const navItems = [
  { href: '/',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/chat',        label: 'Chat s agentem',  icon: MessageSquare },
  { href: '/properties',  label: 'Nemovitosti',     icon: Home },
  { href: '/clients',     label: 'Klienti',         icon: Users },
  { href: '/tasks',       label: 'Úkoly',           icon: CheckSquare },
  { href: '/monitoring',  label: 'Monitoring',      icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()
  const clearMessages = useChatStore(s => s.clearMessages)

  const handleNewChat = () => {
    clearMessages()
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
                Back Office
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
            {sidebarOpen && <span className="text-sm font-medium">Nový chat</span>}
          </button>
        </div>

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
                <p className="truncate text-[11px] text-sidebar-foreground/50">Back Office Manager</p>
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
              <span className="text-xs">Sbalit</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
      </aside>
    </>
  )
}
