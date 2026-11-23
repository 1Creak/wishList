// Client-side validation + downscaling of item images before upload.
// The storage bucket additionally enforces 1 MB and JPEG/PNG/WebP on the server.

export const IMAGE_LIMITS = {
  accept: ['image/jpeg', 'image/png', 'image/webp'],
  maxInputBytes: 5 * 1024 * 1024, // 5 MB
  maxInputSide: 3000, // px; rejects 4K (3840px) and larger
  outputSide: 1200, // px, longest side after resize
  maxOutputBytes: 1024 * 1024, // 1 MB (matches bucket limit)
} as const

export type ImageErrorCode = 'type' | 'size' | 'dimensions' | 'decode' | 'encode'

export class ImageError extends Error {
  code: ImageErrorCode
  constructor(code: ImageErrorCode) {
    super(code)
    this.code = code
  }
}

function isJpeg(b: Uint8Array) {
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
}
function isPng(b: Uint8Array) {
  return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
}
function isWebp(b: Uint8Array) {
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n))
  return s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP'
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

export type PreparedImage = { blob: Blob; ext: 'webp' | 'jpg' }

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!(IMAGE_LIMITS.accept as readonly string[]).includes(file.type)) throw new ImageError('type')
  if (file.size > IMAGE_LIMITS.maxInputBytes) throw new ImageError('size')

  // Do not trust the extension / MIME type: check the file signature.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!isJpeg(head) && !isPng(head) && !isWebp(head)) throw new ImageError('type')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageError('decode')
  }

  if (bitmap.width > IMAGE_LIMITS.maxInputSide || bitmap.height > IMAGE_LIMITS.maxInputSide) {
    bitmap.close()
    throw new ImageError('dimensions')
  }

  const scale = Math.min(1, IMAGE_LIMITS.outputSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('encode')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  // Re-encoding also strips EXIF metadata (e.g. GPS location).
  for (const quality of [0.85, 0.75, 0.6, 0.45]) {
    let blob = await toBlob(canvas, 'image/webp', quality)
    let ext: PreparedImage['ext'] = 'webp'
    if (!blob || blob.type !== 'image/webp') {
      // Browsers without WebP encoding fall back to JPEG.
      blob = await toBlob(canvas, 'image/jpeg', quality)
      ext = 'jpg'
    }
    if (blob && blob.size <= IMAGE_LIMITS.maxOutputBytes) return { blob, ext }
  }
  throw new ImageError('encode')
}
