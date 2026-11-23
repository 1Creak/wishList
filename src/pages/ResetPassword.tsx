import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { PageSpinner } from '../components/Spinner'

export function ResetPassword() {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <PageSpinner />

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center text-slate-300">{t('auth.resetInvalid')}</div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message || t('common.error'))
    else navigate('/me', { replace: true })
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="new-password">{t('auth.newPassword')}</label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">{t('auth.passwordHint')}</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">{t('auth.savePassword')}</button>
    </form>
  )
}
