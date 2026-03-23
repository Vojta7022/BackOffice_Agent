import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MainWrapper from '@/components/layout/MainWrapper'

const themeScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem('backoffice-theme')
      const savedLanguage = window.localStorage.getItem('backoffice-language')
      const theme = savedTheme === 'light' ? 'light' : 'dark'
      const language = savedLanguage === 'en' ? 'en' : 'cs'
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.documentElement.style.colorScheme = theme
      document.documentElement.lang = language
    } catch {}
  })();
`

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
    <html
      lang="cs"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, 'dark')}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex h-screen overflow-hidden bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
        <Sidebar />

        <MainWrapper>
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </MainWrapper>
      </body>
    </html>
  )
}
