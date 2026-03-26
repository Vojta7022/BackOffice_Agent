'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message: string
  className?: string
}

interface ErrorStateProps {
  title: string
  message?: string | null
  retryLabel?: string
  onRetry?: () => void
  className?: string
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm dark:shadow-none',
      className
    )}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm shadow-sm dark:shadow-none',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-red-600 dark:text-red-300">{title}</p>
          {message ? (
            <p className="mt-1 text-red-600/90 dark:text-red-300/90">{message}</p>
          ) : null}
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 border-red-500/20 bg-background text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-300"
            >
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
