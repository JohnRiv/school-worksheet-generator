"use client";

import React, { useState, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Camera } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null, dataUri: string | null) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      setPreview(null);
      setFileName(null);
      onFileChange(null, null);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setPreview(dataUri);
      onFileChange(file, dataUri);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Worksheet Image</CardTitle>
        <CardDescription>Select an image of the worksheet you want to analyze.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragging ? 'border-primary bg-accent/20' : 'border-border'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
          role="button"
          tabIndex={0}
          aria-label="Image upload area"
        >
          <UploadCloud className={`w-12 h-12 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
          <Input
            id="file-upload-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            disabled={disabled}
          />
        </div>

        {/* Camera input option - basic implementation */}
        {/* Note: Actual camera capture might need more robust handling for permissions and device compatibility */}
        {/* For this example, it also just opens the file dialog */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => document.getElementById('camera-upload-input')?.click()}
          disabled={disabled}
          aria-label="Take a photo with camera"
        >
          <Camera className="mr-2 h-5 w-5" />
          Take Photo
        </Button>
        <Input
            id="camera-upload-input"
            type="file"
            accept="image/*"
            capture="environment" // or "user" for front camera
            onChange={handleFileChange}
            className="sr-only"
            disabled={disabled}
          />

        {preview && (
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
      </CardContent>
    </Card>
  );
}
