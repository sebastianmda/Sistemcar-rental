import { useEffect, useRef, useState } from 'react'
import { Camera, X, Video, Trash2, Loader2, ImagePlus } from 'lucide-react'
import { MAX_FILE_MB, fileSizeLabel, mediaType } from '../lib/media'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { useToast } from './Toast'

// Picks photos/videos locally (with previews) before they are uploaded
export function MediaPicker({ files, onChange }) {
  const inputRef = useRef(null)
  const toast = useToast()
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const urls = files.map((f) => (mediaType(f) === 'foto' ? URL.createObjectURL(f) : null))
    setPreviews(urls)
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u))
  }, [files])

  const add = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    const tooBig = picked.filter((f) => mediaType(f) === 'video' && f.size > MAX_FILE_MB * 1024 * 1024)
    if (tooBig.length) toast(`${tooBig.length} video(uri) depășesc ${MAX_FILE_MB} MB și nu au fost adăugate.`, 'error')
    onChange([...files, ...picked.filter((f) => !tooBig.includes(f))])
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={add} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {files.map((f, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {previews[i] ? (
              <img src={previews[i]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-500">
                <Video className="h-6 w-6" />
                <span className="text-[10px]">{fileSizeLabel(f.size)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white"
              aria-label="Elimină"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs font-medium">Foto / Video</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Pozele se micșorează automat. Video: maxim {MAX_FILE_MB} MB pe clip (aprox. 30–40 sec).
      </p>
    </div>
  )
}

// Shows uploaded media for one stage, allows adding more / deleting
export function MediaGallery({ rentalId, etapa, items, onChanged, canEdit = true }) {
  const inputRef = useRef(null)
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  const add = async (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (!picked.length) return
    const failed = await api.uploadMany(rentalId, etapa, picked, (i, n) => setBusy(`Se încarcă ${i}/${n}…`))
    setBusy(null)
    if (failed.length) toast(`${failed.length} fișier(e) nu s-au încărcat: ${friendlyError(failed[0].err)}`, 'error')
    else toast('Fișiere încărcate')
    onChanged()
  }

  const remove = async (item) => {
    if (!confirm('Ștergi acest fișier?')) return
    try {
      await api.deleteMedia(item)
      onChanged()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-900 ring-1 ring-slate-200">
            {item.tip === 'video' ? (
              <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer">
                <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </a>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => remove(item)}
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white opacity-80 hover:bg-red-600"
                aria-label="Șterge"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="px-1 text-center text-xs font-medium">{busy || 'Adaugă'}</span>
          </button>
        )}
      </div>
      {!items.length && !canEdit && <p className="text-sm text-slate-500">Nicio fotografie.</p>}
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={add} />
    </div>
  )
}

export function UploadProgress({ text }) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  )
}
