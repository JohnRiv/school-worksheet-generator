import React, { useState, type ChangeEvent, type DragEvent, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadCloud, Camera, Zap, FileUp, XCircle, RefreshCcw, FileCheck2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

interface FileUploadProps {
  onFileChange: (file: File | null, dataUri: string | null) => void
  disabled?: boolean
}

function dataUriToImageFile(dataUri: string, filename: string): File {
  const [header, base64Data] = dataUri.split(',')
  const mimeMatch = header?.match(/data:([^;]+)/)
  const mimeType = mimeMatch?.[1] || 'image/png'
  const binaryString = atob(base64Data || '')
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mimeType })
}

/**
 * Strips JPEG APP1–APP15 segments (which contain EXIF, GPS, XMP, and camera maker notes)
 * directly from the binary buffer while preserving SOI, APP0 (JFIF), DQT, DHT, SOF, SOS, and image scan data.
 */
function stripJpegMetadataBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes
  }

  const chunks: Uint8Array[] = [bytes.subarray(0, 2)] // SOI marker (0xFFD8)
  let offset = 2

  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      chunks.push(bytes.subarray(offset))
      break
    }

    const marker = bytes[offset + 1]

    // SOS (Start of Scan, 0xDA) or EOI (End of Image, 0xD9): copy the rest of the stream verbatim
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.subarray(offset))
      break
    }

    // Standalone markers without length payload
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(bytes.subarray(offset, offset + 2))
      offset += 2
      continue
    }

    if (offset + 3 >= bytes.length) {
      chunks.push(bytes.subarray(offset))
      break
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      chunks.push(bytes.subarray(offset))
      break
    }

    // Drop APP1..APP15 (0xE1..0xEF) and COM (0xFE) comments which hold EXIF, GPS, XMP, and ICC/device tags
    const isPrivateMetadataSegment = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe
    if (!isPrivateMetadataSegment) {
      chunks.push(bytes.subarray(offset, offset + 2 + segmentLength))
    }

    offset += 2 + segmentLength
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
  const sanitized = new Uint8Array(totalLength)
  let writePos = 0
  for (const chunk of chunks) {
    sanitized.set(chunk, writePos)
    writePos += chunk.length
  }
  return sanitized
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...slice)
  }
  return btoa(binary)
}

/**
 * Strips embedded EXIF, GPS location, XMP, and comment metadata from an image File
 * and normalizes its filename so personal device metadata is not retained in memory.
 */
export async function stripImageMetadata(
  file: File,
  rawDataUri: string
): Promise<{ cleanFile: File; cleanDataUri: string }> {
  try {
    const [header, base64Data] = rawDataUri.split(',')
    if (!base64Data) {
      return { cleanFile: file, cleanDataUri: rawDataUri }
    }
    const mimeMatch = header?.match(/data:([^;]+)/)
    const mimeType = mimeMatch?.[1] || file.type || 'image/jpeg'
    const binaryString = atob(base64Data)
    let bytes: Uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    if (mimeType === 'image/jpeg' || (bytes[0] === 0xff && bytes[1] === 0xd8)) {
      bytes = stripJpegMetadataBytes(bytes)
    }

    const sanitizedName = file.name.replace(/[^\w.-]/g, '_') || 'worksheet.jpg'
    const cleanDataUri = `data:${mimeType};base64,${uint8ArrayToBase64(bytes)}`
    const cleanFile = new File([bytes as BlobPart], sanitizedName, { type: mimeType })
    return { cleanFile, cleanDataUri }
  } catch {
    return { cleanFile: file, cleanDataUri: rawDataUri }
  }
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [captureMode, setCaptureMode] = useState<'file' | 'camera'>('file')
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isLoadingSample, setIsLoadingSample] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const stopActiveCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const processFile = (file: File) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setPreview(null)
      setFileName(null)
      onFileChange(null, null)
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a valid PNG, JPG, or WEBP image.',
      })
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPreview(null)
      setFileName(null)
      onFileChange(null, null)
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB.',
      })
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const rawDataUri = reader.result as string
      const { cleanFile, cleanDataUri } = await stripImageMetadata(file, rawDataUri)
      setPreview(cleanDataUri)
      onFileChange(cleanFile, cleanDataUri)
    }
    reader.readAsDataURL(file)
  }

  const handleLoadSampleWorksheet = async () => {
    if (disabled || isLoadingSample) return
    setIsLoadingSample(true)
    try {
      const sampleUrl = `${import.meta.env.BASE_URL}sample-worksheet.jpg`
      const response = await fetch(sampleUrl)
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
    stopActiveCameraStream()
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
        const imageFile = dataUriToImageFile(dataUri, imageName)
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
    stopActiveCameraStream()
    setCaptureMode('file')
  }

  const handleSwitchCamera = () => {
    if (devices.length < 2) return
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId)
    const nextIndex = (currentIndex + 1) % devices.length
    setSelectedDeviceId(devices[nextIndex].deviceId)
  }

  useEffect(() => {
    let cancelled = false

    if (captureMode === 'camera' && !disabled) {
      setHasCameraPermission(null)

      const getCameraStream = async () => {
        try {
          if (devices.length === 0 && navigator.mediaDevices?.enumerateDevices) {
            const allDevices = await navigator.mediaDevices.enumerateDevices()
            if (cancelled) return
            const videoDevices = allDevices.filter((device) => device.kind === 'videoinput')
            setDevices(videoDevices)
          }

          const constraints: MediaStreamConstraints = {
            video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
          }

          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          if (cancelled) {
            mediaStream.getTracks().forEach((track) => track.stop())
            return
          }

          stopActiveCameraStream()
          streamRef.current = mediaStream
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
          if (cancelled) return
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
        cancelled = true
        stopActiveCameraStream()
      }
    } else {
      stopActiveCameraStream()
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
