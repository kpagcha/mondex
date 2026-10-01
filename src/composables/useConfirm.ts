import { shallowRef } from 'vue'

export interface ConfirmOptions {
  message: string
  /** Label of the confirming button. */
  confirm: string
  /** Style the confirming button as destructive, and focus Cancel first. */
  danger?: boolean
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

/** The open request, rendered by the single ConfirmDialog in App.vue. */
export const pending = shallowRef<Pending | null>(null)

/** A styled replacement for `window.confirm`: resolves true if the user confirms. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  pending.value?.resolve(false)
  return new Promise((resolve) => {
    pending.value = { ...opts, resolve }
  })
}
