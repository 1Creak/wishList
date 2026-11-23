import { rarityColor } from '../lib/rarity'
import { useI18n, type TKey } from '../lib/i18n'

export function RarityBadge({ level }: { level: number }) {
  const { t } = useI18n()
  const color = rarityColor(level)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}1f`, boxShadow: `inset 0 0 0 1px ${color}55` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      {t(`rarity.${level}` as TKey)}
    </span>
  )
}
