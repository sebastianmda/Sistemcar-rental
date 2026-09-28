import { useEffect, useRef, useState } from 'react'
import { Camera, X, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { isImage } from '../lib/media'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { useToast } from './Toast'
import { cx } from './ui'

// object URLs for local (not yet uploaded) files
export function useLocalPreviews(files) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    if (!files.length) {
      setUrls((u) => (u.length ? [] : u)) // no re-render when already empty
      return
    }
    const list = files.map((f) => URL.createObjectURL(f))
    setUrls(list)
    return () => list.forEach((u) => URL.revokeObjectURL(u))
  }, [files])
  return urls
}

// hidden file input that accepts photos only (camera or library on iPhone)
export function PhotoInput({ inputRef, multiple = true, onFiles }) {
  const toast = useToast()
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple={multiple}
      className="hidden"
      onChange={(e) => {
        const picked = Array.from(e.target.files || [])
        e.target.value = ''
        const photos = picked.filter(isImage)
        if (photos.length < picked.length) toast('Se pot adăuga doar fotografii.', 'error')
        if (photos.length) onFiles(photos)
      }}
    />
  )
}

// full-screen photo viewer
export function Lightbox({ urls, index, onClose }) {
  const [i, setI] = useState(index)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((x) => Math.min(urls.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [urls.length, onClose])
  if (index === null || index === undefined) return null
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <span className="text-sm opacity-80">
          {i + 1} / {urls.length}
        </span>
        <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2" aria-label="Închide">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={urls[i]} alt="" className="max-h-full max-w-full object-contain" />
        {i > 0 && (
          <button type="button" onClick={() => setI(i - 1)} className="absolute left-2 rounded-full bg-white/15 p-2 text-white" aria-label="Anterioara">
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {i < urls.length - 1 && (
          <button type="button" onClick={() => setI(i + 1)} className="absolute right-2 rounded-full bg-white/15 p-2 text-white" aria-label="Următoarea">
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>
      <div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />
    </div>
  )
}

function Thumb({ url, onOpen, onRemove, badge, children }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
      {children ||
        (url ? (
          <button type="button" onClick={onOpen} className="block h-full w-full">
            <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">indisponibil</div>
        ))}
      {badge && <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badge}</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-red-600"
          aria-label="Șterge"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function AddTile({ onClick, busy, label = 'Adaugă foto' }) {
  return (
    <button
      type="button"
      disabled={!!busy}
      onClick={onClick}
      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-6 w-6" />}
      <span className="px-1 text-center text-xs font-medium">{busy || label}</span>
    </button>
  )
}

/**
 * Grid showing saved photos (items with url) + photos waiting to be saved (pending files).
 * Used both in forms (pending, saved on "Salvează") and in details (upload immediately via onAdd).
 */
const NONE = []

export function PhotoGrid({ items = NONE, pending = NONE, onAddFiles, onRemovePending, onDeleteItem, busy, cols = 'grid-cols-3 sm:grid-cols-5' }) {
  const inputRef = useRef(null)
  const previews = useLocalPreviews(pending)
  const [open, setOpen] = useState(null)
  const allUrls = [...items.map((it) => it.url), ...previews]

  return (
    <>
      <div className={cx('grid gap-2', cols)}>
        {items.map((it, idx) =>
          it.tip === 'video' ? (
            <Thumb key={it.id} onRemove={onDeleteItem ? () => onDeleteItem(it) : null}>
              <video src={it.url} controls playsInline preload="metadata" className="h-full w-full bg-black object-cover" />
            </Thumb>
          ) : (
            <Thumb key={it.id} url={it.url} onOpen={() => setOpen(idx)} onRemove={onDeleteItem ? () => onDeleteItem(it) : null} />
          )
        )}
        {pending.map((f, j) => (
          <Thumb
            key={`p-${j}`}
            url={previews[j]}
            badge="nou"
            onOpen={() => setOpen(items.length + j)}
            onRemove={onRemovePending ? () => onRemovePending(j) : null}
          />
        ))}
        {onAddFiles && <AddTile onClick={() => inputRef.current?.click()} busy={busy} />}
      </div>
      {onAddFiles && <PhotoInput inputRef={inputRef} onFiles={onAddFiles} />}
      {open !== null && <Lightbox urls={allUrls} index={open} onClose={() => setOpen(null)} />}
    </>
  )
}

// Photos chosen before saving a form (predare / primire)
export function MediaPicker({ files, onChange }) {
  return (
    <div>
      <PhotoGrid
        pending={files}
        onAddFiles={(picked) => onChange([...files, ...picked])}
        onRemovePending={(j) => onChange(files.filter((_, k) => k !== j))}
      />
      <p className="mt-2 text-xs text-slate-500">Pozele se micșorează automat înainte de încărcare.</p>
    </div>
  )
}

// Saved photos of a rental stage, with immediate add / delete
export function MediaGallery({ rentalId, etapa, items, onChanged }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  const add = async (files) => {
    const failed = await api.uploadMany(rentalId, etapa, files, (i, n) => setBusy(`${i}/${n}…`))
    setBusy(null)
    if (failed.length) toast(`${failed.length} poză(e) nu s-au încărcat: ${friendlyError(failed[0].err)}`, 'error')
    else toast('Poze încărcate')
    onChanged()
  }

  const remove = async (item) => {
    if (!confirm('Ștergi această poză?')) return
    try {
      await api.deleteMedia(item)
      onChanged()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  return <PhotoGrid items={items} onAddFiles={add} onDeleteItem={remove} busy={busy} cols="grid-cols-3 sm:grid-cols-4" />
}

export function UploadProgress({ text }) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  )
}

