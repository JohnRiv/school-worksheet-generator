"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { WorksheetAnalysisDisplay } from '@/components/WorksheetAnalysisDisplay';
import { ProblemGenerationControls } from '@/components/ProblemGenerationControls';
import { GeneratedProblemsView } from '@/components/GeneratedProblemsView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GeneratePage() {
  const router = useRouter();
  const { worksheetAnalysis, isLoading } = useAppContext();

  useEffect(() => {
    if (!isLoading && !worksheetAnalysis) {
      // If there's no analysis data and not currently loading, redirect to home.
      // This can happen if the user directly navigates to /generate.
      router.replace('/');
    }
  }, [worksheetAnalysis, isLoading, router]);

  if (!worksheetAnalysis) {
    // Show a minimal loading or placeholder if analysis is not yet available
    // This also prevents rendering errors if context is briefly null before redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Loading analysis or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
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
  );
}
