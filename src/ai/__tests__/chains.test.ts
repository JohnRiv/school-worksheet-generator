import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  createAnalyzeWorksheetChain,
  createGenerateProblemsChain,
  createWorksheetAgentRouter,
} from '../chains'
import {
  GENERATED_PROBLEMS_JSON_SCHEMA,
  WORKSHEET_ANALYSIS_JSON_SCHEMA,
  type WorksheetAnalysis,
} from '../schemas'

const SAMPLE_WORKSHEET_ANALYSIS: WorksheetAnalysis = {
  identified_concepts: [
    {
      subject: 'Math',
      main_topic: 'Fractions',
      specific_concept: 'Simplifying fractions to simplest form',
    },
  ],
  identified_question_formats: [
    'Simplify fraction equation (e.g., 4/8 =)',
    'Word problem with explanation',
  ],
  example_questions: [
    'a. 4/8 =',
    'b. 6/15 =',
    'c. 5/10 =',
    'd. 9/12 =',
    'q. What is 6/24 written in simplest form? Explain how you found your answer.',
  ],
  answer_bank_present: false,
  worksheet_directions: 'Simplify each fraction.',
  additional_notes_for_generation: '',
}

describe('@gilfink/prompt-chain LCEL Chains (src/ai/chains.ts)', () => {
  it('analyzes sample-worksheet.jpg via createAnalyzeWorksheetChain with multimodal prompt messages', async () => {
    const sampleImagePath = path.resolve(process.cwd(), 'sample-worksheet.jpg')
    const imageBuffer = fs.readFileSync(sampleImagePath)
    const sampleBlob = new Blob([imageBuffer], { type: 'image/jpeg' })

    const mockAskLLM = vi.fn().mockResolvedValue(
      `\`\`\`json\n${JSON.stringify(SAMPLE_WORKSHEET_ANALYSIS, null, 2)}\n\`\`\``
    )

    const chain = createAnalyzeWorksheetChain(mockAskLLM)
    const result = await chain.invoke({
      image: sampleBlob,
      removeHandwriting: true,
    })

    expect(mockAskLLM).toHaveBeenCalledTimes(1)
    const [passedMessages, passedSchema] = mockAskLLM.mock.calls[0]
    expect(passedSchema).toEqual(WORKSHEET_ANALYSIS_JSON_SCHEMA)
    expect(Array.isArray(passedMessages)).toBe(true)
    expect(passedMessages[0].role).toBe('user')
    expect(passedMessages[0].content[0].type).toBe('text')
    expect(passedMessages[0].content[0].value).toContain('Ignore and exclude any handwritten answers')
    expect(passedMessages[0].content[1]).toEqual({
      type: 'image',
      value: sampleBlob,
    })

    expect(result.identified_concepts[0].main_topic).toBe('Fractions')
    expect(result.example_questions).toContain('a. 4/8 =')
    expect(result.example_questions).toContain('b. 6/15 =')
  })

  it('self-corrects and retries when initial worksheet analysis output violates the JSON Schema', async () => {
    const sampleBlob = new Blob(['fake-image'], { type: 'image/jpeg' })

    const mockAskLLM = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ wrong_field: true }))
      .mockResolvedValueOnce(JSON.stringify(SAMPLE_WORKSHEET_ANALYSIS))

    const chain = createAnalyzeWorksheetChain(mockAskLLM)
    const result = await chain.invoke({ image: sampleBlob, removeHandwriting: false })

    expect(mockAskLLM).toHaveBeenCalledTimes(2)
    expect(result.worksheet_directions).toBe('Simplify each fraction.')
  })

  it('generates fraction practice problems and answers from the worksheet analysis', async () => {
    const generatedPayload = {
      problems: [
        { question: 'a. 2/6 =', answer: '1/3' },
        { question: 'b. 8/20 =', answer: '2/5' },
        { question: 'c. 10/15 =', answer: '2/3' },
      ],
      answer_bank_present: false,
    }

    const mockAskLLM = vi.fn().mockResolvedValue(JSON.stringify(generatedPayload))
    const chain = createGenerateProblemsChain(mockAskLLM)

    const result = await chain.invoke({
      worksheetAnalysis: SAMPLE_WORKSHEET_ANALYSIS,
      numberOfProblems: 3,
      customPrompt: 'Use denominators under 25',
    })

    expect(mockAskLLM).toHaveBeenCalledTimes(1)
    const [promptStr, schema] = mockAskLLM.mock.calls[0]
    expect(schema).toEqual(GENERATED_PROBLEMS_JSON_SCHEMA)
    expect(promptStr).toContain('Use denominators under 25')
    expect(result.problems).toHaveLength(3)
    expect(result.problems[0]).toEqual({ question: 'a. 2/6 =', answer: '1/3' })
    expect(result.answer_bank_present).toBe(false)
    expect(result.answerBank).toBeUndefined()
  })

  it('populates a shuffled answerBank when answer_bank_present is true', async () => {
    const analysisWithBank: WorksheetAnalysis = {
      ...SAMPLE_WORKSHEET_ANALYSIS,
      answer_bank_present: true,
    }

    const generatedPayload = {
      problems: [
        { question: 'Simplify 3/9', answer: '1/3' },
        { question: 'Simplify 4/10', answer: '2/5' },
      ],
      answer_bank_present: true,
    }

    const mockAskLLM = vi.fn().mockResolvedValue(JSON.stringify(generatedPayload))
    const chain = createGenerateProblemsChain(mockAskLLM)

    const result = await chain.invoke({
      worksheetAnalysis: analysisWithBank,
      numberOfProblems: 2,
    })

    expect(result.answer_bank_present).toBe(true)
    expect(result.answerBank).toBeDefined()
    expect(result.answerBank?.sort()).toEqual(['1/3', '2/5'])
  })

  it('routes analyze and generate requests via createWorksheetAgentRouter()', async () => {
    const router = createWorksheetAgentRouter()
    const mockAskLLM = vi.fn().mockResolvedValue(JSON.stringify(SAMPLE_WORKSHEET_ANALYSIS))

    const responseJson = await router.invoke({
      userPrompt: {
        action: 'analyze',
        image: new Blob(['img'], { type: 'image/jpeg' }),
        removeHandwriting: false,
      },
      sessionId: 'test_session',
      signal: new AbortController().signal,
      memory: null,
      askLLM: mockAskLLM,
      logToMain: vi.fn(),
    })

    const parsed = JSON.parse(responseJson) as WorksheetAnalysis
    expect(parsed.worksheet_directions).toBe('Simplify each fraction.')
  })
})
