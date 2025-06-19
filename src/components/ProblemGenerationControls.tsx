
"use client";

import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateProblems, handleCustomizeProblems } from '@/app/actions';
import { RefreshCw, Edit3, WandSparkles } from 'lucide-react';

export function ProblemGenerationControls() {
  const { 
    worksheetAnalysis, 
    setGeneratedProblems, 
    setIsLoading, 
    setLoadingMessage, 
    setError 
  } = useAppContext();
  const { toast } = useToast();

  const [numProblems, setNumProblems] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');

  const onGenerateProblems = async (isCustom: boolean) => {
    if (!worksheetAnalysis) {
      toast({ title: "Error", description: "Worksheet analysis not available.", variant: "destructive" });
      return;
    }

    if (isCustom && !customPrompt.trim()) {
      toast({ title: "Custom Prompt Required", description: "Please enter a custom prompt to customize problem generation.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage(isCustom ? "Generating customized problems..." : "Generating problems...");
    setError(null);
    setGeneratedProblems(null); // Clear previous problems

    try {
      const worksheetAnalysisJson = JSON.stringify(worksheetAnalysis);
      let result;
      if (isCustom) {
        result = await handleCustomizeProblems(worksheetAnalysisJson, customPrompt, numProblems);
      } else {
        result = await handleGenerateProblems(worksheetAnalysisJson, numProblems);
      }

      if (result.success && result.data) {
        // Assuming result.data is of type GeneratePracticeProblemsOutput or CustomizeProblemGenerationOutput
        // These types might need adjustment if the AI flow for generation changes its output structure.
        // For now, expecting { problems: string[], answerBank?: string[] }
        setGeneratedProblems(result.data as any); 
        toast({
          title: "Problems Generated",
          description: `${numProblems} practice problems have been successfully generated.`,
        });
      } else {
        throw new Error(result.error || "Failed to generate problems.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="space-y-6 p-2 rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="numProblems" className="font-semibold text-md">Number of Problems</Label>
        <Input 
          id="numProblems" 
          type="number" 
          value={numProblems} 
          onChange={(e) => setNumProblems(Math.max(1, parseInt(e.target.value)))} 
          min="1"
          className="max-w-xs text-base"
        />
      </div>

      <Button onClick={() => onGenerateProblems(false)} size="lg" className="w-full md:w-auto">
        <WandSparkles className="mr-2 h-5 w-5" /> Generate Problems
      </Button>

      <div className="space-y-4 pt-6 border-t mt-6">
        <h4 className="text-lg font-semibold font-headline flex items-center">
          <Edit3 className="mr-2 h-5 w-5 text-primary" />
          Customize Problem Generation (Optional)
        </h4>
        <div className="space-y-2">
          <Label htmlFor="customPrompt" className="font-semibold">Your Custom Instructions</Label>
          <Textarea 
            id="customPrompt" 
            placeholder="e.g., 'Make the problems slightly harder', 'Focus on addition with carrying over', 'Include more word problems'" 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="text-base"
          />
        </div>
        <Button onClick={() => onGenerateProblems(true)} variant="outline" size="lg" className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-5 w-5" /> Customize and Regenerate
        </Button>
      </div>
    </div>
  );
}
```