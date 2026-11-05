import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { TextField, inputClass } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/Decor'
import { useFeedback } from '@/components/ui/Feedback'

type Item = { id: string; name: string; description?: string }

type Props = {
  items: Item[]
  usage: (id: string) => number
  noun: { one: string; add: string; placeholder: string }
  onAdd: (name: string, description?: string) => unknown
  onUpdate: (id: string, patch: { name: string; description?: string }) => unknown
  onDelete: (id: string) => unknown
  onMove: (id: string, dir: -1 | 1) => unknown
}

/** Create, rename, describe, reorder and delete genres or series. */
export function TaxonomyManager({ items, usage, noun, onAdd, onUpdate, onDelete, onMove }: Props) {
  const { toast, confirm } = useFeedback()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', description: '' })

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (items.some((i) => i.name.toLowerCase() === name.trim().toLowerCase())) { toast(`Ya existe ${noun.one} con ese nombre.`, 'error'); return }
    onAdd(name.trim(), desc.trim() || undefined)
    toast(`“${name.trim()}” agregada.`)
    setName(''); setDesc('')
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {items.length === 0 ? <EmptyState title="Aún no hay nada aquí" message={`Agrega ${noun.one} con el formulario.`} /> : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-night/60">
            {items.map((item, i) => (
              <li key={item.id} className="p-4 sm:p-5">
                {editing === item.id ? (
                  <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!draft.name.trim()) return; onUpdate(item.id, { name: draft.name.trim(), description: draft.description.trim() || undefined }); setEditing(null); toast('Cambios guardados.') }}>
                    <input aria-label="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} autoFocus />
                    <textarea aria-label="Descripción" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${inputClass} min-h-20`} placeholder="Descripción (opcional)" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm"><Check size={15} /> Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={15} /> Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl font-semibold text-ink">{item.name}</p>
                      {item.description && <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{item.description}</p>}
                      <p className="mt-1 text-[12.5px] text-ink-3">{usage(item.id)} {usage(item.id) === 1 ? 'libro' : 'libros'}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end">
                      <IconButton label="Subir" disabled={i === 0} onClick={() => onMove(item.id, -1)}><ArrowUp size={16} /></IconButton>
                      <IconButton label="Bajar" disabled={i === items.length - 1} onClick={() => onMove(item.id, 1)}><ArrowDown size={16} /></IconButton>
                      <IconButton label="Renombrar" onClick={() => { setEditing(item.id); setDraft({ name: item.name, description: item.description ?? '' }) }}><Pencil size={16} /></IconButton>
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
        <Button type="submit" className="w-full" disabled={!name.trim()}><Plus size={16} /> Agregar</Button>
      </form>
    </div>
  )
}
