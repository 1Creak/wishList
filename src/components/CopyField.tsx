import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'

export function CopyField({ value }: { value: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable: the field is selectable anyway */
    }
  }

  return (
    <div className="flex gap-2">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="input font-mono text-xs" />
      <button type="button" onClick={copy} className="btn-secondary shrink-0">
        <Icon name={copied ? 'check' : 'link'} />
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  )
}
