'use client'

import Link from 'next/link'
import { UserPlus, Plus, FileText, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Action {
  label: string
  icon: React.ElementType
  href: string
  highlight?: boolean
}

const actions: Action[] = [
  { label: 'Nový klient',       icon: UserPlus,      href: '/clients' },
  { label: 'Nová nemovitost',   icon: Plus,          href: '/properties' },
  {
    label: 'Generovat report',
    icon: FileText,
    href: '/chat?prompt=Generuj+t%C3%BDdenn%C3%AD+report',
  },
  { label: 'Otevřít chat',      icon: MessageSquare, href: '/chat', highlight: true },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map(({ label, icon: Icon, href, highlight }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            'group flex flex-col items-center gap-2 rounded-xl border px-4 py-4',
            'text-sm font-medium transition-all duration-150',
            highlight
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'border-border bg-card text-muted-foreground hover:border-emerald-500/30 hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className={cn('h-5 w-5 transition-transform duration-150 group-hover:scale-110', highlight && 'text-emerald-400')} />
          {label}
        </Link>
      ))}
    </div>
  )
}
