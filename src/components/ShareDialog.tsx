import { useCallback, useEffect, useState } from 'react'
import { absoluteUrl, supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { displayName } from '../lib/format'
import type { ProfileLite, Wishlist } from '../lib/types'
import { one } from '../lib/types'
import { Modal } from './Modal'
import { CopyField } from './CopyField'
import { Avatar } from './Avatar'
import { Spinner } from './Spinner'

type Member = { user_id: string; profile: ProfileLite | null }

export function ShareDialog({ wishlist, onClose }: { wishlist: Wishlist; onClose: () => void }) {
  const { t } = useI18n()
  const [token, setToken] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadToken = useCallback(
    async (regenerate: boolean) => {
      setBusy(true)
      const { data, error } = await supabase.rpc('get_invite_token', { p_wishlist: wishlist.id, p_regenerate: regenerate })
      setBusy(false)
      if (error) setError(t('common.error'))
      else setToken(data as string)
    },
    [wishlist.id, t],
  )

  const loadMembers = useCallback(async () => {
    const { data } = await supabase
      .from('wishlist_members')
      .select('user_id, profile:profiles(id, username, display_name, avatar_url)')
      .eq('wishlist_id', wishlist.id)
      .order('joined_at')
    setMembers(
      ((data ?? []) as { user_id: string; profile: ProfileLite | ProfileLite[] | null }[]).map((m) => ({
        user_id: m.user_id,
        profile: one(m.profile),
      })),
    )
  }, [wishlist.id])

  useEffect(() => {
    if (!wishlist.is_private) return
    void loadToken(false)
    void loadMembers()
  }, [wishlist.is_private, loadToken, loadMembers])

  async function removeMember(m: Member) {
    const name = m.profile ? displayName(m.profile) : ''
    if (!confirm(t('share.removeConfirm', { name }))) return
    await supabase.from('wishlist_members').delete().eq('wishlist_id', wishlist.id).eq('user_id', m.user_id)
    void loadMembers()
  }

  return (
    <Modal title={t('share.title')} onClose={onClose}>
      {!wishlist.is_private ? (
        <div className="space-y-2">
          <span className="label">{t('share.publicLink')}</span>
          <CopyField value={absoluteUrl(`/w/${wishlist.id}`)} />
          <p className="text-xs text-slate-400">{t('share.publicHint')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="label">{t('share.inviteLink')}</span>
            {token ? <CopyField value={absoluteUrl(`/invite/${token}`)} /> : <Spinner />}
            <p className="text-xs text-slate-400">{t('share.inviteHint')}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => confirm(t('share.regenerateConfirm')) && loadToken(true)}
              className="btn-ghost -ml-2 px-2 py-1.5 text-xs"
            >
              {t('share.regenerate')}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div>
            <span className="label">{t('share.members')}</span>
            {members === null ? (
              <Spinner />
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-400">{t('share.noMembers')}</p>
            ) : (
              <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 px-3 py-2.5">
                    {m.profile && <Avatar profile={m.profile} size={28} />}
                    <span className="flex-1 truncate text-sm">
                      {m.profile ? displayName(m.profile) : '—'}
                      {m.profile && <span className="ml-2 text-xs text-slate-500">@{m.profile.username}</span>}
                    </span>
                    <button type="button" onClick={() => removeMember(m)} className="btn-ghost px-2 py-1 text-xs hover:text-red-400">
                      {t('share.removeMember')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
