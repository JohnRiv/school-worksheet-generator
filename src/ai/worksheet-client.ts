import {
  PromptChainHost,
  type ChromeBuiltInAIPluginOptions,
  type DownloadProgressInfo,
} from '@gilfink/prompt-chain'
import {
  WorksheetChromeAIPlugin,
  type NormalizedAvailability,
} from './chrome-ai-plugin'
import {
  createAnalyzeWorksheetChain,
  createGenerateProblemsChain,
  type MultimodalImageSource,
  type WorksheetWorkerRequest,
} from './chains'
import type { GeneratedProblemsResult, WorksheetAnalysis } from './schemas'

export interface WorksheetClientOptions {
  onDownloadProgress?: (progress: DownloadProgressInfo) => void
  useWorker?: boolean
}

const SYSTEM_PROMPT =
  'You are an expert K-12 teacher and curriculum designer. You analyze school worksheets accurately and generate well-crafted practice problems and answers in valid JSON.'

/**
 * High-level client orchestrating `@gilfink/prompt-chain`'s `PromptChainHost`
 * (running `worksheet.worker.ts`) and `WorksheetChromeAIPlugin`.
 */
export class WorksheetAIClient {
  private host: PromptChainHost | null = null
  private plugin: WorksheetChromeAIPlugin
  private initialized = false
  private useWorker: boolean

  constructor(options: WorksheetClientOptions = {}) {
    const pluginOptions: ChromeBuiltInAIPluginOptions = {
      onDownloadProgress: options.onDownloadProgress,
    }
    this.plugin = new WorksheetChromeAIPlugin(pluginOptions)
    this.useWorker = options.useWorker ?? typeof Worker !== 'undefined'
  }

  async checkAvailability(): Promise<NormalizedAvailability> {
    return WorksheetChromeAIPlugin.checkModelAvailability()
  }

  async init(): Promise<void> {
    if (this.initialized) return

    if (this.useWorker && typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('./worksheet.worker.ts', import.meta.url), {
        type: 'module',
      })
      this.host = new PromptChainHost(worker, {
        model: this.plugin,
      })
      await this.host.init(SYSTEM_PROMPT)
    } else {
      await this.plugin.init(SYSTEM_PROMPT)
    }

    this.initialized = true
  }

  async analyzeWorksheet(
    image: MultimodalImageSource,
    removeHandwriting: boolean,
    signal?: AbortSignal
  ): Promise<WorksheetAnalysis> {
    await this.init()

    if (this.host) {
      const request: WorksheetWorkerRequest = {
        action: 'analyze',
        image,
        removeHandwriting,
      }
      const responseJson = await this.host.runAgent(request, 'analyze_session', { signal })
      return JSON.parse(responseJson) as WorksheetAnalysis
    }

    const chain = createAnalyzeWorksheetChain((prompt, schema) =>
      this.plugin.generate({ prompt, schema })
    )
    return chain.invoke({ image, removeHandwriting })
  }

  async generatePracticeProblems(
    worksheetAnalysis: WorksheetAnalysis,
    numberOfProblems: number,
    customPrompt?: string,
    signal?: AbortSignal
  ): Promise<GeneratedProblemsResult> {
    await this.init()

    if (this.host) {
      const request: WorksheetWorkerRequest = {
        action: 'generate',
        worksheetAnalysis,
        numberOfProblems,
        customPrompt,
      }
      const responseJson = await this.host.runAgent(request, 'generate_session', { signal })
      return JSON.parse(responseJson) as GeneratedProblemsResult
    }

    const chain = createGenerateProblemsChain((prompt, schema) =>
      this.plugin.generate({ prompt, schema })
    )
    return chain.invoke({ worksheetAnalysis, numberOfProblems, customPrompt })
  }

  destroy(): void {
    if (this.host) {
      this.host.terminate()
      this.host = null
    } else {
      void this.plugin.destroy()
    }
    this.initialized = false
  }
}

export const worksheetClient = new WorksheetAIClient()
