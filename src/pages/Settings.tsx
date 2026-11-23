import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export function Settings() {
  const { profile, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [name, setName] = useState(profile?.display_name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!profile) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const u = username.trim().toLowerCase()
    if (!USERNAME_RE.test(u)) {
      setError(t('settings.usernameInvalid'))
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: u, display_name: name.trim() || null })
      .eq('id', profile!.id)
    setBusy(false)
    if (error) {
      setError(error.code === '23505' ? t('settings.usernameTaken') : t('common.error'))
      return
    }
    await refreshProfile()
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">{t('settings.title')}</h1>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <label className="label" htmlFor="s-name">{t('settings.displayName')}</label>
          <input id="s-name" className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="s-username">{t('settings.username')}</label>
          <div className="flex items-center rounded-xl border border-white/10 bg-ink/60 pl-3.5 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/30">
            <span className="text-sm text-slate-500">@</span>
            <input
              id="s-username"
              className="w-full bg-transparent px-1 py-2.5 text-sm outline-none"
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{t('settings.usernameHint')}</p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">{t('common.saved')}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </div>
  )
}
