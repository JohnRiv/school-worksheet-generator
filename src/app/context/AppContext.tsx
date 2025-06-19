
"use client";

import type { AnalyzeWorksheetOutput } from '@/ai/flows/analyze-worksheet';
// Ensure GeneratePracticeProblemsOutput and CustomizeProblemGenerationOutput are also correctly typed if they change.
// For now, assuming they output { problems: string[], answerBank?: string[] } or similar.
import type { GeneratePracticeProblemsOutput } from '@/ai/flows/generate-practice-problems';


interface AppState {
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  worksheetAnalysis: AnalyzeWorksheetOutput | null; // This will now be the structured JSON
  setWorksheetAnalysis: (analysis: AnalyzeWorksheetOutput | null) => void;
  generatedProblems: GeneratePracticeProblemsOutput | null; // Assuming this type is okay for now
  setGeneratedProblems: (problems: GeneratePracticeProblemsOutput | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const AppContext = React.createContext<AppState | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [worksheetAnalysis, setWorksheetAnalysis] = React.useState<AnalyzeWorksheetOutput | null>(null);
  const [generatedProblems, setGeneratedProblems] = React.useState<GeneratePracticeProblemsOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  return (
    <AppContext.Provider value={{
      uploadedImage, setUploadedImage,
      worksheetAnalysis, setWorksheetAnalysis,
      generatedProblems, setGeneratedProblems,
      isLoading, setIsLoading,
      loadingMessage, setLoadingMessage,
      error, setError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppState => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// Need to import React for createContext and useContext
import React from 'react';
