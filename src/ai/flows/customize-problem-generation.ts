
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
    .describe("The AI analysis of the worksheet including identified concepts, question formats, and example questions (as a JSON string)."),
  userPrompt: z.string().describe('A prompt from the student to customize the problem generation.'),
  numberOfProblems: z.number().describe('The number of practice problems to generate.'),
});
export type CustomizeProblemGenerationInput = z.infer<
  typeof CustomizeProblemGenerationInputSchema
>;

const ProblemSchema = z.object({
  question: z.string().describe("The text of the generated question."),
  answer: z.string().describe("The answer to the generated question.")
});

const CustomizeProblemGenerationOutputSchema = z.object({
  customizedProblems: z.array(ProblemSchema).describe('The generated practice problems, each with a question and an answer.'),
  answer_bank_present: z.boolean().describe("Indicates if the original worksheet had an answer bank. This is passed through from the analysis phase."),
  answerBank: z.array(z.string()).optional().describe('An optional answer bank for the problems. This should ONLY be present if answer_bank_present from the input analysis was true.'),
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

  Given the following worksheet analysis (JSON string):
  {{{worksheetAnalysis}}}

  And the following customization prompt from the student:
  {{userPrompt}}

  Generate {{numberOfProblems}} practice problems that adhere to both the worksheet analysis and the student's customization prompt.
  Parse the 'worksheetAnalysis' JSON. It contains a boolean field 'answer_bank_present'.

  Return the generated problems and answer bank in the following JSON format:
  {
    "customizedProblems": [
      {
        "question": "Newly generated question text here?",
        "answer": "Solution/Answer for question here?"
      }
    ],
    "answer_bank_present": <boolean value from the input worksheetAnalysis.answer_bank_present field>,
    "answerBank": ["array of strings"]
  }
  The "answerBank" field is OPTIONAL. Include it ONLY IF the input worksheetAnalysis.answer_bank_present was true. If included, it should contain ONLY the 'answer' strings from the 'customizedProblems' array you generated above, in a random order. If worksheetAnalysis.answer_bank_present was false, do NOT include the "answerBank" field in your output.
  `,
});

const customizeProblemGenerationFlow = ai.defineFlow(
  {
    name: 'customizeProblemGenerationFlow',
    inputSchema: CustomizeProblemGenerationInputSchema,
    outputSchema: CustomizeProblemGenerationOutputSchema,
  },
  async input => {
     try {
      JSON.parse(input.worksheetAnalysis);
    } catch (e) {
      throw new Error(
        'Invalid JSON format for worksheetAnalysis in customizeProblemGenerationFlow: ' + (e as Error).message
      );
    }
    const {output} = await prompt(input);
    return output!;
  }
);

