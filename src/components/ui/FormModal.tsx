'use client'

import type { FormEvent, ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  submitLabel = 'Uložit',
  submitLoadingLabel = 'Ukládám…',
  cancelLabel = 'Zrušit',
  isSubmitting = false,
  submitDisabled = false,
  error,
  className,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className={cn('sm:max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          {children}

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={submitDisabled || isSubmitting}>
              {isSubmitting ? submitLoadingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
