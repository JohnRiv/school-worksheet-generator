"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { handleAnalyzeWorksheet } from '@/app/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    setUploadedImage, 
    setWorksheetAnalysis, 
    setIsLoading, 
    setLoadingMessage,
    setError 
  } = useAppContext();
  
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentDataUri, setCurrentDataUri] = useState<string | null>(null);
  const [removeHandwriting, setRemoveHandwriting] = useState(false);

  const onFileSelected = (file: File | null, dataUri: string | null) => {
    setCurrentFile(file);
    setCurrentDataUri(dataUri);
    if (dataUri) {
      setUploadedImage(dataUri); // Store for potential later use, e.g., display on next page
    } else {
      setUploadedImage(null);
    }
  };

  const analyzeWorksheet = async () => {
    if (!currentFile || !currentDataUri) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image of a worksheet first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyzing worksheet...");
    setError(null);

    try {
      const result = await handleAnalyzeWorksheet(currentDataUri, removeHandwriting);

      if (result.success && result.data) {
        setWorksheetAnalysis(result.data);
        toast({
          title: "Analysis Complete",
          description: "Worksheet analyzed successfully. Proceed to generate problems.",
        });
        router.push('/generate');
      } else {
        throw new Error(result.error || "Failed to analyze worksheet.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <Wand2 className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">Welcome!</CardTitle>
          <CardDescription className="text-lg">
            Upload your worksheet and let AI help you generate practice problems.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload onFileChange={onFileSelected} disabled={false /*isLoading - re-enable if needed*/} />
          <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg">
            <Checkbox 
              id="removeHandwriting" 
              checked={removeHandwriting}
              onCheckedChange={(checked) => setRemoveHandwriting(checked as boolean)}
              aria-label="Remove handwriting from image"
            />
            <Label htmlFor="removeHandwriting" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Attempt to remove handwriting (experimental)
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={analyzeWorksheet} 
            disabled={!currentFile /*|| isLoading - re-enable if needed*/}
            className="w-full text-lg py-6"
            size="lg"
          >
            <Wand2 className="mr-2 h-5 w-5" />
            Analyze Worksheet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
