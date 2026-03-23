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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        style={{
          width: sidebarOpen ? 256 : 72,
          background: 'linear-gradient(180deg, #0d1529 0%, #0a1020 100%)',
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'transition-[width] duration-300 ease-in-out',
          'border-r border-[var(--sidebar-border)]',
          !sidebarOpen && 'max-md:-translate-x-full md:translate-x-0',
          sidebarOpen && 'max-md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Building2 className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="block truncate font-semibold tracking-tight text-white">
                RE:Agent
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                Back Office
              </span>
            </div>
          )}
        </div>

        {/* New chat button */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={handleNewChat}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border border-emerald-500/40 px-3 py-2',
              'text-emerald-400 transition-all duration-150',
              'hover:bg-emerald-500/10 hover:border-emerald-500/60',
              !sidebarOpen && 'justify-center px-0',
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Nový chat</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <ul className="space-y-1 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                      'transition-all duration-150',
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                    {sidebarOpen && (
                      <span className="truncate">{label}</span>
                    )}
                    {isActive && sidebarOpen && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-semibold text-white shadow-lg">
              PN
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">Pepa Novotný</p>
                <p className="truncate text-[11px] text-slate-500">Back Office Manager</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-10 w-full items-center gap-3 border-t border-[var(--sidebar-border)] px-3',
            'text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300',
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
