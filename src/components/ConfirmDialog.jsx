import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui'

// Small confirmation built on Modal — used for destructive actions (clear all,
// close an account). The confirm button carries the tone; Cancel is always safe.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Confirm',
  variant = 'danger',
  children,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm leading-relaxed text-muted">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={variant}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
