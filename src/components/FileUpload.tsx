import React, { useState, type ChangeEvent, type DragEvent, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadCloud, Camera, Zap, FileUp, XCircle, RefreshCcw, FileCheck2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FileUploadProps {
  onFileChange: (file: File | null, dataUri: string | null) => void
  disabled?: boolean
}

async function dataUriToImageFile(dataUri: string, filename: string): Promise<File> {
  const res = await fetch(dataUri)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [captureMode, setCaptureMode] = useState<'file' | 'camera'>('file')
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isLoadingSample, setIsLoadingSample] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const processFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUri = reader.result as string
      if (file.type.startsWith('image/')) {
        setPreview(dataUri)
      } else {
        setPreview(null)
      }
      onFileChange(file, dataUri)
    }
    reader.readAsDataURL(file)
  }

  const handleLoadSampleWorksheet = async () => {
    if (disabled || isLoadingSample) return
    setIsLoadingSample(true)
    try {
      const response = await fetch('/sample-worksheet.jpg')
      if (!response.ok) {
        throw new Error(`Could not load sample worksheet (HTTP ${response.status})`)
      }
      const blob = await response.blob()
      const sampleFile = new File([blob], 'sample-worksheet.jpg', {
        type: blob.type || 'image/jpeg',
      })
      processFile(sampleFile)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load Sample',
        description:
          error instanceof Error ? error.message : 'Could not load sample-worksheet.jpg.',
      })
    } finally {
      setIsLoadingSample(false)
    }
  }

  const handleFileSelectedOnInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    } else {
      setPreview(null)
      setFileName(null)
      onFileChange(null, null)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleTakePhotoClick = () => {
    if (disabled) return
    setCaptureMode('camera')
    setPreview(null)
    setFileName(null)
  }

  const handleSwitchToFileUpload = () => {
    setCaptureMode('file')
  }

  const handleCaptureImage = async () => {
    if (disabled || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUri = canvas.toDataURL('image/png')
      const imageName = `capture-${Date.now()}.png`
      try {
        const imageFile = await dataUriToImageFile(dataUri, imageName)
        processFile(imageFile)
      } catch (error) {
        console.error('Error converting data URI to file:', error)
        toast({
          variant: 'destructive',
          title: 'Capture Failed',
          description: 'Could not process the captured image.',
        })
      }
    }
    setCaptureMode('file')
  }

  const handleSwitchCamera = () => {
    if (devices.length < 2) return
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId)
    const nextIndex = (currentIndex + 1) % devices.length
    setSelectedDeviceId(devices[nextIndex].deviceId)
  }

  useEffect(() => {
    if (captureMode === 'camera' && !disabled) {
      setHasCameraPermission(null)

      const getCameraStream = async () => {
        try {
          if (devices.length === 0 && navigator.mediaDevices?.enumerateDevices) {
            const allDevices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = allDevices.filter((device) => device.kind === 'videoinput')
            setDevices(videoDevices)
          }

          const constraints: MediaStreamConstraints = {
            video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
          }

          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          setStream(mediaStream)
          setHasCameraPermission(true)

          if (!selectedDeviceId) {
            const videoTrack = mediaStream.getVideoTracks()[0]
            if (videoTrack) {
              const settings = videoTrack.getSettings()
              if (settings.deviceId) {
                setSelectedDeviceId(settings.deviceId)
              }
            }
          }

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        } catch (error) {
          console.error('Error accessing camera:', error)
          setHasCameraPermission(false)
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          })
        }
      }

      void getCameraStream()

      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          setStream(null)
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    } else if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMode, disabled, selectedDeviceId])

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Worksheet Image</CardTitle>
        <CardDescription>
          {captureMode === 'file'
            ? 'Select a worksheet photo, use your camera, or try the built-in sample worksheet.'
            : 'Position your worksheet in the frame.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {captureMode === 'file' ? (
          <>
            <div
              className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragging ? 'border-primary bg-accent/20' : 'border-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !disabled && document.getElementById('file-upload-input')?.click()}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label="Image upload area"
              aria-disabled={disabled}
            >
              <UploadCloud
                className={`w-12 h-12 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              <Input
                id="file-upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelectedOnInputChange}
                className="sr-only"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                id="take-photo-btn"
                variant="outline"
                className="w-full"
                onClick={handleTakePhotoClick}
                disabled={disabled}
                aria-label="Switch to camera capture"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
              <Button
                id="load-sample-worksheet-btn"
                variant="secondary"
                className="w-full"
                onClick={handleLoadSampleWorksheet}
                disabled={disabled || isLoadingSample}
                aria-label="Load sample fractions worksheet"
              >
                <FileCheck2 className="mr-2 h-5 w-5" />
                {isLoadingSample ? 'Loading Sample...' : 'Try Sample Worksheet (Fractions)'}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <Alert variant="destructive" className="w-full">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                      Please allow camera access in your browser settings and refresh the page.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">Initializing camera...</p>
                </div>
              )}
              {devices.length > 1 && hasCameraPermission === true && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background/90"
                  onClick={handleSwitchCamera}
                  aria-label="Switch Camera"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Button
              onClick={handleCaptureImage}
              className="w-full"
              disabled={disabled || hasCameraPermission !== true}
              aria-label="Snap photo from camera"
            >
              <Zap className="mr-2 h-5 w-5" />
              Snap Photo
            </Button>
            <Button
              variant="outline"
              onClick={handleSwitchToFileUpload}
              className="w-full"
              disabled={disabled}
              aria-label="Switch to file upload"
            >
              <FileUp className="mr-2 h-5 w-5" />
              Use File Upload Instead
            </Button>
          </div>
        )}

        {preview && captureMode === 'file' && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-2">Selected Image Preview:</p>
            <img
              src={preview}
              alt={fileName || 'Worksheet preview'}
              className="rounded-md object-contain max-h-60 w-auto mx-auto shadow-sm"
            />
            {fileName && (
              <p className="text-xs text-muted-foreground mt-2 text-center">{fileName}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
