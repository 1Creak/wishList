import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { one, type ProfileLite, type Wishlist } from '../lib/types'
import { WishlistCard } from '../components/WishlistCard'
import { WishlistForm } from '../components/WishlistForm'
import { PageSpinner } from '../components/Spinner'
import { Icon } from '../components/Icon'

type Mine = Wishlist & { count: number }
type Shared = Wishlist & { owner: ProfileLite | null }

export function Dashboard() {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mine, setMine] = useState<Mine[] | null>(null)
  const [shared, setShared] = useState<Shared[]>([])
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [own, member] = await Promise.all([
      supabase
        .from('wishlists')
        .select('*, items(count)')
        .eq('owner_id', user.id)
        .is('items.received_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('wishlist_members')
        .select('wishlist:wishlists(*, owner:profiles(id, username, display_name, avatar_url))')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false }),
    ])
    setMine(
      ((own.data ?? []) as (Wishlist & { items: { count: number }[] })[]).map(({ items, ...w }) => ({
        ...w,
        count: items?.[0]?.count ?? 0,
      })),
    )
    setShared(
      ((member.data ?? []) as { wishlist: unknown }[])
        .map((m) => one(m.wishlist as (Wishlist & { owner: ProfileLite | ProfileLite[] | null }) | null))
        .filter((w): w is Wishlist & { owner: ProfileLite | ProfileLite[] | null } => w !== null)
        .map((w) => ({ ...w, owner: one(w.owner) })),
    )
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  if (!mine) return <PageSpinner />

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('dash.title')}</h1>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Icon name="plus" /> {t('dash.create')}
          </button>
        </div>
        {mine.length === 0 ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="card flex w-full flex-col items-center gap-3 border-dashed p-12 text-slate-400 transition hover:border-accent/50 hover:text-white"
          >
            <Icon name="gift" className="size-10 text-accent" />
            {t('dash.empty')}
          </button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((w) => (
              <WishlistCard key={w.id} wishlist={w} count={w.count} />
            ))}
          </div>
        )}
      </section>

      {shared.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-bold">{t('dash.shared')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((w) => (
              <WishlistCard key={w.id} wishlist={w} owner={w.owner} />
            ))}
          </div>
        </section>
      )}

      {creating && (
        <WishlistForm onClose={() => setCreating(false)} onSaved={(w) => navigate(`/w/${w.id}`)} />
      )}
    </div>
  )
}
