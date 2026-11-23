import { Link } from 'react-router'
import type { ProfileLite, Wishlist } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { displayName } from '../lib/format'
import { Countdown } from './Countdown'
import { Icon } from './Icon'
import { Avatar } from './Avatar'

export function WishlistCard({ wishlist, count, owner }: { wishlist: Wishlist; count?: number; owner?: ProfileLite | null }) {
  const { t, plural } = useI18n()
  return (
    <Link
      to={`/w/${wishlist.id}`}
      className="card group relative flex flex-col gap-3 overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug">{wishlist.title}</h3>
        {wishlist.is_private && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-slate-300">
            <Icon name="lock" className="size-3" /> {t('common.private')}
          </span>
        )}
      </div>
      {wishlist.description && <p className="line-clamp-2 text-sm text-slate-400">{wishlist.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-slate-400">
        {owner && (
          <span className="inline-flex items-center gap-2">
            <Avatar profile={owner} size={22} /> {displayName(owner)}
          </span>
        )}
        {typeof count === 'number' && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="gift" className="size-4" /> {count} {plural('plural.wishes', count)}
          </span>
        )}
        {wishlist.event_date && <Countdown date={wishlist.event_date} />}
      </div>
    </Link>
  )
}
