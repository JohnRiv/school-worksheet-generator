// 'use server';
/**
 * @fileOverview AI agent for analyzing a worksheet image to identify concepts and question formats.
 *
 * - analyzeWorksheet - A function that handles the worksheet analysis process.
 * - AnalyzeWorksheetInput - The input type for the analyzeWorksheet function.
 * - AnalyzeWorksheetOutput - The return type for the analyzeWorksheet function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWorksheetInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a worksheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  removeHandwriting: z.boolean().optional().describe('Whether to attempt to remove handwriting from the image.'),
});
export type AnalyzeWorksheetInput = z.infer<typeof AnalyzeWorksheetInputSchema>;

const AnalyzeWorksheetOutputSchema = z.object({
  concepts: z.array(z.string()).describe('A list of concepts covered in the worksheet.'),
  questionFormats: z.array(z.string()).describe('A list of question formats used in the worksheet.'),
  exampleQuestions: z.array(z.string()).describe('A few example questions from the worksheet.'),
  hasAnswerBank: z.boolean().describe('Whether the worksheet has an answer bank'),
  jsonForProblemGeneration: z
    .string()
    .describe('A JSON string that can be used to generate new practice problems.'),
});
export type AnalyzeWorksheetOutput = z.infer<typeof AnalyzeWorksheetOutputSchema>;

export async function analyzeWorksheet(input: AnalyzeWorksheetInput): Promise<AnalyzeWorksheetOutput> {
  return analyzeWorksheetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWorksheetPrompt',
  input: {schema: AnalyzeWorksheetInputSchema},
  output: {schema: AnalyzeWorksheetOutputSchema},
  prompt: `You are an AI assistant that analyzes a worksheet image to identify the concepts, question formats, and example questions.

You will be provided with a photo of the worksheet. If removeHandwriting is true, you will attempt to remove the handwriting from the image before analyzing it.

Based on the worksheet, extract the concepts covered, the question formats used, and some example questions.

Return a JSON string that can be used to generate new practice problems. This JSON should include all the information needed to generate new problems that mimic the original worksheet, including question types, constraints, and any other relevant details.

Worksheet Image: {{media url=photoDataUri}}

Output the response in JSON format.
`,
});

const analyzeWorksheetFlow = ai.defineFlow(
  {
    name: 'analyzeWorksheetFlow',
    inputSchema: AnalyzeWorksheetInputSchema,
    outputSchema: AnalyzeWorksheetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
