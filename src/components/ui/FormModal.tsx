'use client'

import type { FormEvent, ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  submitLabel?: string
  submitLoadingLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  submitDisabled?: boolean
  error?: string | null
  className?: string
}

export default function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  cancelLabel,
  isSubmitting = false,
  submitDisabled = false,
  error,
  className,
}: FormModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className={cn('flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0 sm:max-w-2xl', className)}>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {children}

            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel ?? t.common.cancel}
            </Button>
            <Button type="submit" disabled={submitDisabled || isSubmitting}>
              {isSubmitting ? (submitLoadingLabel ?? t.common.loading) : (submitLabel ?? t.common.save)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
