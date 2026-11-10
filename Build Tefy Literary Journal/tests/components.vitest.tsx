import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

const feedback = vi.hoisted(() => ({ toast: vi.fn(), confirm: vi.fn() }))

vi.mock('@/components/ui/Feedback', () => ({ useFeedback: () => feedback }))
vi.mock('@/components/ui/ImageUpload', () => ({
  ImageUpload: ({ label, value, onChange }: { label: string; value?: string; onChange: (value?: string) => void }) => (
    <button type="button" onClick={() => onChange(value ? undefined : 'data:image/jpeg;base64,ZmFrZQ==')}>{label} {value ? 'seleccionada' : 'vacía'}</button>
  ),
}))

import { TaxonomyManager } from '../src/components/admin/TaxonomyManager'
import { FallingPetals } from '../src/components/layout/FallingPetals'

const noop = () => undefined

describe('public and taxonomy feature components', () => {
  beforeEach(() => {
    feedback.toast.mockReset()
    feedback.confirm.mockReset().mockResolvedValue(true)
  })
  afterEach(cleanup)

  it('renders decorative falling flowers without exposing them to assistive technology', () => {
    const { container } = render(<FallingPetals />)
    const layer = container.querySelector('[aria-hidden="true"]')
    expect(layer).not.toBeNull()
    expect(layer?.querySelectorAll('span')).toHaveLength(12)
  })

  it('adds and edits taxonomy with image and collection kind, and rejects duplicate names', () => {
    const onAdd = vi.fn()
    const onUpdate = vi.fn()
    const items = [{ id: 'series-1', name: 'Crónicas', description: 'Una colección', image: '/cover.jpg', kind: 'saga' as const }]
    const { container } = render(
      <TaxonomyManager
        items={items}
        usage={() => 1}
        noun={{ one: 'una colección', add: 'Nueva colección', placeholder: 'Nombre' }}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={noop}
        onMove={noop}
        allowImage
        allowKind
      />,
    )

    const addForm = container.querySelectorAll('form')[0]
    fireEvent.change(within(addForm).getAllByRole('textbox')[0], { target: { value: 'Crónicas' } })
    fireEvent.submit(addForm)
    expect(onAdd).not.toHaveBeenCalled()
    expect(feedback.toast).toHaveBeenCalledWith('Ya existe una colección con ese nombre.', 'error')

    fireEvent.change(within(addForm).getAllByRole('textbox')[0], { target: { value: 'Nueva colección' } })
    fireEvent.change(within(addForm).getAllByRole('textbox')[1], { target: { value: 'Descripción nueva' } })
    fireEvent.change(within(addForm).getByLabelText('Tipo de colección'), { target: { value: 'trilogy' } })
    fireEvent.click(within(addForm).getByRole('button', { name: /Imagen/ }))
    fireEvent.submit(addForm)
    expect(onAdd).toHaveBeenCalledWith('Nueva colección', 'Descripción nueva', 'data:image/jpeg;base64,ZmFrZQ==', 'trilogy')

    fireEvent.click(screen.getByRole('button', { name: 'Renombrar' }))
    const firstEditForm = container.querySelectorAll('form')[0]
    fireEvent.change(within(firstEditForm).getAllByRole('textbox')[1], { target: { value: 'Descripción editada' } })
    fireEvent.click(within(firstEditForm).getByRole('button', { name: 'Cancelar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Renombrar' }))
    const editForm = container.querySelectorAll('form')[0]
    fireEvent.change(within(editForm).getAllByRole('textbox')[0], { target: { value: 'Crónicas renovadas' } })
    fireEvent.change(within(editForm).getAllByRole('textbox')[1], { target: { value: 'La descripción ahora es distinta.' } })
    fireEvent.change(within(editForm).getByLabelText('Tipo de colección'), { target: { value: 'bilogy' } })
    fireEvent.click(within(editForm).getByRole('button', { name: /Imagen/ }))
    fireEvent.click(within(editForm).getByRole('button', { name: 'Guardar' }))
    expect(onUpdate).toHaveBeenCalledWith('series-1', expect.objectContaining({ name: 'Crónicas renovadas', description: 'La descripción ahora es distinta.', kind: 'bilogy' }))
  })

  it('reorders and confirms deletion of taxonomy items', async () => {
    const onMove = vi.fn()
    const onDelete = vi.fn()
    const items = [{ id: 'first', name: 'Primera' }, { id: 'second', name: 'Segunda' }]
    render(
      <TaxonomyManager
        items={items}
        usage={(id) => id === 'first' ? 1 : 0}
        noun={{ one: 'un género', add: 'Nuevo género', placeholder: 'Nombre' }}
        onAdd={noop}
        onUpdate={noop}
        onDelete={onDelete}
        onMove={onMove}
      />,
    )
    const listItems = screen.getAllByRole('listitem')
    fireEvent.click(within(listItems[0]).getByRole('button', { name: 'Bajar' }))
    fireEvent.click(within(listItems[1]).getByRole('button', { name: 'Subir' }))
    expect(onMove).toHaveBeenNthCalledWith(1, 'first', 1)
    expect(onMove).toHaveBeenNthCalledWith(2, 'second', -1)

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalledWith('first'))
    expect(feedback.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('1 libro quedará') }))
  })
})
