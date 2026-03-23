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
