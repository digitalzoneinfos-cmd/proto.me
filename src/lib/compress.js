// ضغط صور الوصولات قبل الرفع: صورة هاتف 5–8MB تصبح ~200–300KB وتبقى مقروءة
const MAX_SIDE = 1600
const QUALITY = 0.72

export async function compressImage(file) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (file.size < 350 * 1024) return file
  try {
    const bmp = await loadBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', QUALITY))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file // صيغة غير مدعومة (مثل HEIC في بعض المتصفحات) — نرفع الأصل
  }
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { /* fallback */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}

export const fmtBytes = (b) => (b >= 1024 ** 3 ? (b / 1024 ** 3).toFixed(2) + ' GB' : b >= 1024 ** 2 ? (b / 1024 ** 2).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')
