"use server";

import { analyzeWorksheet as analyzeWorksheetFlow, type AnalyzeWorksheetInput } from '@/ai/flows/analyze-worksheet';
import { generatePracticeProblems as generatePracticeProblemsFlow, type GeneratePracticeProblemsInput, type GeneratePracticeProblemsOutput } from '@/ai/flows/generate-practice-problems';
// Removed the import for customizeProblemGenerationFlow as it will no longer be a separate flow

function checkAccess(accessCode?: string) {
  const secret = process.env.APP_SECRET_PASSPHRASE;
  if (secret) {
    if (accessCode !== secret) {
      throw new Error("Invalid access code. Please enter the correct access code to use the AI functionality.");
    }
  } else {
    throw new Error("Access code not configured. Please contact the administrator.");
  }
}

export async function handleAnalyzeWorksheet(photoDataUri: string, removeHandwriting: boolean, accessCode?: string) {
  try {
    checkAccess(accessCode);
    const input: AnalyzeWorksheetInput = { photoDataUri, removeHandwriting };
    const result = await analyzeWorksheetFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error analyzing worksheet:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during analysis." };
  }
}

// Internal helper function for problem generation
async function generateProblemsInternal(worksheetAnalysisJson: string, numberOfProblems: number, accessCode?: string): Promise<{ success: true; data: GeneratePracticeProblemsOutput } | { success: false; error: string }> {
  try {
    checkAccess(accessCode);
    const input: GeneratePracticeProblemsInput = { 
      worksheetAnalysis: worksheetAnalysisJson, 
      numberOfProblems 
    };
    const result = await generatePracticeProblemsFlow(input);
    // Assuming the flow's output directly matches the desired success data structure
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating problems:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during problem generation." };
  }
}
export async function handleGenerateProblems(worksheetAnalysisJson: string, numberOfProblems: number, accessCode?: string) {
  // Directly call the internal helper function
 return generateProblemsInternal(worksheetAnalysisJson, numberOfProblems, accessCode);
}
export async function handleCustomizeProblems(worksheetAnalysisJson: string, userPrompt: string, numberOfProblems: number, accessCode?: string) {
  try {
    const worksheetAnalysis = JSON.parse(worksheetAnalysisJson);
    // Append the user prompt to additional_notes_for_generation
    if (worksheetAnalysis.additional_notes_for_generation) {
      worksheetAnalysis.additional_notes_for_generation += ". " + userPrompt;
    } else {
      worksheetAnalysis.additional_notes_for_generation = userPrompt;
    }
    const modifiedWorksheetAnalysisJson = JSON.stringify(worksheetAnalysis);
    // Call the internal helper function with the modified analysis
    const result = await generateProblemsInternal(modifiedWorksheetAnalysisJson, numberOfProblems, accessCode);
    // The internal function already returns the correct success/error format
    return result;
  } catch (error) {
    // Handle errors specific to parsing or modifying the JSON
    console.error("Error customizing problems:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during customized problem generation." };
  }
}
