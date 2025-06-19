"use server";

import { analyzeWorksheet as analyzeWorksheetFlow, type AnalyzeWorksheetInput } from '@/ai/flows/analyze-worksheet';
import { generatePracticeProblems as generatePracticeProblemsFlow, type GeneratePracticeProblemsInput } from '@/ai/flows/generate-practice-problems';
import { customizeProblemGeneration as customizeProblemGenerationFlow, type CustomizeProblemGenerationInput } from '@/ai/flows/customize-problem-generation';

export async function handleAnalyzeWorksheet(photoDataUri: string, removeHandwriting: boolean) {
  try {
    const input: AnalyzeWorksheetInput = { photoDataUri, removeHandwriting };
    const result = await analyzeWorksheetFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error analyzing worksheet:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during analysis." };
  }
}

export async function handleGenerateProblems(worksheetAnalysisJson: string, numberOfProblems: number) {
  try {
    const input: GeneratePracticeProblemsInput = { 
      worksheetAnalysis: worksheetAnalysisJson, 
      numberOfProblems 
    };
    const result = await generatePracticeProblemsFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating problems:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during problem generation." };
  }
}

export async function handleCustomizeProblems(worksheetAnalysisJson: string, userPrompt: string, numberOfProblems: number) {
  try {
    const input: CustomizeProblemGenerationInput = { 
      worksheetAnalysis: worksheetAnalysisJson, 
      userPrompt, 
      numberOfProblems 
    };
    const result = await customizeProblemGenerationFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error customizing problems:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during customized problem generation." };
  }
}
