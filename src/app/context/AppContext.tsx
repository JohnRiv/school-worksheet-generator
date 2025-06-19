"use client";

import type { AnalyzeWorksheetOutput } from '@/ai/flows/analyze-worksheet';
import type { GeneratePracticeProblemsOutput } from '@/ai/flows/generate-practice-problems';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  worksheetAnalysis: AnalyzeWorksheetOutput | null;
  setWorksheetAnalysis: (analysis: AnalyzeWorksheetOutput | null) => void;
  generatedProblems: GeneratePracticeProblemsOutput | null;
  setGeneratedProblems: (problems: GeneratePracticeProblemsOutput | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [worksheetAnalysis, setWorksheetAnalysis] = useState<AnalyzeWorksheetOutput | null>(null);
  const [generatedProblems, setGeneratedProblems] = useState<GeneratePracticeProblemsOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
