import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MULTIMODAL_SESSION_OPTIONS,
  normalizeAvailability,
  WorksheetChromeAIPlugin,
} from '../chrome-ai-plugin'
import { WORKSHEET_ANALYSIS_JSON_SCHEMA } from '../schemas'

describe('WorksheetChromeAIPlugin (src/ai/chrome-ai-plugin.ts)', () => {
  const originalLanguageModel = (globalThis as any).LanguageModel

  beforeEach(() => {
    delete (globalThis as any).LanguageModel
  })

  afterEach(() => {
    if (originalLanguageModel) {
      ;(globalThis as any).LanguageModel = originalLanguageModel
    } else {
      delete (globalThis as any).LanguageModel
    }
  })

  it('normalizes Chrome Prompt API availability statuses across browser versions', () => {
    expect(normalizeAvailability('available')).toBe('readily')
    expect(normalizeAvailability('readily')).toBe('readily')
    expect(normalizeAvailability('downloadable')).toBe('after-download')
    expect(normalizeAvailability('after-download')).toBe('after-download')
    expect(normalizeAvailability('downloading')).toBe('after-download')
    expect(normalizeAvailability('unavailable')).toBe('unavailable')
    expect(normalizeAvailability(null)).toBe('unavailable')
  })

  it('returns unavailable when window.LanguageModel is not present', async () => {
    const status = await WorksheetChromeAIPlugin.checkModelAvailability()
    expect(status).toBe('unavailable')
  })

  it('initializes LanguageModel session with multimodal expectedInputs and executes structured prompts', async () => {
    const mockDestroy = vi.fn()
    const mockPrompt = vi.fn().mockResolvedValue(JSON.stringify({ ok: true }))
    const mockClone = vi.fn().mockResolvedValue({
      prompt: mockPrompt,
      destroy: mockDestroy,
    })
    const mockCreate = vi.fn().mockResolvedValue({
      prompt: mockPrompt,
      clone: mockClone,
      destroy: mockDestroy,
    })
    const mockAvailability = vi.fn().mockResolvedValue('available')

    ;(globalThis as any).LanguageModel = {
      availability: mockAvailability,
      create: mockCreate,
    }

    const plugin = new WorksheetChromeAIPlugin()
    const status = await WorksheetChromeAIPlugin.checkModelAvailability()
    expect(status).toBe('readily')
    expect(mockAvailability).toHaveBeenCalledWith(MULTIMODAL_SESSION_OPTIONS)

    await plugin.init('System prompt for educator')
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const createArgs = mockCreate.mock.calls[0][0]
    expect(createArgs.expectedInputs).toEqual(MULTIMODAL_SESSION_OPTIONS.expectedInputs)
    expect(createArgs.expectedOutputs).toEqual(MULTIMODAL_SESSION_OPTIONS.expectedOutputs)
    expect(createArgs.initialPrompts).toEqual([
      { role: 'system', content: 'System prompt for educator' },
    ])

    const output = await plugin.generate({
      prompt: 'Analyze this worksheet',
      schema: WORKSHEET_ANALYSIS_JSON_SCHEMA,
    })

    expect(mockClone).toHaveBeenCalledTimes(1)
    expect(mockPrompt).toHaveBeenCalledWith('Analyze this worksheet', {
      responseConstraint: WORKSHEET_ANALYSIS_JSON_SCHEMA,
    })
    expect(mockDestroy).toHaveBeenCalledTimes(1)
    expect(output).toBe(JSON.stringify({ ok: true }))
  })
})
