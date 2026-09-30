import tippy, { type Instance } from 'tippy.js'
import type { Directive } from 'vue'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/border.css'

tippy.setDefaultProps({ theme: 'mondex', delay: [200, 0], duration: [120, 80] })

type TipEl = HTMLElement & { _tip?: Instance }
type TipValue = string | false | null | undefined

// v-tip="text": a tooltip in place of the native title. A falsy value shows none.
export const vTip: Directive<TipEl, TipValue> = {
  mounted(el, { value }) {
    if (value) el._tip = tippy(el, { content: value })
  },
  updated(el, { value, oldValue }) {
    if (value === oldValue) return
    if (!value) {
      el._tip?.destroy()
      delete el._tip
    } else if (el._tip) {
      el._tip.setContent(value)
    } else {
      el._tip = tippy(el, { content: value })
    }
  },
  beforeUnmount(el) {
    el._tip?.destroy()
    delete el._tip
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    vTip: typeof vTip
  }
}
