import { useState } from 'react'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { AppContextProvider, useAppContext, type AIClientInterface } from '@/context/AppContext'
import MainLayoutContent from '@/components/MainLayoutContent'
import { AIStatusBanner } from '@/components/AIStatusBanner'
import { FileUpload } from '@/components/FileUpload'
import { WorksheetAnalysisDisplay } from '@/components/WorksheetAnalysisDisplay'
import { ProblemGenerationControls } from '@/components/ProblemGenerationControls'
import { GeneratedProblemsView } from '@/components/GeneratedProblemsView'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

function WorksheetAppContent() {
  const { toast } = useToast()
  const {
    uploadedFile,
    setUploadedFile,
    setUploadedImage,
    worksheetAnalysis,
    setWorksheetAnalysis,
    setGeneratedProblems,
    setIsLoading,
    setLoadingMessage,
    setError,
    currentView,
    setCurrentView,
    aiClient,
  } = useAppContext()

  const [removeHandwriting, setRemoveHandwriting] = useState(false)

  const onFileSelected = (file: File | null, dataUri: string | null) => {
    setUploadedFile(file)
    setUploadedImage(dataUri)
  }

  const analyzeWorksheet = async () => {
    if (!uploadedFile) {
      toast({
        title: 'No Image Selected',
        description: 'Please upload an image of a worksheet first.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setLoadingMessage('Analyzing worksheet...')
    setError(null)

    try {
      const analysis = await aiClient.analyzeWorksheet(uploadedFile, removeHandwriting)
      setWorksheetAnalysis(analysis)
      setGeneratedProblems(null)
      toast({
        title: 'Analysis Complete',
        description: 'Worksheet analyzed locally with Chrome Prompt API.',
      })
      setCurrentView('generate')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
      setError(errorMessage)
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <div className="w-full space-y-6">
      <AIStatusBanner />

      {currentView === 'upload' || !worksheetAnalysis ? (
        <div className="flex flex-col items-center w-full space-y-8">
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
              <Wand2 className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-3xl font-headline">Welcome!</CardTitle>
              <CardDescription className="text-lg">
                Upload a photo of your child&apos;s school worksheet and let Chrome&apos;s on-device AI
                generate additional practice problems and answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload onFileChange={onFileSelected} disabled={false} />
              <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg">
                <Checkbox
                  id="removeHandwriting"
                  checked={removeHandwriting}
                  onCheckedChange={(checked) => setRemoveHandwriting(Boolean(checked))}
                  aria-label="Remove handwriting from image"
                />
                <Label
                  htmlFor="removeHandwriting"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This worksheet has handwriting or marks on it (ignore student writing)
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                id="analyze-worksheet-btn"
                onClick={analyzeWorksheet}
                disabled={!uploadedFile}
                className="w-full text-lg py-6"
                size="lg"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                Analyze Worksheet
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-8 w-full">
          <Button
            id="back-to-upload-btn"
            variant="outline"
            onClick={() => setCurrentView('upload')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
          </Button>

          <WorksheetAnalysisDisplay analysis={worksheetAnalysis} />

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Generate Practice Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <ProblemGenerationControls />
            </CardContent>
          </Card>

          <GeneratedProblemsView />
        </div>
      )}
    </div>
  )
}

export interface AppProps {
  customAIClient?: AIClientInterface
}

export default function App({ customAIClient }: AppProps = {}) {
  return (
    <AppContextProvider customAIClient={customAIClient}>
      <MainLayoutContent>
        <WorksheetAppContent />
      </MainLayoutContent>
      <Toaster />
    </AppContextProvider>
  )
}
