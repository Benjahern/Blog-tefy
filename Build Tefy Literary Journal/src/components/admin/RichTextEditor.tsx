import { useCallback, useEffect, useRef, useState } from 'react'
import { Bold, EyeOff, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, LoaderCircle, Pilcrow, Quote } from 'lucide-react'
import { fileToCompressedDataUrl, ImageError } from '@/lib/images'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { REVIEW_FONTS, reviewFontIdFromFace, type ReviewFontId } from '@/lib/reviewFonts'

type Props = { value: string; onChange: (html: string) => void; resetKey?: string; labelledBy?: string; onError?: (msg: string) => void }

type Active = { bold: boolean; italic: boolean; ul: boolean; ol: boolean; block: string; spoiler: boolean }
const NONE: Active = { bold: false, italic: false, ul: false, ol: false, block: 'p', spoiler: false }

/**
 * Lightweight contentEditable editor: formatting through a toolbar, no Markdown or HTML needed.
 * Output is sanitized again whenever it is saved or rendered.
 */
export function RichTextEditor({ value, onChange, resetKey, labelledBy, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState<Active>(NONE)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [font, setFont] = useState<ReviewFontId>('default')

  // Load external content only on mount / when switching documents, to keep the caret stable.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value
    document.execCommand('defaultParagraphSeparator', false, 'p')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const emit = useCallback(() => { if (ref.current) onChange(ref.current.innerHTML) }, [onChange])

  const inEditor = (node: Node | null) => !!node && !!ref.current?.contains(node)

  const refresh = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || !inEditor(sel.anchorNode)) return
    const el = (sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement) ?? null
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      block: String(document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, ''),
      spoiler: !!el?.closest('[data-spoiler]'),
    })
    const fontEl = el?.closest('[data-font], font[face]')
    setFont(fontEl ? (fontEl.hasAttribute('data-font') ? (fontEl.getAttribute('data-font') as ReviewFontId) : reviewFontIdFromFace(fontEl.getAttribute('face') ?? '')) : 'default')
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', refresh)
    return () => document.removeEventListener('selectionchange', refresh)
  }, [refresh])

  const saveSelection = () => {
    const sel = window.getSelection()
    savedRange.current = sel && sel.rangeCount && inEditor(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null
  }
  const restoreSelection = () => {
    ref.current?.focus()
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    if (savedRange.current) sel.addRange(savedRange.current)
    else {
      const r = document.createRange()
      r.selectNodeContents(ref.current!)
      r.collapse(false)
      sel.addRange(r)
    }
  }

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    emit()
    refresh()
  }
  const block = (tag: string) => exec('formatBlock', active.block === tag ? 'p' : tag)

  const applyFont = (id: ReviewFontId) => {
    restoreSelection()
    const choice = REVIEW_FONTS.find((item) => item.id === id)!
    const family = id === 'default' ? 'inherit' : choice.label
    document.execCommand('fontName', false, family)
    emit()
    setFont(id)
    refresh()
  }

  const toggleSpoiler = () => {
    const sel = window.getSelection()
    const anchor = sel?.anchorNode
    const el = anchor instanceof Element ? anchor : anchor?.parentElement
    const spoiler = el?.closest('[data-spoiler]')
    if (spoiler && inEditor(spoiler)) {
      spoiler.replaceWith(...Array.from(spoiler.childNodes))
      emit(); refresh(); return
    }
    let inner = '<p>Escribe aquí lo que quieres ocultar…</p>'
    if (sel && sel.rangeCount && !sel.isCollapsed && inEditor(sel.anchorNode)) {
      const tmp = document.createElement('div')
      tmp.appendChild(sel.getRangeAt(0).cloneContents())
      inner = /<(p|h2|h3|ul|ol|blockquote)/.test(tmp.innerHTML) ? tmp.innerHTML : `<p>${tmp.innerHTML}</p>`
    }
    exec('insertHTML', `<div data-spoiler="true">${inner}</div><p><br></p>`)
  }

  const insertLink = () => {
    const url = linkUrl.trim()
    setLinkOpen(false)
    if (!url) return
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`
    restoreSelection()
    const sel = window.getSelection()
    if (sel?.isCollapsed) exec('insertHTML', `<a href="${href.replace(/"/g, '%22')}">${url.replace(/</g, '&lt;')}</a>`)
    else exec('createLink', href)
  }

  const onImages = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const src = await fileToCompressedDataUrl(file, 1100, 0.78)
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        restoreSelection()
        document.execCommand('insertHTML', false, `<figure><img src="${src}" alt="${alt.replace(/"/g, '')}"><figcaption></figcaption></figure><p><br></p>`)
        saveSelection()
      }
      emit()
    } catch (e) {
      onError?.(e instanceof ImageError ? e.message : 'No pudimos insertar la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const tools = [
    { label: 'Negrita', Icon: Bold, on: active.bold, run: () => exec('bold') },
    { label: 'Cursiva', Icon: Italic, on: active.italic, run: () => exec('italic') },
    { sep: true },
    { label: 'Párrafo normal', Icon: Pilcrow, on: active.block === 'p' && !active.ul && !active.ol, run: () => exec('formatBlock', 'p') },
    { label: 'Título de sección', Icon: Heading2, on: active.block === 'h2', run: () => block('h2') },
    { label: 'Subtítulo', Icon: Heading3, on: active.block === 'h3', run: () => block('h3') },
    { label: 'Cita destacada', Icon: Quote, on: active.block === 'blockquote', run: () => block('blockquote') },
    { sep: true },
    { label: 'Lista con viñetas', Icon: List, on: active.ul, run: () => exec('insertUnorderedList') },
    { label: 'Lista numerada', Icon: ListOrdered, on: active.ol, run: () => exec('insertOrderedList') },
    { sep: true },
    { label: 'Agregar enlace', Icon: Link2, on: false, run: () => { saveSelection(); setLinkUrl(''); setLinkOpen(true) } },
    { label: 'Agregar imágenes', Icon: uploading ? LoaderCircle : ImagePlus, on: false, run: () => { saveSelection(); fileRef.current?.click() } },
    { label: active.spoiler ? 'Quitar spoiler' : 'Ocultar como spoiler', Icon: EyeOff, on: active.spoiler, run: toggleSpoiler, text: 'Spoiler' },
  ] as const

  return (
    <div className="rounded-2xl border border-line bg-night/50 focus-within:border-[#3d6475]">
      <div role="toolbar" aria-label="Formato del texto" className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-line bg-night-2/95 p-1.5 backdrop-blur lg:top-0">
        <label className="sr-only" htmlFor="review-font">Tipo de letra</label>
        <select id="review-font" aria-label="Tipo de letra" value={font} onMouseDown={saveSelection} onChange={(e) => applyFont(e.target.value as ReviewFontId)} className="mx-1 h-9 max-w-48 rounded-lg border border-line bg-night px-2 text-sm text-ink">
          {REVIEW_FONTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        {tools.map((t, i) =>
          'sep' in t ? (
            <span key={i} className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
          ) : (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-pressed={t.on}
              onMouseDown={(e) => e.preventDefault()}
              onClick={t.run}
              className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] transition-colors ${t.on ? 'bg-petrol text-ink' : 'text-ink-2 hover:bg-surface-hover hover:text-ink'}`}
            >
              <t.Icon size={17} className={t.Icon === LoaderCircle ? 'animate-spin' : ''} />
              {'text' in t && <span className="hidden sm:inline">{t.text}</span>}
            </button>
          ),
        )}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Empieza a escribir… Puedes contar tu historia con este libro como quieras."
        onInput={emit}
        onBlur={emit}
        onKeyUp={refresh}
        onMouseUp={refresh}
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          const html = text.split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')
          exec('insertHTML', html)
        }}
        className="tefy-prose tefy-editor min-h-[420px] max-w-none px-5 py-6 sm:px-8 sm:py-8"
        style={{ ['--prose-size' as string]: '18px' }}
      />
      <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { onImages(e.target.files); e.target.value = '' }} />
      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} title="Agregar enlace">
        <form className="space-y-5 px-5 py-5" onSubmit={(e) => { e.preventDefault(); insertLink() }}>
          <TextField label="Dirección del enlace" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" autoFocus hint="Si seleccionaste texto antes, ese texto se convertirá en el enlace." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setLinkOpen(false)}>Cancelar</Button>
            <Button type="submit">Agregar enlace</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
