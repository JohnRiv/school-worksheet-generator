import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CallbackEvents } from '@gilfink/prompt-chain'
import type { NormalizedAvailability } from '@/ai/chrome-ai-plugin'
import type { GeneratedProblemsResult, WorksheetAnalysis } from '@/ai/schemas'
import { WorksheetAIClient, worksheetClient } from '@/ai/worksheet-client'

export type AppView = 'upload' | 'generate'

export interface AIClientInterface {
  checkAvailability: () => Promise<NormalizedAvailability>
  init: () => Promise<void>
  analyzeWorksheet: (
    image: Blob,
    removeHandwriting: boolean,
    signal?: AbortSignal
  ) => Promise<WorksheetAnalysis>
  generatePracticeProblems: (
    worksheetAnalysis: WorksheetAnalysis,
    numberOfProblems: number,
    customPrompt?: string,
    signal?: AbortSignal
  ) => Promise<GeneratedProblemsResult>
}

interface AppState {
  uploadedImage: string | null
  setUploadedImage: (image: string | null) => void
  uploadedFile: File | Blob | null
  setUploadedFile: (file: File | Blob | null) => void
  worksheetAnalysis: WorksheetAnalysis | null
  setWorksheetAnalysis: (analysis: WorksheetAnalysis | null) => void
  generatedProblems: GeneratedProblemsResult | null
  setGeneratedProblems: (problems: GeneratedProblemsResult | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void
  error: string | null
  setError: (error: string | null) => void
  currentView: AppView
  setCurrentView: (view: AppView) => void
  aiAvailability: NormalizedAvailability | 'checking'
  refreshAIAvailability: () => Promise<NormalizedAvailability>
  downloadProgress: number | null
  aiClient: AIClientInterface
}

const AppContext = createContext<AppState | undefined>(undefined)

export interface AppContextProviderProps {
  children: React.ReactNode
  customAIClient?: AIClientInterface
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
  customAIClient,
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | Blob | null>(null)
  const [worksheetAnalysis, setWorksheetAnalysis] = useState<WorksheetAnalysis | null>(null)
  const [generatedProblems, setGeneratedProblems] = useState<GeneratedProblemsResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<AppView>('upload')
  const [aiAvailability, setAiAvailability] = useState<NormalizedAvailability | 'checking'>('checking')
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  const aiClient = useMemo<AIClientInterface>(() => {
    if (customAIClient) return customAIClient
    return new WorksheetAIClient({
      onDownloadProgress: ({ percent }) => {
        setDownloadProgress(percent)
      },
    })
  }, [customAIClient])

  const refreshAIAvailability = async (): Promise<NormalizedAvailability> => {
    const status = await aiClient.checkAvailability()
    setAiAvailability(status)
    return status
  }

  useEffect(() => {
    void refreshAIAvailability()
  }, [aiClient])

  useEffect(() => {
    if (typeof window === 'undefined' || !CallbackEvents?.eventDispatch) return
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.event === CallbackEvents.modelDownloadProgress && typeof detail.percent === 'number') {
        setDownloadProgress(detail.percent)
      }
    }
    window.addEventListener(CallbackEvents.eventDispatch, handleEvent)
    return () => window.removeEventListener(CallbackEvents.eventDispatch, handleEvent)
  }, [])

  return (
    <AppContext.Provider
      value={{
        uploadedImage,
        setUploadedImage,
        uploadedFile,
        setUploadedFile,
        worksheetAnalysis,
        setWorksheetAnalysis,
        generatedProblems,
        setGeneratedProblems,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
        error,
        setError,
        currentView,
        setCurrentView,
        aiAvailability,
        refreshAIAvailability,
        downloadProgress,
        aiClient: customAIClient || aiClient || worksheetClient,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = (): AppState => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider')
  }
  return context
}
