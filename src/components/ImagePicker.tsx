import { useEffect, useRef, useState } from 'react'
import { IMAGE_LIMITS, ImageError, prepareImage, type PreparedImage } from '../lib/image'
import { useI18n, type TKey } from '../lib/i18n'
import { Icon } from './Icon'
import { Spinner } from './Spinner'

/**
 * value: undefined = unchanged, null = removed, PreparedImage = new image.
 */
export function ImagePicker({
  currentUrl,
  value,
  onChange,
}: {
  currentUrl: string | null
  value: PreparedImage | null | undefined
  onChange: (v: PreparedImage | null | undefined) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(value.blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const shown = value === undefined ? currentUrl : previewUrl

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      onChange(await prepareImage(file))
    } catch (e) {
      const code = e instanceof ImageError ? e.code : 'decode'
      setError(t(`image.err.${code}` as TKey))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ink/60">
          {busy ? (
            <Spinner />
          ) : shown ? (
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <Icon name="image" className="size-8 text-slate-600" />
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="btn-secondary py-2">
              {busy ? t('image.processing') : shown ? t('image.replace') : t('image.choose')}
            </button>
            {shown && !busy && (
              <button type="button" onClick={() => onChange(currentUrl ? null : undefined)} className="btn-ghost py-2">
                {t('image.remove')}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">{t('image.hint')}</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_LIMITS.accept.join(',')}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  )
}
