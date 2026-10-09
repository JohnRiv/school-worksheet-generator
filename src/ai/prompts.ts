import type { WorksheetAnalysis } from './schemas'

export const MAX_CUSTOM_PROMPT_LENGTH = 1024

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts|rules|directions)/gi,
  /disregard\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts|rules|directions)/gi,
  /forget\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts|rules|directions)/gi,
  /system\s*prompt\s*:/gi,
  /you\s+are\s+now\s+a/gi,
]

/**
 * Sanitizes user-supplied customization instructions per spec:
 * 1. Validates string input & strips control characters.
 * 2. Neutralizes known prompt-injection override phrases.
 * 3. Escapes code-fence delimiters and truncates to 1024 characters.
 */
export function sanitizeCustomPrompt(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') {
    return ''
  }

  let sanitized = rawInput
    // Remove ASCII control characters except standard newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[filtered]')
  }

  // Prevent breaking out of markdown or JSON blocks
  sanitized = sanitized.replace(/```/g, "'''")

  if (sanitized.length > MAX_CUSTOM_PROMPT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_CUSTOM_PROMPT_LENGTH).trim()
  }

  return sanitized
}

/**
 * Builds the Phase 1 worksheet image analysis prompt for the Chrome Prompt API.
 */
export function buildAnalyzeWorksheetPrompt(removeHandwriting: boolean): string {
  const handwritingInstruction = removeHandwriting
    ? 'IMPORTANT: This worksheet contains student handwriting, written answers, or marks. Ignore and exclude any handwritten answers or marks and analyze only the original printed worksheet questions and directions.'
    : 'Analyze the printed questions, concepts, and directions visible on this worksheet.'

  return `You are an expert educational AI assistant that analyzes photos of school worksheets.
Your goal is to extract structured information from the attached worksheet image so that new practice problems can be generated.

${handwritingInstruction}

Carefully inspect the worksheet image and output a JSON object strictly matching the following structure:
{
  "identified_concepts": [
    {
      "subject": "string (e.g., Math, Grammar, Science)",
      "main_topic": "string (e.g., Fractions, Multiplication, Pronouns)",
      "specific_concept": "string (e.g., Simplifying fractions to lowest terms, 2-digit multiplication)"
    }
  ],
  "identified_question_formats": [
    "string (e.g., Simplify the fraction, Fill-in-the-blank, Short explanation)"
  ],
  "example_questions": [
    "string (Extract actual example questions verbatim from the worksheet, e.g., '4/8 =', '6/15 =')"
  ],
  "answer_bank_present": false,
  "worksheet_directions": "string (General directions printed on the worksheet, e.g., 'Simplify each fraction.', or empty string if none)",
  "additional_notes_for_generation": ""
}

Ensure "additional_notes_for_generation" is initialized to an empty string "".
Respond ONLY with valid JSON.`
}

/**
 * Builds the Phase 2 practice problem generation prompt for the Chrome Prompt API.
 */
export function buildGenerateProblemsPrompt(
  analysis: WorksheetAnalysis,
  numberOfProblems: number
): string {
  const customNotesSection =
    analysis.additional_notes_for_generation && analysis.additional_notes_for_generation.trim()
      ? `\nAdditional Customization Notes from User:\n"${analysis.additional_notes_for_generation.trim()}"\nMake sure the generated problems follow these notes while staying true to the worksheet subject.`
      : ''

  return `You are an expert elementary and middle school educator.
Generate ${numberOfProblems} new practice problems based on the following school worksheet analysis JSON.

Worksheet Analysis JSON:
${JSON.stringify(analysis, null, 2)}
${customNotesSection}

Requirements:
1. Create exactly ${numberOfProblems} new practice problems that test the same concepts (${analysis.identified_concepts.map((c) => `${c.subject}: ${c.main_topic} - ${c.specific_concept}`).join('; ')}) and follow the same question formats (${analysis.identified_question_formats.join(', ')}).
2. Do NOT copy the exact example questions from the original worksheet—create fresh numbers/examples at the same difficulty level.
3. Provide the accurate, simplified answer for each generated problem.
4. Set "answer_bank_present" to ${Boolean(analysis.answer_bank_present)}.

Respond ONLY with valid JSON matching this structure:
{
  "problems": [
    {
      "question": "Newly generated question text here",
      "answer": "Correct solution/answer here"
    }
  ],
  "answer_bank_present": ${Boolean(analysis.answer_bank_present)}
}`
}

/**
 * Returns a shuffled copy of the answers array for the Answer Bank display.
 */
export function shuffleAnswerBank(
  answers: string[],
  randomFn: () => number = Math.random
): string[] {
  const copy = [...answers]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}
