/** حداکثر ضلع خروجی آواتار (پیکسل) — برای سبک ماندن در localStorage */
const AVATAR_MAX_SIZE = 256
const AVATAR_JPEG_QUALITY = 0.82
const AVATAR_MAX_INPUT_BYTES = 8 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function isAllowedAvatarFile(file: File): boolean {
  return ALLOWED_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name)
}

/**
 * فایل تصویر را به data URL مربعی فشرده تبدیل می‌کند.
 * برای آواتار موکل که باید در localStorage بماند مناسب است.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!isAllowedAvatarFile(file)) {
    throw new Error('فقط فایل تصویر (JPG، PNG، WebP) مجاز است.')
  }
  if (file.size > AVATAR_MAX_INPUT_BYTES) {
    throw new Error('حجم تصویر نباید بیشتر از ۸ مگابایت باشد.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const size = Math.min(image.naturalWidth, image.naturalHeight)
    const sx = (image.naturalWidth - size) / 2
    const sy = (image.naturalHeight - size) / 2
    const output = Math.min(AVATAR_MAX_SIZE, size)

    const canvas = document.createElement('canvas')
    canvas.width = output
    canvas.height = output
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('امکان پردازش تصویر وجود ندارد.')
    }

    ctx.drawImage(image, sx, sy, size, size, 0, 0, output, output)
    return canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('بارگذاری تصویر ناموفق بود.'))
    image.src = src
  })
}
