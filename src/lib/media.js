export const MAX_FILE_MB = 50

export function mediaType(file) {
  return file.type?.startsWith('video/') ? 'video' : 'foto'
}

// Shrinks phone photos (4-6 MB) to ~300-600 KB so storage lasts much longer
export async function compressImage(file, maxDim = 1920, quality = 0.82) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif') return file
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file // the browser can't read it (e.g. HEIC on desktop) — upload the original
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function fileSizeLabel(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
