import { ref, watch } from 'vue'
import type { TypeId } from '@/data/types'
import type { Ids, NamedKind, Ref } from '@/data/dex'
import * as en from './en'
import * as es from './es'

/** Supported languages, labelled in their own language. */
export const LOCALES = { en: 'English', es: 'Español' } as const
export type Locale = keyof typeof LOCALES
export type MessageKey = keyof typeof en.messages

/** A locale's names of every referenced entry, per category: one missing is a compile error. */
export type Names = { [K in NamedKind]: Record<Ids[K], string> }

const BUNDLES: Record<Locale, { messages: Record<MessageKey, string>; types: Record<TypeId, string>; names: Names }> = {
  en,
  es,
}

const KEY = 'mondex.lang'

function isLocale(s: unknown): s is Locale {
  return typeof s === 'string' && s in LOCALES
}

function detect(): Locale {
  try {
    const saved = localStorage.getItem(KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Storage unavailable.
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.slice(0, 2).toLowerCase()
    if (isLocale(base)) return base
  }
  return 'en'
}

export const locale = ref<Locale>(detect())

watch(
  locale,
  (l) => {
    document.documentElement.lang = l
  },
  { immediate: true },
)

export function setLocale(l: Locale) {
  locale.value = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    // Storage unavailable: the choice lasts for this page load.
  }
}

/** Translate `key`, replacing `{name}` placeholders with `params`. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const s = BUNDLES[locale.value].messages[key] ?? en.messages[key]
  return params ? s.replace(/\{(\w+)\}/g, (m, p: string) => String(params[p] ?? m)) : s
}

/**
 * Split a message around one `{slot}` so a component (e.g. a type badge) can
 * be rendered in its place: returns [before, after].
 */
export function tSplit(key: MessageKey, slot: string): [string, string] {
  const s = t(key)
  const i = s.indexOf(`{${slot}}`)
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + slot.length + 2)]
}

export function typeName(type: TypeId): string {
  return BUNDLES[locale.value].types[type]
}

/** Official name of a type, status, move, ability or item. */
export function refName(ref: Ref): string {
  if (ref.kind === 'type') return typeName(ref.id)
  return (BUNDLES[locale.value].names[ref.kind] as Record<string, string>)[ref.id]!
}
