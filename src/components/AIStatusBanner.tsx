import { useState } from 'react'
import { AlertCircle, Download, Sparkles } from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function AIStatusBanner() {
  const { aiAvailability, refreshAIAvailability, downloadProgress, aiClient } = useAppContext()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  if (aiAvailability === 'readily' || aiAvailability === 'checking') {
    return null
  }

  const handleDownloadModel = async () => {
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await aiClient.init()
      await refreshAIAvailability()
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to initialize on-device model.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (aiAvailability === 'after-download') {
    return (
      <Alert className="mb-6 border-amber-500/50 bg-card shadow-md">
        <Download className="h-5 w-5 text-amber-600" />
        <AlertTitle className="font-headline text-lg">
          On-Device Gemini Nano Model Ready to Download
        </AlertTitle>
        <AlertDescription className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            Chrome&apos;s Prompt API is supported in your browser, but the on-device Gemini Nano model
            needs a one-time download before analyzing worksheets.
          </p>
          {isDownloading && (
            <div className="space-y-1">
              <Progress value={downloadProgress ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Downloading model... {downloadProgress !== null ? `${downloadProgress}%` : ''}
              </p>
            </div>
          )}
          {downloadError && <p className="text-xs text-destructive font-medium">{downloadError}</p>}
          <Button
            id="download-ai-model-btn"
            size="sm"
            onClick={handleDownloadModel}
            disabled={isDownloading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading Model...' : 'Initialize & Download Model'}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="mb-6 bg-card shadow-md">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-headline text-lg">
        Chrome Prompt API Not Detected (`window.LanguageModel`)
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-2 text-foreground">
        <p className="text-sm">
          This app runs 100% locally using Chrome&apos;s built-in <strong>Prompt API</strong> via{' '}
          <code>@gilfink/prompt-chain</code>. To enable it in Google Chrome:
        </p>
        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-1 bg-muted/40 p-3 rounded-md">
          <li>
            Open <code>chrome://flags/#optimization-guide-on-device-model</code> and set it to{' '}
            <strong>Enabled BypassPerfRequirement</strong>.
          </li>
          <li>
            Open <code>chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</code> (and{' '}
            <code>#prompt-api-for-gemini-nano</code>) and set to <strong>Enabled</strong>.
          </li>
          <li>Relaunch Chrome and check <code>chrome://on-device-internals</code>.</li>
        </ol>
      </AlertDescription>
    </Alert>
  )
}
