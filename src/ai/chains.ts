import {
  JSONOutputParserRunnable,
  LLMRunnable,
  RunnableLambda,
  RunnableSequence,
  StructuredOutputRunnable,
  validateJSONSchema,
  type AgentWorkerInvocationState,
  type AskLLMFn,
} from '@gilfink/prompt-chain'
import {
  buildAnalyzeWorksheetPrompt,
  buildGenerateProblemsPrompt,
  MAX_CUSTOM_PROMPT_LENGTH,
  sanitizeCustomPrompt,
  sanitizeWorksheetAnalysis,
  shuffleAnswerBank,
} from './prompts'
import {
  GENERATED_PROBLEMS_JSON_SCHEMA,
  WORKSHEET_ANALYSIS_JSON_SCHEMA,
  type GeneratedProblemsResult,
  type WorksheetAnalysis,
} from './schemas'

export type MultimodalImageSource =
  | Blob
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | ImageData

export interface AnalyzeWorksheetChainInput {
  image: MultimodalImageSource
  removeHandwriting?: boolean
}

export interface GenerateProblemsChainInput {
  worksheetAnalysis: WorksheetAnalysis | string
  numberOfProblems?: number
  customPrompt?: string
}

export type WorksheetWorkerRequest =
  | {
      action: 'analyze'
      image: MultimodalImageSource
      removeHandwriting?: boolean
    }
  | {
      action: 'generate'
      worksheetAnalysis: WorksheetAnalysis | string
      numberOfProblems?: number
      customPrompt?: string
    }

export interface MultimodalPromptMessage {
  role: 'system' | 'user' | 'assistant'
  content: Array<
    | { type: 'text'; value: string }
    | { type: 'image'; value: MultimodalImageSource }
  >
}

/**
 * Creates a `@gilfink/prompt-chain` LCEL `RunnableSequence` that analyzes a worksheet image
 * using Chrome's multimodal Prompt API and validates the output against `WORKSHEET_ANALYSIS_JSON_SCHEMA`.
 */
export function createAnalyzeWorksheetChain(
  askLLM: AskLLMFn
): RunnableSequence<AnalyzeWorksheetChainInput, WorksheetAnalysis> {
  const llmRunnable = new LLMRunnable(askLLM, WORKSHEET_ANALYSIS_JSON_SCHEMA)
  const structuredAnalyzer = new StructuredOutputRunnable<
    MultimodalPromptMessage[],
    WorksheetAnalysis
  >(llmRunnable, WORKSHEET_ANALYSIS_JSON_SCHEMA, {
    parser: new JSONOutputParserRunnable<WorksheetAnalysis>(),
  })

  const buildMultimodalPromptStep = new RunnableLambda<
    AnalyzeWorksheetChainInput,
    { image: MultimodalImageSource; promptText: string; messages: MultimodalPromptMessage[] }
  >(async (input) => {
    if (!input || !input.image) {
      throw new Error('A worksheet image is required for analysis.')
    }
    const promptText = buildAnalyzeWorksheetPrompt(Boolean(input.removeHandwriting))
    const messages: MultimodalPromptMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', value: promptText },
          { type: 'image', value: input.image },
        ],
      },
    ]
    return { image: input.image, promptText, messages }
  })

  const executeAndValidateStep = new RunnableLambda<
    { image: MultimodalImageSource; promptText: string; messages: MultimodalPromptMessage[] },
    WorksheetAnalysis
  >(async ({ image, promptText, messages }) => {
    let result = await structuredAnalyzer.invoke(messages)

    // Self-correction retry if initial output violated the JSON Schema
    if (!result.success || !result.parsed) {
      const repairMessages: MultimodalPromptMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              value: `${promptText}\n\nYour previous response failed JSON Schema validation with error: ${result.error}. Please fix the JSON and ensure all required fields are present.`,
            },
            { type: 'image', value: image },
          ],
        },
      ]
      result = await structuredAnalyzer.invoke(repairMessages)
    }

    if (!result.success || !result.parsed) {
      throw new Error(result.error || 'Failed to analyze worksheet image.')
    }

    return result.parsed
  })

  const normalizeOutputStep = new RunnableLambda<WorksheetAnalysis, WorksheetAnalysis>(
    async (parsed) => sanitizeWorksheetAnalysis(parsed)
  )

  return RunnableSequence.from<AnalyzeWorksheetChainInput, WorksheetAnalysis>([
    buildMultimodalPromptStep,
    executeAndValidateStep,
    normalizeOutputStep,
  ])
}

/**
 * Creates a `@gilfink/prompt-chain` LCEL `RunnableSequence` that takes a `WorksheetAnalysis`
 * and generates new practice problems and answers validated against `GENERATED_PROBLEMS_JSON_SCHEMA`.
 */
export function createGenerateProblemsChain(
  askLLM: AskLLMFn
): RunnableSequence<GenerateProblemsChainInput, GeneratedProblemsResult> {
  const llmRunnable = new LLMRunnable(askLLM, GENERATED_PROBLEMS_JSON_SCHEMA)
  const structuredGenerator = new StructuredOutputRunnable<string, GeneratedProblemsResult>(
    llmRunnable,
    GENERATED_PROBLEMS_JSON_SCHEMA,
    {
      parser: new JSONOutputParserRunnable<GeneratedProblemsResult>(),
    }
  )

  const preparePromptStep = new RunnableLambda<
    GenerateProblemsChainInput,
    { analysis: WorksheetAnalysis; numberOfProblems: number; promptText: string }
  >(async (input) => {
    if (!input || !input.worksheetAnalysis) {
      throw new Error('Worksheet analysis is required to generate practice problems.')
    }

    let parsedAnalysis: WorksheetAnalysis
    if (typeof input.worksheetAnalysis === 'string') {
      try {
        parsedAnalysis = JSON.parse(input.worksheetAnalysis) as WorksheetAnalysis
      } catch (err) {
        throw new Error(
          `Invalid JSON format for worksheetAnalysis: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    } else {
      parsedAnalysis = { ...input.worksheetAnalysis }
    }

    // Ensure optional/default fields exist before schema check
    parsedAnalysis.additional_notes_for_generation =
      parsedAnalysis.additional_notes_for_generation ?? ''

    const validation = validateJSONSchema(WORKSHEET_ANALYSIS_JSON_SCHEMA, parsedAnalysis)
    if (!validation.valid) {
      throw new Error(`Invalid worksheetAnalysis input: ${validation.errors.join('; ')}`)
    }

    parsedAnalysis = sanitizeWorksheetAnalysis(parsedAnalysis)

    const sanitizedCustom = input.customPrompt ? sanitizeCustomPrompt(input.customPrompt) : ''
    if (sanitizedCustom) {
      const combinedNotes = parsedAnalysis.additional_notes_for_generation
        ? `${parsedAnalysis.additional_notes_for_generation}. ${sanitizedCustom}`
        : sanitizedCustom
      parsedAnalysis.additional_notes_for_generation = sanitizeCustomPrompt(
        combinedNotes,
        MAX_CUSTOM_PROMPT_LENGTH
      )
    }

    const requestedCount = Number.isFinite(input.numberOfProblems)
      ? Math.max(1, Math.min(50, Math.floor(input.numberOfProblems!)))
      : 5

    const promptText = buildGenerateProblemsPrompt(parsedAnalysis, requestedCount)
    return {
      analysis: parsedAnalysis,
      numberOfProblems: requestedCount,
      promptText,
    }
  })

  const executeGenerationStep = new RunnableLambda<
    { analysis: WorksheetAnalysis; numberOfProblems: number; promptText: string },
    { analysis: WorksheetAnalysis; generated: GeneratedProblemsResult }
  >(async ({ analysis, promptText }) => {
    let result = await structuredGenerator.invoke(promptText)

    // Self-correction retry if initial output violated the JSON Schema
    if (!result.success || !result.parsed) {
      const repairPrompt = `${promptText}\n\nYour previous response failed JSON Schema validation: ${result.error}. Respond strictly with a JSON object containing "problems" (array of { "question", "answer" }) and "answer_bank_present" (boolean).`
      result = await structuredGenerator.invoke(repairPrompt)
    }

    if (!result.success || !result.parsed) {
      throw new Error(result.error || 'Failed to generate practice problems.')
    }

    return { analysis, generated: result.parsed }
  })

  const postProcessStep = new RunnableLambda<
    { analysis: WorksheetAnalysis; generated: GeneratedProblemsResult },
    GeneratedProblemsResult
  >(async ({ analysis, generated }) => {
    const answerBankPresent = Boolean(analysis.answer_bank_present)
    const problems = Array.isArray(generated.problems) ? generated.problems : []

    const output: GeneratedProblemsResult = {
      problems,
      answer_bank_present: answerBankPresent,
    }

    if (answerBankPresent && problems.length > 0) {
      output.answerBank = shuffleAnswerBank(problems.map((p) => p.answer))
    }

    return output
  })

  return RunnableSequence.from<GenerateProblemsChainInput, GeneratedProblemsResult>([
    preparePromptStep,
    executeGenerationStep,
    postProcessStep,
  ])
}

/**
 * Creates a universal `@gilfink/prompt-chain` worker runnable router compatible with `createAgentWorker()`.
 */
export function createWorksheetAgentRouter(): RunnableLambda<
  AgentWorkerInvocationState<WorksheetWorkerRequest>,
  string
> {
  return new RunnableLambda(async (state) => {
    const request = state.userPrompt
    if (!request || typeof request !== 'object' || !('action' in request)) {
      throw new Error('Invalid worksheet worker request payload.')
    }

    if (request.action === 'analyze') {
      state.logToMain?.('Analyzing worksheet image with Chrome Prompt API...')
      const chain = createAnalyzeWorksheetChain(state.askLLM)
      const analysis = await chain.invoke({
        image: request.image,
        removeHandwriting: request.removeHandwriting,
      })
      return JSON.stringify(analysis)
    }

    if (request.action === 'generate') {
      state.logToMain?.('Generating practice problems with Chrome Prompt API...')
      const chain = createGenerateProblemsChain(state.askLLM)
      const generated = await chain.invoke({
        worksheetAnalysis: request.worksheetAnalysis,
        numberOfProblems: request.numberOfProblems,
        customPrompt: request.customPrompt,
      })
      return JSON.stringify(generated)
    }

    throw new Error(`Unsupported worksheet worker action: ${(request as any).action}`)
  })
}
