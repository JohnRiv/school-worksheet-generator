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

const GeneratePracticeProblemsOutputSchema = z.object({
  problems: z
    .array(z.string())
    .describe('An array of generated practice problems.'),
  answerBank: z
    .array(z.string())
    .optional()
    .describe('An optional array of answers to the practice problems.'),
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

Worksheet Analysis:
{{worksheetAnalysis}}

Number of Problems to Generate: {{numberOfProblems}}

{% if customPrompt %}
Custom Prompt: {{customPrompt}}
{% endif %}

Follow the format and concepts of the original worksheet.

Output the problems as a JSON array of strings. If the worksheet has an answer bank, generate an answerBank JSON array of strings in random order.`,
});

const generatePracticeProblemsFlow = ai.defineFlow(
  {
    name: 'generatePracticeProblemsFlow',
    inputSchema: GeneratePracticeProblemsInputSchema,
    outputSchema: GeneratePracticeProblemsOutputSchema,
  },
  async input => {
    try {
      // Parse the worksheetAnalysis string to ensure it's valid JSON
      JSON.parse(input.worksheetAnalysis);
    } catch (e) {
      throw new Error(
        'Invalid JSON format for worksheetAnalysis: ' + (e as Error).message
      );
    }
    const {output} = await prompt(input);
    return output!;
  }
);
