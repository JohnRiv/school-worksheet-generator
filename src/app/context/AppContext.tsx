
"use client";

import type { AnalyzeWorksheetOutput } from '@/ai/flows/analyze-worksheet';
// The output from problem generation flows will now be more structured.
// Define a common type or import the specific output types if they differ significantly.
// For now, we'll use a more specific structure based on GeneratePracticeProblemsOutput.

interface Problem {
  question: string;
  answer: string;
}

export interface GeneratedProblemsState {
  problems: Problem[];
  answer_bank_present: boolean;
  answerBank?: string[];
}

interface AppState {
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  worksheetAnalysis: AnalyzeWorksheetOutput | null;
  setWorksheetAnalysis: (analysis: AnalyzeWorksheetOutput | null) => void;
  generatedProblems: GeneratedProblemsState | null; 
  setGeneratedProblems: (problems: GeneratedProblemsState | null) => void;
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
  const [generatedProblems, setGeneratedProblems] = React.useState<GeneratedProblemsState | null>(null);
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

import React from 'react';
