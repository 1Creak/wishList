import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { displayName } from '../lib/format'
import type { Profile, Wishlist } from '../lib/types'
import { Avatar } from '../components/Avatar'
import { WishlistCard } from '../components/WishlistCard'
import { PageSpinner } from '../components/Spinner'

type State =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'ok'; profile: Profile; lists: (Wishlist & { count: number })[] }

export function ProfilePage() {
  const { username = '' } = useParams()
  const { t } = useI18n()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    ;(async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
      if (!profile) {
        if (!cancelled) setState({ status: 'notFound' })
        return
      }
      const { data } = await supabase
        .from('wishlists')
        .select('*, items(count)')
        .eq('owner_id', (profile as Profile).id)
        .is('items.received_at', null)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setState({
        status: 'ok',
        profile: profile as Profile,
        lists: ((data ?? []) as (Wishlist & { items: { count: number }[] })[]).map(({ items, ...w }) => ({
          ...w,
          count: items?.[0]?.count ?? 0,
        })),
      })
    })()
    return () => {
      cancelled = true
    }
  }, [username])

  if (state.status === 'loading') return <PageSpinner />
  if (state.status === 'notFound') return <div className="card mx-auto max-w-md p-8 text-center text-slate-300">{t('profile.notFound')}</div>

  const { profile, lists } = state
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Avatar profile={profile} size={80} />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{displayName(profile)}</h1>
          <p className="text-slate-400">@{profile.username}</p>
        </div>
      </div>
      <section>
        <h2 className="mb-6 text-xl font-bold">{t('profile.lists')}</h2>
        {lists.length === 0 ? (
          <p className="text-slate-400">{t('profile.empty')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((w) => (
              <WishlistCard key={w.id} wishlist={w} count={w.count} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
