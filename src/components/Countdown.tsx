import { useI18n } from '../lib/i18n'
import { daysUntil, formatDate } from '../lib/format'
import { Icon } from './Icon'

export function Countdown({ date }: { date: string }) {
  const { t, plural, lang } = useI18n()
  const days = daysUntil(date)
  const label =
    days === 0 ? t('countdown.today') : days > 0 ? t('countdown.in', { n: days, days: plural('plural.days', days) }) : t('countdown.past')
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
      <Icon name="calendar" className="size-4 text-accent" />
      <span>{formatDate(date, lang)}</span>
      <span className={`font-semibold ${days >= 0 ? 'text-accent' : 'text-slate-500'}`}>· {label}</span>
    </span>
  )
}
