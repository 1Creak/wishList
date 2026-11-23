import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import type { Item } from '../lib/types'
import { imageUrl } from '../lib/supabase'
import { rarityColor } from '../lib/rarity'
import { useI18n } from '../lib/i18n'
import { displayName, formatPrice } from '../lib/format'
import { RarityBadge } from './RarityBadge'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

type Props = {
  item: Item
  isOwner: boolean
  currentUserId: string | null
  busy?: boolean
  dragHandle?: ReactNode
  onEdit?: () => void
  onDelete?: () => void
  onToggleReceived?: () => void
  onReserve?: () => void
  onCancelReservation?: () => void
}

export function ItemCard({
  item,
  isOwner,
  currentUserId,
  busy,
  dragHandle,
  onEdit,
  onDelete,
  onToggleReceived,
  onReserve,
  onCancelReservation,
}: Props) {
  const { t, lang } = useI18n()
  const location = useLocation()
  const color = rarityColor(item.rarity)
  const received = item.received_at != null
  const reservation = item.reservation
  const reservedByMe = reservation && reservation.user_id === currentUserId

  return (
    <article
      className={`card group relative flex h-full flex-col overflow-hidden transition ${received ? 'opacity-60' : 'hover:-translate-y-0.5'}`}
      style={{ boxShadow: `0 0 0 1px ${color}22, 0 18px 40px -24px ${color}88` }}
    >
      {/* image area with rarity glow */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: `radial-gradient(120% 90% at 50% 110%, ${color}55 0%, ${color}14 45%, transparent 75%), #0B192C` }}
      >
        {item.image_path ? (
          <img src={imageUrl(item.image_path)} alt={item.title} loading="lazy" className="size-full object-contain p-3" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon name="gift" className="size-14 opacity-40" style={{ color }} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <RarityBadge level={item.rarity} />
        </div>
        {dragHandle && <div className="absolute right-2 top-2">{dragHandle}</div>}
        {received && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
            {t('item.received')}
          </div>
        )}
      </div>
      <div className="h-1 w-full" style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug">{item.title}</h3>
          {item.price != null && (
            <span className="shrink-0 font-extrabold text-accent">{formatPrice(item.price, lang)}</span>
          )}
        </div>
        {item.note && <p className="whitespace-pre-line text-sm text-slate-400">{item.note}</p>}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-300 underline-offset-4 hover:text-accent hover:underline"
          >
            <Icon name="external" className="size-3.5" />
            {t('item.open')} · {safeHost(item.url)}
          </a>
        )}

        <div className="mt-auto pt-3">
          {isOwner ? (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={onToggleReceived} disabled={busy} className="btn-secondary flex-1 px-3 py-2">
                <Icon name={received ? 'undo' : 'check'} />
                {received ? t('item.unarchive') : t('item.markReceived')}
              </button>
              <button type="button" onClick={onEdit} disabled={busy} className="btn-ghost px-2.5 py-2" aria-label={t('common.edit')}>
                <Icon name="edit" />
              </button>
              <button type="button" onClick={onDelete} disabled={busy} className="btn-ghost px-2.5 py-2 hover:text-red-400" aria-label={t('common.delete')}>
                <Icon name="trash" />
              </button>
            </div>
          ) : reservation ? (
            reservedByMe ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
                <span className="text-sm font-semibold text-accent">{t('item.reservedByMe')}</span>
                {!received && (
                  <button type="button" onClick={onCancelReservation} disabled={busy} className="text-xs font-semibold text-slate-300 hover:text-white">
                    {t('item.cancelReserve')}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink/40 px-3 py-2 text-sm text-slate-300">
                {reservation.reserver && <Avatar profile={reservation.reserver} size={22} />}
                <span className="truncate">
                  {t('item.reservedBy', { name: reservation.reserver ? displayName(reservation.reserver) : '…' })}
                </span>
              </div>
            )
          ) : received ? null : currentUserId ? (
            <button type="button" onClick={onReserve} disabled={busy} className="btn-primary w-full">
              <Icon name="gift" /> {t('item.reserve')}
            </button>
          ) : (
            <Link to="/login" state={{ from: location.pathname }} className="btn-secondary w-full">
              {t('item.loginToReserve')}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
