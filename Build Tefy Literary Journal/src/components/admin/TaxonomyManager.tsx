import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { TextField, inputClass } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/Decor'
import { useFeedback } from '@/components/ui/Feedback'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SERIES_KIND_LABELS, type SeriesKind } from '@/types'

type Item = { id: string; name: string; description?: string; image?: string; kind?: SeriesKind }
type ItemPatch = { name: string; description?: string; image?: string; kind?: SeriesKind }

type Props = {
  items: Item[]
  usage: (id: string) => number
  noun: { one: string; add: string; placeholder: string }
  onAdd: (name: string, description?: string, image?: string, kind?: SeriesKind) => unknown
  onUpdate: (id: string, patch: ItemPatch) => unknown
  onDelete: (id: string) => unknown
  onMove: (id: string, dir: -1 | 1) => unknown
  allowImage?: boolean
  allowKind?: boolean
}

/** Create, rename, describe, reorder and delete genres or series. */
export function TaxonomyManager({ items, usage, noun, onAdd, onUpdate, onDelete, onMove, allowImage = false, allowKind = false }: Props) {
  const { toast, confirm } = useFeedback()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState<string>()
  const [kind, setKind] = useState<SeriesKind>('saga')
  const [editing, setEditing] = useState<string | null>(null)
  const editNameRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<{ name: string; description: string; image?: string; kind: SeriesKind }>({ name: '', description: '', kind: 'saga' })

  useEffect(() => {
    if (editing) editNameRef.current?.focus()
  }, [editing])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (items.some((i) => i.name.toLowerCase() === name.trim().toLowerCase())) { toast(`Ya existe ${noun.one} con ese nombre.`, 'error'); return }
    onAdd(name.trim(), desc.trim() || undefined, image, kind)
    toast(`“${name.trim()}” agregada.`)
    setName(''); setDesc(''); setImage(undefined); setKind('saga')
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {items.length === 0 ? <EmptyState title="Aún no hay nada aquí" message={`Agrega ${noun.one} con el formulario.`} /> : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-night/60">
            {items.map((item, i) => (
              <li key={item.id} className="p-4 sm:p-5">
                {editing === item.id ? (
                  <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!draft.name.trim()) return; onUpdate(item.id, { name: draft.name.trim(), description: draft.description.trim() || undefined, image: draft.image, kind: draft.kind }); setEditing(null); toast('Cambios guardados.') }}>
                    <input ref={editNameRef} aria-label="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
                    <textarea aria-label="Descripción" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${inputClass} min-h-20`} placeholder="Descripción (opcional)" />
                    {allowKind && <label className="block text-sm text-ink-2">Tipo de colección<select aria-label="Tipo de colección" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as SeriesKind })} className={`${inputClass} mt-1`}>{Object.entries(SERIES_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
                    {allowImage && <ImageUpload label="Imagen" value={draft.image} onChange={(value) => setDraft({ ...draft, image: value })} aspect="aspect-[16/9]" maxSize={1200} hint="Imagen que aparecerá en esta categoría." />}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm"><Check size={15} /> Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={15} /> Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        {item.image && <img src={item.image} alt="" className="h-12 w-16 rounded-lg object-cover" />}
                        <div><p className="font-serif text-xl font-semibold text-ink">{item.name}</p>{allowKind && <p className="text-xs text-sage">{SERIES_KIND_LABELS[item.kind ?? 'saga']}</p>}</div>
                      </div>
                      {item.description && <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{item.description}</p>}
                      <p className="mt-1 text-[12.5px] text-ink-3">{usage(item.id)} {usage(item.id) === 1 ? 'libro' : 'libros'}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end">
                      <IconButton label="Subir" disabled={i === 0} onClick={() => onMove(item.id, -1)}><ArrowUp size={16} /></IconButton>
                      <IconButton label="Bajar" disabled={i === items.length - 1} onClick={() => onMove(item.id, 1)}><ArrowDown size={16} /></IconButton>
                      <IconButton label="Renombrar" onClick={() => { setEditing(item.id); setDraft({ name: item.name, description: item.description ?? '', image: item.image, kind: item.kind ?? 'saga' }) }}><Pencil size={16} /></IconButton>
                      <IconButton label="Eliminar" className="hover:text-danger" onClick={async () => {
                        const n = usage(item.id)
                        const ok = await confirm({ title: `¿Eliminar “${item.name}”?`, message: n ? `${n} ${n === 1 ? 'libro quedará' : 'libros quedarán'} sin esta etiqueta. Las reseñas no se borran.` : 'No hay libros usando esta etiqueta.', confirmLabel: 'Eliminar', tone: 'danger' })
                        if (ok) { onDelete(item.id); toast('Eliminada.') }
                      }}><Trash2 size={16} /></IconButton>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={add} className="h-fit space-y-4 rounded-2xl border border-line bg-night/60 p-5 sm:p-6">
        <h2 className="font-serif text-2xl font-medium text-ink">{noun.add}</h2>
        <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} placeholder={noun.placeholder} />
        <TextField label="Descripción" optional value={desc} onChange={(e) => setDesc(e.target.value)} />
        {allowKind && <label className="block text-sm text-ink-2">Tipo de colección<select aria-label="Tipo de colección" value={kind} onChange={(e) => setKind(e.target.value as SeriesKind)} className={`${inputClass} mt-1`}>{Object.entries(SERIES_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        {allowImage && <ImageUpload label="Imagen" value={image} onChange={setImage} aspect="aspect-[16/9]" maxSize={1200} hint="Imagen que aparecerá en esta categoría." />}
        <Button type="submit" className="w-full" disabled={!name.trim()}><Plus size={16} /> Agregar</Button>
      </form>
    </div>
  )
}
