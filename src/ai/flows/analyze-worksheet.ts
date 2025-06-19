
'use server';
/**
 * @fileOverview AI agent for analyzing a worksheet image to identify concepts, question formats, and directions.
 *
 * - analyzeWorksheet - A function that handles the worksheet analysis process.
 * - AnalyzeWorksheetInput - The input type for the analyzeWorksheet function.
 * - AnalyzeWorksheetOutput - The return type for the analyzeWorksheet function.
 */

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

const IdentifiedConceptSchema = z.object({
  subject: z.string().describe('The subject of the concept (e.g., "Math", "Grammar").'),
  main_topic: z.string().describe('The main topic of the concept (e.g., "Multiplication", "Pronouns").'),
  specific_concept: z.string().describe('The specific concept identified (e.g., "2-digit by 2-digit multiplication", "Reflexive Pronouns").'),
});

const AnalyzeWorksheetOutputSchema = z.object({
  identified_concepts: z.array(IdentifiedConceptSchema).describe('A list of concepts covered in the worksheet.'),
  identified_question_formats: z.array(z.string()).describe('A list of question formats used in the worksheet (e.g., "fill-in-the-blank", "multiple choice (A, B, C, D)", "underline the correct word").'),
  example_questions: z.array(z.string()).describe('Up to 100 example questions extracted directly from the worksheet. This is crucial for guiding generation.'),
  answer_bank_present: z.boolean().describe('Boolean: true if the original worksheet has an answer bank, false otherwise.'),
  worksheet_directions: z.string().optional().describe('Any general directions found on the worksheet. Omit or leave empty if none are found.'),
  additional_notes_for_generation: z.string().default("").describe('Optional string: initially empty, can be appended by user input for re-analysis or customization. Defaults to an empty string.'),
});
export type AnalyzeWorksheetOutput = z.infer<typeof AnalyzeWorksheetOutputSchema>;

export async function analyzeWorksheet(input: AnalyzeWorksheetInput): Promise<AnalyzeWorksheetOutput> {
  return analyzeWorksheetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWorksheetPrompt',
  input: {schema: AnalyzeWorksheetInputSchema},
  output: {schema: AnalyzeWorksheetOutputSchema},
  prompt: `You are an AI assistant that analyzes a worksheet image.
Your goal is to extract structured information to help generate new practice problems.

You will be provided with a photo of the worksheet.
Worksheet Image: {{media url=photoDataUri}}
{{#if removeHandwriting}}
Attempt to remove any handwriting from the image before analysis.
{{/if}}

Analyze the worksheet and output a JSON object strictly adhering to the following structure:
{
  "identified_concepts": [
    {
      "subject": "string", // e.g., "Math", "Grammar", "Science"
      "main_topic": "string", // e.g., "Addition", "Nouns", "Photosynthesis"
      "specific_concept": "string" // e.g., "Adding 2-digit numbers with carrying", "Proper Nouns", "Light-dependent reactions"
    }
    // Include more concept objects if multiple distinct concepts are present.
  ],
  "identified_question_formats": [
    "string" // e.g., "Solve and show work", "Fill-in-the-blank", "Multiple choice (A, B, C, D)", "Underline the correct word"
    // Include all identified question formats.
  ],
  "example_questions": [
    "string" // Provide up to 100 actual example questions verbatim from the worksheet. These are critical.
  ],
  "answer_bank_present": boolean, // true if an answer bank is visible on the worksheet, false otherwise.
  "worksheet_directions": "string", // Extract any general directions found on the worksheet. If none, this can be an empty string or omitted.
  "additional_notes_for_generation": "string" // Initialize as an empty string "". This field can be appended later with user notes.
}

Ensure "additional_notes_for_generation" is an empty string in your initial analysis.
Focus on accuracy and completeness based on the provided image.
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
    // Ensure additional_notes_for_generation is present, defaulting to empty string if AI omits it
    // Zod default should handle this, but as a safeguard:
    if (output && typeof output.additional_notes_for_generation === 'undefined') {
      output.additional_notes_for_generation = "";
    }
    return output!;
  }
);

