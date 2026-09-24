import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cx } from '@/lib/cx'

// Accessible modal dialog: role="dialog" + aria-modal, closes on Escape or
// backdrop click, locks body scroll, moves focus to the first control on open,
// keeps Tab within the panel, and restores focus to the trigger on close.
const FOCUSABLE =
  'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, titleId = 'modal-title', description, children, className }) {
  const panelRef = useRef(null)
  const restoreTo = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    restoreTo.current = document.activeElement
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []).filter((n) => !n.disabled)

    const focusTimer = setTimeout(() => {
      const list = focusables()
      ;(list[0] ?? panelRef.current)?.focus()
    }, 0)

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      restoreTo.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cx(
              'glass-strong relative z-10 w-full max-w-md rounded-2xl border border-hair p-6 shadow-2xl shadow-black/50',
              className,
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-hair bg-fill text-muted transition-colors hover:border-neonCyan/40 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
