
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating practice problems based on the analysis of a worksheet image.
 *
 * - generatePracticeProblems - A function that takes worksheet analysis and generates practice problems.
 * - GeneratePracticeProblemsInput - The input type for the generatePracticeProblems function.
 * - GeneratePracticeProblemsOutput - The return type for the generatePracticeProblems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeProblemsInputSchema = z.object({
  worksheetAnalysis: z
    .string()
    .describe(
      'A JSON string containing the analysis of the worksheet, including concepts, question formats, and example questions.'
    ),
  numberOfProblems: z
    .number()
    .describe('The number of practice problems to generate.')
    .default(5),
  customPrompt: z
    .string()
    .optional()
    .describe(
      'Optional custom prompt to further customize the practice problem generation.'
    ),
});
export type GeneratePracticeProblemsInput = z.infer<
  typeof GeneratePracticeProblemsInputSchema
>;

const ProblemSchema = z.object({
  question: z.string().describe("The text of the generated question."),
  answer: z.string().describe("The answer to the generated question.")
});

const GeneratePracticeProblemsOutputSchema = z.object({
  problems: z
    .array(ProblemSchema)
    .describe('An array of generated practice problems, each with a question and an answer.'),
  answer_bank_present: z.boolean().describe("Indicates if the original worksheet had an answer bank. This is passed through from the analysis phase."),
  answerBank: z
    .array(z.string())
    .optional()
    .describe('An optional array of answers for the generated problems, in random order. This should ONLY be present if answer_bank_present from the input analysis was true.'),
});
export type GeneratePracticeProblemsOutput = z.infer<
  typeof GeneratePracticeProblemsOutputSchema
>;

export async function generatePracticeProblems(
  input: GeneratePracticeProblemsInput
): Promise<GeneratePracticeProblemsOutput> {
  return generatePracticeProblemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePracticeProblemsPrompt',
  input: {schema: GeneratePracticeProblemsInputSchema},
  output: {schema: GeneratePracticeProblemsOutputSchema},
  prompt: `You are an expert educator. Generate practice problems based on the following worksheet analysis.

Worksheet Analysis (JSON string):
{{{worksheetAnalysis}}}

Number of Problems to Generate: {{numberOfProblems}}

{{#if customPrompt}}
Custom Prompt: {{customPrompt}}
{{/if}}

Follow the format and concepts of the original worksheet.
Parse the 'worksheetAnalysis' JSON. It contains a boolean field 'answer_bank_present'.

Your output MUST be a JSON object with the following structure:
{
  "problems": [
    {
      "question": "Newly generated question text here?",
      "answer": "Solution/Answer for question here?"
    }
  ],
  "answer_bank_present": <boolean value from the input worksheetAnalysis.answer_bank_present field>,
  "answerBank": ["array of strings"] 
}
The "answerBank" field is OPTIONAL. Include it ONLY IF the input worksheetAnalysis.answer_bank_present was true. If included, it should contain ONLY the 'answer' strings from the 'problems' array you generated above, in a random order. If worksheetAnalysis.answer_bank_present was false, do NOT include the "answerBank" field in your output.

Ensure the problems are distributed across all identified concepts as appropriate.
If 'additional_notes_for_generation' is present in the worksheetAnalysis, consider those notes.`,
});

const generatePracticeProblemsFlow = ai.defineFlow(
  {
    name: 'generatePracticeProblemsFlow',
    inputSchema: GeneratePracticeProblemsInputSchema,
    outputSchema: GeneratePracticeProblemsOutputSchema,
  },
  async input => {
    try {
      // Ensure worksheetAnalysis is valid JSON before sending to AI
      const parsedAnalysis = JSON.parse(input.worksheetAnalysis);
      if (typeof parsedAnalysis.answer_bank_present !== 'boolean') {
        // Attempt to fix or throw if critical info is missing/malformed
        // For now, we'll let the AI try to handle it, but schema validation on input is better.
      }
    } catch (e) {
      throw new Error(
        'Invalid JSON format for worksheetAnalysis: ' + (e as Error).message
      );
    }
    const {output} = await prompt(input);
    return output!;
  }
);

