import { useState, type FormEvent } from 'react'
import { IMAGE_BUCKET, imageUrl, supabase } from '../lib/supabase'
import { useI18n, type TKey } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { RARITIES } from '../lib/rarity'
import type { PreparedImage } from '../lib/image'
import type { Item } from '../lib/types'
import { Modal } from './Modal'
import { ImagePicker } from './ImagePicker'

export function ItemForm({
  wishlistId,
  item,
  nextPosition,
  onClose,
  onSaved,
}: {
  wishlistId: string
  item?: Item
  nextPosition: number
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [title, setTitle] = useState(item?.title ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '')
  const [rarity, setRarity] = useState(item?.rarity ?? 1)
  const [note, setNote] = useState(item?.note ?? '')
  const [image, setImage] = useState<PreparedImage | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    const cleanUrl = url.trim()
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      setError(t('itemForm.urlInvalid'))
      return
    }
    setSaving(true)
    setError(null)

    let imagePath = item?.image_path ?? null
    let uploadedPath: string | null = null
    if (image) {
      uploadedPath = `${user.id}/${crypto.randomUUID()}.${image.ext}`
      const { error: upErr } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(uploadedPath, image.blob, { contentType: image.blob.type, cacheControl: '31536000', upsert: false })
      if (upErr) {
        setSaving(false)
        setError(t('image.err.upload'))
        return
      }
      imagePath = uploadedPath
    } else if (image === null) {
      imagePath = null
    }

    const payload = {
      title: title.trim(),
      url: cleanUrl || null,
      price: price.trim() === '' ? null : Math.max(0, Number(price.replace(',', '.'))),
      rarity,
      note: note.trim() || null,
      image_path: imagePath,
    }

    const { error: dbErr } = item
      ? await supabase.from('items').update(payload).eq('id', item.id)
      : await supabase.from('items').insert({ ...payload, wishlist_id: wishlistId, position: nextPosition })

    if (dbErr) {
      if (uploadedPath) await supabase.storage.from(IMAGE_BUCKET).remove([uploadedPath])
      setSaving(false)
      setError(t('common.error'))
      return
    }

    // Clean up the previous image when it was replaced or removed.
    if (item?.image_path && item.image_path !== imagePath) {
      await supabase.storage.from(IMAGE_BUCKET).remove([item.image_path])
    }
    onSaved()
  }

  return (
    <Modal title={item ? t('itemForm.edit') : t('itemForm.new')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="it-title">{t('itemForm.title')}</label>
          <input
            id="it-title"
            className="input"
            required
            maxLength={150}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <span className="label">{t('itemForm.image')}</span>
          <ImagePicker
            currentUrl={item?.image_path ? imageUrl(item.image_path) : null}
            value={image}
            onChange={setImage}
          />
        </div>
        <div>
          <span className="label">{t('itemForm.rarity')}</span>
          <div className="grid grid-cols-5 gap-1.5">
            {RARITIES.map((r) => {
              const active = rarity === r.level
              return (
                <button
                  key={r.level}
                  type="button"
                  onClick={() => setRarity(r.level)}
                  className="rounded-lg border px-1 py-2 text-[11px] font-bold transition"
                  style={{
                    color: r.color,
                    borderColor: active ? r.color : 'rgb(255 255 255 / 0.1)',
                    backgroundColor: active ? `${r.color}26` : 'transparent',
                    boxShadow: active ? `0 0 16px -4px ${r.color}` : undefined,
                  }}
                >
                  {t(`rarity.${r.level}` as TKey)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <div>
            <label className="label" htmlFor="it-url">{t('itemForm.url')}</label>
            <input
              id="it-url"
              type="url"
              className="input"
              maxLength={2000}
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="it-price">{t('itemForm.price')}</label>
            <input
              id="it-price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="it-note">{t('itemForm.note')}</label>
          <textarea
            id="it-note"
            className="input min-h-20 resize-y"
            maxLength={1000}
            placeholder={t('itemForm.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">{t('common.cancel')}</button>
          <button type="submit" disabled={saving || !title.trim()} className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
