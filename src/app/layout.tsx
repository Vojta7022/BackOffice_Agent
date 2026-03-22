import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'RE:Agent | Back Office Operations',
  description: 'AI asistent pro správu nemovitostí',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={cn(geistSans.variable, geistMono.variable)}>
      <body className="flex h-screen overflow-hidden bg-[var(--background)] font-[family-name:var(--font-geist-sans)]">
        <Sidebar />

        {/* Main content shifts right to clear the sidebar on desktop */}
        <div className="flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 md:ml-[72px]">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
