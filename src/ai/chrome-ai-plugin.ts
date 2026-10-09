import {
  CallbackEvents,
  ChromeBuiltInAIPlugin,
  type ChromeBuiltInAIPluginOptions,
  type DownloadProgressInfo,
  type JSONSchema,
  type ModelGeneratePayload,
} from '@gilfink/prompt-chain'

export type NormalizedAvailability = 'readily' | 'after-download' | 'unavailable'

/**
 * Multimodal input/output capabilities required by the School Worksheet Generator:
 * - 'image' + 'text' inputs for analyzing photos of worksheets
 * - 'text' output in English for structured JSON responses
 */
export const MULTIMODAL_SESSION_OPTIONS = {
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
  ],
  expectedOutputs: [
    { type: 'text', languages: ['en'] },
  ],
}

export function normalizeAvailability(rawStatus: string | undefined | null): NormalizedAvailability {
  if (!rawStatus) return 'unavailable'
  const lower = rawStatus.toLowerCase()
  if (lower === 'readily' || lower === 'available') {
    return 'readily'
  }
  if (lower === 'after-download' || lower === 'downloadable' || lower === 'downloading') {
    return 'after-download'
  }
  return 'unavailable'
}

function getGlobalLanguageModel(): any {
  if (typeof window !== 'undefined' && 'LanguageModel' in window && (window as any).LanguageModel) {
    return (window as any).LanguageModel
  }
  if (typeof globalThis !== 'undefined' && 'LanguageModel' in globalThis && (globalThis as any).LanguageModel) {
    return (globalThis as any).LanguageModel
  }
  return null
}

/**
 * Extends `@gilfink/prompt-chain`'s `ChromeBuiltInAIPlugin` to support
 * Chrome Prompt API multimodal image inputs (`expectedInputs: [{ type: 'text' }, { type: 'image' }]`)
 * and structured JSON Schema output (`responseConstraint`).
 */
export class WorksheetChromeAIPlugin extends ChromeBuiltInAIPlugin {
  constructor(options: ChromeBuiltInAIPluginOptions = {}) {
    super({
      ...MULTIMODAL_SESSION_OPTIONS,
      ...options,
    })
  }

  /**
   * Checks whether Chrome's Built-in AI (`window.LanguageModel`) is available with
   * multimodal support, normalizing the status across Chrome versions.
   */
  static async checkModelAvailability(
    options: Record<string, unknown> = MULTIMODAL_SESSION_OPTIONS
  ): Promise<NormalizedAvailability> {
    const lm = getGlobalLanguageModel()
    if (!lm) {
      return 'unavailable'
    }
    try {
      const raw = await ChromeBuiltInAIPlugin.checkAvailability(options)
      if (raw === 'unavailable' && options === MULTIMODAL_SESSION_OPTIONS) {
        // Fallback check without expectedInputs in case an older Chrome build doesn't accept options in availability()
        const fallbackRaw = await ChromeBuiltInAIPlugin.checkAvailability()
        return normalizeAvailability(fallbackRaw)
      }
      return normalizeAvailability(raw)
    } catch {
      return 'unavailable'
    }
  }

  /**
   * Initializes the Chrome `LanguageModel` session with multimodal `expectedInputs`
   * (`text` and `image`), `expectedOutputs` (`text`), and download progress monitoring.
   */
  override async init(systemPrompt?: string, initOptions: Record<string, unknown> = {}): Promise<void> {
    const lm = getGlobalLanguageModel()
    if (!lm) {
      throw new Error(
        'Chrome Built-in AI (window.LanguageModel) is not available in this browser. Please use Google Chrome with the Prompt API enabled.'
      )
    }

    this.systemPrompt = systemPrompt || this.systemPrompt
    const mergedOptions: ChromeBuiltInAIPluginOptions = {
      ...MULTIMODAL_SESSION_OPTIONS,
      ...this.options,
      ...initOptions,
    }

    const availability = await WorksheetChromeAIPlugin.checkModelAvailability({
      expectedInputs: mergedOptions.expectedInputs,
      expectedOutputs: mergedOptions.expectedOutputs,
    })

    if (availability === 'unavailable') {
      throw new Error(
        'Chrome Built-in AI model is unavailable on this device. Check chrome://on-device-internals and chrome://flags/#prompt-api-for-gemini-nano.'
      )
    }

    if (availability === 'after-download' && mergedOptions.activationButton) {
      await ChromeBuiltInAIPlugin.ensureUserActivation({
        activationButton: mergedOptions.activationButton,
        activationHint: mergedOptions.activationHint,
      })
    }

    const progressEl = mergedOptions.downloadProgress
    const onProgress = mergedOptions.onDownloadProgress

    const createOptions: Record<string, any> = {
      expectedInputs: mergedOptions.expectedInputs || MULTIMODAL_SESSION_OPTIONS.expectedInputs,
      expectedOutputs: mergedOptions.expectedOutputs || MULTIMODAL_SESSION_OPTIONS.expectedOutputs,
      monitor(m: any) {
        if (m && typeof m.addEventListener === 'function') {
          m.addEventListener('downloadprogress', (event: any) => {
            const loaded = event.loaded ?? 0
            const total = event.total ?? 1
            const percent = total > 0 ? Math.round((loaded / total) * 100) : 0
            const progressPayload: DownloadProgressInfo = {
              resource: 'language-model',
              loaded,
              total,
              percent,
            }

            if (progressEl) {
              progressEl.hidden = false
              if (total > 0) {
                progressEl.max = total
                progressEl.value = loaded
              } else {
                progressEl.removeAttribute('value')
              }
            }

            if (typeof onProgress === 'function') {
              onProgress(progressPayload)
            }

            if (typeof window !== 'undefined' && CallbackEvents?.eventDispatch) {
              window.dispatchEvent(
                new CustomEvent(CallbackEvents.eventDispatch, {
                  detail: {
                    event: CallbackEvents.modelDownloadProgress,
                    ...progressPayload,
                  },
                })
              )
            }
          })
        }
      },
    }

    if (mergedOptions.initialPrompts && mergedOptions.initialPrompts.length > 0) {
      createOptions.initialPrompts = mergedOptions.initialPrompts
    } else if (this.systemPrompt) {
      createOptions.initialPrompts = [{ role: 'system', content: this.systemPrompt }]
    }

    try {
      this.session = await lm.create(createOptions)
    } catch (err) {
      // If multimodal expectedInputs failed on a text-only stub/older build, retry with basic createOptions
      const basicOptions: Record<string, any> = {
        monitor: createOptions.monitor,
      }
      if (createOptions.initialPrompts) {
        basicOptions.initialPrompts = createOptions.initialPrompts
      }
      try {
        this.session = await lm.create(basicOptions)
      } catch {
        throw err
      }
    }

    if (progressEl) {
      progressEl.hidden = true
    }
  }

  /**
   * Executes a prompt (either text or multimodal message array) against Chrome's `LanguageModel` session,
   * forwarding JSON Schema constraints via `responseConstraint`.
   */
  override async generate(
    payload: ModelGeneratePayload | string,
    onToken?: (token: string) => void
  ): Promise<any> {
    if (!this.session) {
      await this.init()
    }

    const promptInput = typeof payload === 'string' ? payload : payload?.prompt ?? ''
    const schema: JSONSchema | undefined =
      typeof payload === 'object' && payload !== null ? payload.schema : undefined

    const promptOptions: Record<string, any> = {}
    if (schema) {
      promptOptions.responseConstraint = schema
    }

    // Clone the session when possible so independent worksheet analyses/generations
    // do not accumulate tokens and overflow the context window.
    let activeSession = this.session
    let isCloned = false
    if (this.session && typeof this.session.clone === 'function') {
      try {
        activeSession = await this.session.clone()
        isCloned = true
      } catch {
        activeSession = this.session
      }
    }

    try {
      // Prefer request-based session.prompt() when using responseConstraint or multimodal array inputs
      if (typeof activeSession.prompt === 'function') {
        const result = await activeSession.prompt(promptInput, promptOptions)
        if (typeof result === 'string' && typeof onToken === 'function') {
          onToken(result)
        }
        return result
      }

      // Fallback to base class implementation if only promptStreaming is defined
      return await super.generate(payload, onToken)
    } finally {
      if (isCloned && activeSession && typeof activeSession.destroy === 'function') {
        try {
          activeSession.destroy()
        } catch {
          // Ignore cleanup errors on cloned session
        }
      }
    }
  }
}
