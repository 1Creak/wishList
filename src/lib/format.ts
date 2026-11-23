import type { Lang } from './i18n'

const LOCALE: Record<Lang, string> = { uk: 'uk-UA', en: 'en-GB' }

export function formatPrice(value: number, lang: Lang): string {
  return `${value.toLocaleString(LOCALE[lang], { maximumFractionDigits: 2 })} ₴`
}

export function formatDate(isoDate: string, lang: Lang): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Whole days from today (local time) until the given YYYY-MM-DD date. */
export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function displayName(p: { display_name: string | null; username: string }): string {
  return p.display_name?.trim() || p.username
}
