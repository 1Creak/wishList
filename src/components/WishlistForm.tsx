import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import type { Wishlist } from '../lib/types'
import { Modal } from './Modal'

export function WishlistForm({
  wishlist,
  onClose,
  onSaved,
}: {
  wishlist?: Wishlist
  onClose: () => void
  onSaved: (w: Wishlist) => void
}) {
  const { t } = useI18n()
  const [title, setTitle] = useState(wishlist?.title ?? '')
  const [description, setDescription] = useState(wishlist?.description ?? '')
  const [eventDate, setEventDate] = useState(wishlist?.event_date ?? '')
  const [isPrivate, setIsPrivate] = useState(wishlist?.is_private ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate || null,
      is_private: isPrivate,
    }
    const query = wishlist
      ? supabase.from('wishlists').update(payload).eq('id', wishlist.id)
      : supabase.from('wishlists').insert(payload)
    const { data, error } = await query.select().single()
    setSaving(false)
    if (error || !data) {
      setError(t('common.error'))
      return
    }
    onSaved(data as Wishlist)
  }

  return (
    <Modal title={wishlist ? t('wlForm.edit') : t('wlForm.new')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="wl-title">{t('wlForm.title')}</label>
          <input
            id="wl-title"
            className="input"
            required
            maxLength={100}
            autoFocus
            value={title}
            placeholder={t('wlForm.titlePlaceholder')}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wl-desc">{t('wlForm.description')}</label>
          <textarea
            id="wl-desc"
            className="input min-h-20 resize-y"
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wl-date">{t('wlForm.eventDate')}</label>
          <input id="wl-date" type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-ink/40 p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-accent"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold">{t('wlForm.private')}</span>
            <span className="block text-xs text-slate-400">{t('wlForm.privateHint')}</span>
          </span>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">{t('common.cancel')}</button>
          <button type="submit" disabled={saving || !title.trim()} className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
