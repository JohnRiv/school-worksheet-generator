'use server';

/**
 * @fileOverview Flow for customizing problem generation with a user-provided prompt.
 *
 * - customizeProblemGeneration -  A function that allows students to customize problem generation using a prompt for desired alterations.
 * - CustomizeProblemGenerationInput - The input type for the customizeProblemGeneration function.
 * - CustomizeProblemGenerationOutput - The return type for the customizeProblemGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeProblemGenerationInputSchema = z.object({
  worksheetAnalysis: z
    .string()
    .describe("The AI analysis of the worksheet including identified concepts, question formats, and example questions."),
  userPrompt: z.string().describe('A prompt from the student to customize the problem generation.'),
  numberOfProblems: z.number().describe('The number of practice problems to generate.'),
});
export type CustomizeProblemGenerationInput = z.infer<
  typeof CustomizeProblemGenerationInputSchema
>;

const CustomizeProblemGenerationOutputSchema = z.object({
  customizedProblems: z.array(z.string()).describe('The generated practice problems.'),
  answerBank: z.array(z.string()).optional().describe('An optional answer bank for the problems.'),
});
export type CustomizeProblemGenerationOutput = z.infer<
  typeof CustomizeProblemGenerationOutputSchema
>;

export async function customizeProblemGeneration(
  input: CustomizeProblemGenerationInput
): Promise<CustomizeProblemGenerationOutput> {
  return customizeProblemGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeProblemGenerationPrompt',
  input: {schema: CustomizeProblemGenerationInputSchema},
  output: {schema: CustomizeProblemGenerationOutputSchema},
  prompt: `You are an expert at generating practice problems based on worksheet analysis and student customization.

  Given the following worksheet analysis:
  {{worksheetAnalysis}}

  And the following customization prompt from the student:
  {{userPrompt}}

  Generate {{numberOfProblems}} practice problems that adhere to both the worksheet analysis and the student's customization prompt.

  If the worksheet analysis indicates the presence of an answer bank, generate a randomized answer bank.

  Return the generated problems and answer bank in the following JSON format:
  {
    "customizedProblems": ["problem 1", "problem 2", ...],
    "answerBank": ["answer 1", "answer 2", ...]
  }
  `,
});

const customizeProblemGenerationFlow = ai.defineFlow(
  {
    name: 'customizeProblemGenerationFlow',
    inputSchema: CustomizeProblemGenerationInputSchema,
    outputSchema: CustomizeProblemGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
