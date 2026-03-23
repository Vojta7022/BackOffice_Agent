'use client'

import { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/useTranslation'

interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  resolve: (value: boolean) => void
}

function ConfirmDialogHost({
  state,
  onResolve,
}: {
  state: ConfirmDialogState | null
  onResolve: (value: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onResolve(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{state?.title ?? t.common.confirmation}</DialogTitle>
          <DialogDescription>{state?.message ?? ''}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onResolve(false)}>
            {state?.cancelLabel ?? t.common.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={() => onResolve(true)}>
            {state?.confirmLabel ?? t.common.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState | null>(null)

  const resolveState = useCallback((value: boolean) => {
    setState((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...options,
        resolve,
      })
    })
  }, [])

  const dialog = useMemo(() => (
    <ConfirmDialogHost state={state} onResolve={resolveState} />
  ), [resolveState, state])

  return { confirm, dialog }
}
