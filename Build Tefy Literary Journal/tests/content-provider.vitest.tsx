import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const repository = vi.hoisted(() => ({ empty: vi.fn(), load: vi.fn(), save: vi.fn() }))
vi.mock('@/services/contentRepository', () => ({ contentRepository: repository }))

import { createSeedState } from '../src/data/seed'
import { ContentProvider, useContent } from '../src/hooks/useContent'

function Probe() {
  const { state, updateSettings } = useContent()
  return <><span>{state.settings.siteName}</span><button onClick={() => updateSettings({ siteName: 'Updated' })}>Guardar</button></>
}

describe('ContentProvider persistence', () => {
  beforeEach(() => {
    repository.empty.mockReset().mockImplementation(createSeedState)
    repository.load.mockReset().mockResolvedValue(createSeedState())
    repository.save.mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('commits state and reports asynchronous save failures', async () => {
    const saveError = vi.fn()
    window.addEventListener('tefy:save-error', saveError)
    try {
      render(<ContentProvider><Probe /></ContentProvider>)
      await waitFor(() => expect(repository.load).toHaveBeenCalled())
      repository.save.mockRejectedValueOnce(new Error('offline'))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Updated')).toBeTruthy()
      await waitFor(() => expect(saveError).toHaveBeenCalledTimes(1))
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ settings: expect.objectContaining({ siteName: 'Updated' }) }))
    } finally {
      window.removeEventListener('tefy:save-error', saveError)
    }
  })
})
