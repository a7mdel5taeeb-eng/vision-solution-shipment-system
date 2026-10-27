import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useLocale } from '../i18n/locale-context'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  const { t } = useLocale()
  useEffect(() => {
    const element = dialog.current!
    const previous = document.activeElement as HTMLElement | null
    element.showModal()
    return () => {
      element.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-inner">
        <div className="modal-header">
          <h2 id={id}>{title}</h2>
          <button type="button" className="modal-close" aria-label={t.close} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
