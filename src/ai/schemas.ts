import type { JSONSchema } from '@gilfink/prompt-chain'

export interface IdentifiedConcept {
  subject: string
  main_topic: string
  specific_concept: string
}

export interface WorksheetAnalysis {
  identified_concepts: IdentifiedConcept[]
  identified_question_formats: string[]
  example_questions: string[]
  answer_bank_present: boolean
  worksheet_directions?: string
  additional_notes_for_generation: string
}

export interface PracticeProblem {
  question: string
  answer: string
}

export interface GeneratedProblemsResult {
  problems: PracticeProblem[]
  answer_bank_present: boolean
  answerBank?: string[]
}

/**
 * JSON Schema passed to Chrome Prompt API `responseConstraint` and
 * `@gilfink/prompt-chain`'s `StructuredOutputRunnable` for Phase 1 (Worksheet Analysis).
 */
export const WORKSHEET_ANALYSIS_JSON_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    identified_concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          main_topic: { type: 'string' },
          specific_concept: { type: 'string' },
        },
        required: ['subject', 'main_topic', 'specific_concept'],
      },
    },
    identified_question_formats: {
      type: 'array',
      items: { type: 'string' },
    },
    example_questions: {
      type: 'array',
      items: { type: 'string' },
    },
    answer_bank_present: {
      type: 'boolean',
    },
    worksheet_directions: {
      type: 'string',
    },
    additional_notes_for_generation: {
      type: 'string',
    },
  },
  required: [
    'identified_concepts',
    'identified_question_formats',
    'example_questions',
    'answer_bank_present',
    'additional_notes_for_generation',
  ],
}

/**
 * JSON Schema passed to Chrome Prompt API `responseConstraint` and
 * `@gilfink/prompt-chain`'s `StructuredOutputRunnable` for Phase 2 (Problem Generation).
 */
export const GENERATED_PROBLEMS_JSON_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
      },
    },
    answer_bank_present: {
      type: 'boolean',
    },
  },
  required: ['problems', 'answer_bank_present'],
}
