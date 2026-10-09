declare module '@gilfink/prompt-chain' {
  export interface JSONSchema {
    type?: string | string[]
    properties?: Record<string, JSONSchema>
    required?: string[]
    items?: JSONSchema
    enum?: unknown[]
    description?: string
    [key: string]: unknown
  }

  export interface ValidationResult {
    valid: boolean
    errors: string[]
  }

  export function validateJSONSchema(
    schema: JSONSchema,
    data: unknown,
    path?: string
  ): ValidationResult

  export class Runnable<TInput = any, TOutput = any> {
    invoke(input: TInput, config?: Record<string, unknown>): Promise<TOutput>
    pipe<TNext>(
      next: Runnable<TOutput, TNext> | ((input: TOutput, config?: Record<string, unknown>) => TNext | Promise<TNext>)
    ): Runnable<TInput, TNext>
    bind(kwargs: Record<string, unknown>): Runnable<TInput, TOutput>
  }

  export class RunnableLambda<TInput = any, TOutput = any> extends Runnable<TInput, TOutput> {
    constructor(fn: (input: TInput, config?: Record<string, unknown>) => TOutput | Promise<TOutput>)
  }

  export class RunnableSequence<TInput = any, TOutput = any> extends Runnable<TInput, TOutput> {
    constructor(first: Runnable<any, any>, second: Runnable<any, any>)
    static from<TIn = any, TOut = any>(
      steps: Array<Runnable<any, any> | ((input: any, config?: Record<string, unknown>) => any)>
    ): RunnableSequence<TIn, TOut>
  }

  export class RunnableParallel<TInput = any, TOutput = Record<string, any>> extends Runnable<TInput, TOutput> {
    constructor(
      runnablesMap: Record<string, Runnable<TInput, any> | ((input: TInput, config?: Record<string, unknown>) => any)>
    )
  }

  export class RunnablePassthrough<T = any> extends Runnable<T, T> {
    static assign<TIn extends Record<string, any>, TAdded extends Record<string, any>>(
      mapping: Record<keyof TAdded, Runnable<TIn, any> | ((input: TIn, config?: Record<string, unknown>) => any)>
    ): RunnableLambda<TIn, TIn & TAdded>
  }

  export class RunnableFallback<TInput = any, TOutput = any> extends Runnable<TInput, TOutput> {
    constructor(
      runnables: Array<Runnable<TInput, TOutput>>,
      options?: {
        onFallback?: (
          error: Error,
          failedRunnable: Runnable<TInput, TOutput>,
          nextRunnable: Runnable<TInput, TOutput>,
          index: number
        ) => void | Promise<void>
      }
    )
  }

  export type AskLLMFn = (prompt: any, schema?: JSONSchema) => Promise<any>

  export class LLMRunnable<TInput = any, TOutput = any> extends Runnable<TInput, TOutput> {
    askLLMFn: AskLLMFn
    schema?: JSONSchema
    constructor(askLLMFn: AskLLMFn, schema?: JSONSchema)
  }

  export interface ParsedOutputResult<T = any> {
    success: boolean
    parsed?: T | null
    error?: string
    validationErrors?: string[]
  }

  export class JSONOutputParserRunnable<T = any> extends Runnable<string | object, ParsedOutputResult<T>> {
    constructor()
  }

  export class StructuredOutputRunnable<TInput = any, TParsed = any> extends Runnable<
    TInput,
    ParsedOutputResult<TParsed>
  > {
    boundRunnable: Runnable<TInput, any>
    schema: JSONSchema
    parser: Runnable<any, any> | null
    constructor(
      boundRunnable: Runnable<TInput, any>,
      schema: JSONSchema,
      options?: { parser?: Runnable<any, any> | null }
    )
  }

  export interface ModelGeneratePayload {
    prompt: any
    schema?: JSONSchema
    temperature?: number
    maxTokens?: number
  }

  export class BaseModelPlugin {
    init(systemPrompt?: string, options?: Record<string, unknown>): Promise<void>
    generate(payload: ModelGeneratePayload | string, onToken?: (token: string) => void): Promise<any>
    measureContextUsage(input: unknown): Promise<number>
    getContextStats(): { usage: number; window: number }
    destroy(): Promise<void>
  }

  export interface DownloadProgressInfo {
    resource: string
    loaded: number
    total: number
    percent: number
  }

  export interface ChromeBuiltInAIPluginOptions {
    activationButton?: HTMLElement | null
    activationHint?: HTMLElement | null
    downloadProgress?: HTMLProgressElement | null
    onDownloadProgress?: (progress: DownloadProgressInfo) => void
    tools?: Array<{ name: string; description: string; schema?: JSONSchema; parameters?: JSONSchema }>
    initialPrompts?: Array<{ role: string; content: string }>
    expectedInputs?: Array<{ type: string; languages?: string[] }>
    expectedOutputs?: Array<{ type: string; languages?: string[] }>
    [key: string]: unknown
  }

  export class ChromeBuiltInAIPlugin extends BaseModelPlugin {
    options: ChromeBuiltInAIPluginOptions
    session: any
    systemPrompt: string | null
    constructor(options?: ChromeBuiltInAIPluginOptions)
    static checkAvailability(
      options?: Record<string, unknown>
    ): Promise<'readily' | 'available' | 'after-download' | 'downloadable' | 'downloading' | 'unavailable'>
    static ensureUserActivation(options?: {
      activationButton?: HTMLElement | null
      activationHint?: HTMLElement | null
    }): Promise<void>
  }

  export class CustomModelPlugin extends BaseModelPlugin {
    constructor(options: {
      generateFn: (payload: any, onToken?: (token: string) => void) => Promise<any>
      initFn?: (systemPrompt?: string, options?: Record<string, unknown>) => Promise<void>
      measureContextFn?: (input: unknown) => Promise<number>
      getStatsFn?: () => { usage: number; window: number }
      destroyFn?: () => Promise<void>
    })
  }

  export class LLMSessionManager {
    modelPlugin: BaseModelPlugin
    readonly session: any
    constructor(modelPlugin?: BaseModelPlugin | null)
    init(systemPrompt?: string): Promise<void>
    handlePromptRequest(payload: any, onToken?: (token: string) => void): Promise<any>
    measureContextUsage(input: unknown): Promise<number>
    getContextStats(): { usage: number; window: number }
    destroy(): Promise<void>
  }

  export class PromptChainHost {
    worker: Worker | null
    llmManager: LLMSessionManager
    readonly session: any
    constructor(
      workerUrlOrWorker: string | URL | Worker,
      options?: {
        model?: BaseModelPlugin
        modelPlugin?: BaseModelPlugin
        llmManager?: LLMSessionManager
      }
    )
    init(systemPrompt?: string): Promise<void>
    static checkAvailability(
      options?: Record<string, unknown>
    ): Promise<'readily' | 'available' | 'after-download' | 'downloadable' | 'downloading' | 'unavailable'>
    runAgent(userPrompt: any, sessionId?: string, options?: { signal?: AbortSignal }): Promise<string>
    abortAgent(sessionId?: string): void
    terminate(): void
  }

  export interface AgentWorkerInvocationState<TPrompt = any> {
    userPrompt: TPrompt
    sessionId: string
    signal: AbortSignal
    memory: any
    askLLM: AskLLMFn
    logToMain: (msg: string) => void
  }

  export class Tracer {
    name: string
    constructor(name?: string)
    addExporter(exporter: any): this
  }

  export class CallbackManager {
    tracer: Tracer | null
    constructor(handlers?: Record<string, (payload: any) => void>)
    attachTracer(tracer: Tracer | null): this
    addHandler(event: string, handler: (payload: any) => void): void
    removeHandler(event: string, handler: (payload: any) => void): void
    dispatch(event: string, payload?: Record<string, unknown>): void
  }

  export function createAgentWorker(
    runnableOrTools: Runnable<AgentWorkerInvocationState, any> | any[],
    skills?: any[],
    callbackManager?: CallbackManager | null,
    options?: Record<string, unknown>
  ): void

  export const CallbackEvents: Record<string, string>
  export const MessageContext: Record<string, string>
}
