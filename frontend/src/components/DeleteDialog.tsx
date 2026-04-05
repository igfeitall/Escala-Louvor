import { DeleteDialogProps} from "../types"

export function DeleteDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isProcessing = false,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 px-4">
      <div
        className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <p className="mt-3 text-sm text-stone-600">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-stone-300 px-5 py-2 font-semibold text-stone-700"
            disabled={isProcessing}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="rounded-full bg-rose-600 px-5 py-2 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isProcessing}
            onClick={onConfirm}
            type="button"
          >
            {isProcessing ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
