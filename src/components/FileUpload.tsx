
"use client";

import React, { useState, ChangeEvent, DragEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Label is not used, but kept for consistency if added later
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Camera, Zap, FileUp, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FileUploadProps {
  onFileChange: (file: File | null, dataUri: string | null) => void;
  disabled?: boolean;
}

async function dataUriToImageFile(dataUri: string, filename: string): Promise<File> {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [captureMode, setCaptureMode] = useState<'file' | 'camera'>('file');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      // For PDF, we won't be able to generate a direct image preview this way
      // We'll still pass the dataUri and file object for processing
      if (file.type.startsWith('image/')) {
        setPreview(dataUri);
      } else {
        setPreview(null); // Or a generic PDF icon preview if desired
      }
      onFileChange(file, dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelectedOnInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      setPreview(null);
      setFileName(null);
      onFileChange(null, null);
    }
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleTakePhotoClick = () => {
    if (disabled) return;
    setCaptureMode('camera');
    setPreview(null); // Clear previous preview
    setFileName(null);
  };

  const handleSwitchToFileUpload = () => {
    setCaptureMode('file');
    // Stream is stopped by useEffect cleanup
  };

  const handleCaptureImage = async () => {
    if (disabled || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/png');
      const imageName = `capture-${Date.now()}.png`;
      try {
        const imageFile = await dataUriToImageFile(dataUri, imageName);
        processFile(imageFile); // This will set preview, fileName and call onFileChange
      } catch (error) {
        console.error("Error converting data URI to file:", error);
        toast({
          variant: "destructive",
          title: "Capture Failed",
          description: "Could not process the captured image.",
        });
      }
    }
    setCaptureMode('file'); // Switch back to file mode, useEffect will clean up stream
  };
  
  useEffect(() => {
    if (captureMode === 'camera' && !disabled) {
      setHasCameraPermission(null); // Reset permission status
      const getCameraPermission = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(mediaStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();

      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    } else if (stream) {
        // Cleanup if mode changes or component unmounts while stream is active
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMode, disabled]); // toast is stable, stream is managed internally

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Worksheet Image</CardTitle>
        <CardDescription>
          {captureMode === 'file' ? 'Select an image or take a photo.' : 'Position your worksheet in the frame.'}
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
              <UploadCloud className={`w-12 h-12 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, HEIC, PDF up to 10MB</p>
              <Input
                id="file-upload-input"
                type="file"
                accept="image/png,image/jpeg,image/heic,image/heif,application/pdf,.png,.jpg,.jpeg,.heic,.heif,.pdf"
                onChange={handleFileSelectedOnInputChange}
                className="sr-only"
                disabled={disabled}
              />
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleTakePhotoClick}
              disabled={disabled}
              aria-label="Switch to camera capture"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
          </>
        ) : ( // captureMode === 'camera'
          <div className="space-y-4">
            <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                playsInline // Important for iOS
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
            <Image 
              src={preview} 
              alt={fileName || "Preview"}
              width={400} 
              height={300} 
              className="rounded-md object-contain max-h-60 w-auto mx-auto shadow-sm"
              data-ai-hint="worksheet preview"
            />
            {fileName && <p className="text-xs text-muted-foreground mt-2 text-center">{fileName}</p>}
          </div>
        )}
         {fileName && !preview && captureMode === 'file' && ( // For non-image files like PDF
          <div className="mt-4 p-4 border rounded-lg bg-muted/30 text-center">
            <FileUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">Selected File:</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

