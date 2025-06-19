
"use client";

import type { AnalyzeWorksheetOutput } from '@/ai/flows/analyze-worksheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, MessageSquareQuote, ListChecks, FileJson } from 'lucide-react';

interface WorksheetAnalysisDisplayProps {
  analysis: AnalyzeWorksheetOutput;
}

export function WorksheetAnalysisDisplay({ analysis }: WorksheetAnalysisDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Worksheet Analysis Results
        </CardTitle>
        <CardDescription>
          Here's what the AI understood from your worksheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
            <Lightbulb className="mr-2 h-5 w-5 text-accent" />
            Identified Concepts
          </h3>
          {analysis.concepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.concepts.map((concept, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">{concept}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No specific concepts identified.</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
            <MessageSquareQuote className="mr-2 h-5 w-5 text-accent" />
            Question Formats
          </h3>
          {analysis.questionFormats.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-foreground">
              {analysis.questionFormats.map((format, index) => (
                <li key={index}>{format}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No specific question formats identified.</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
             <ListChecks className="mr-2 h-5 w-5 text-accent" />
            Example Questions
          </h3>
          {analysis.exampleQuestions.length > 0 ? (
            <ul className="list-decimal list-inside space-y-1 bg-muted/30 p-4 rounded-md text-foreground">
              {analysis.exampleQuestions.map((question, index) => (
                <li key={index} className="italic">"{question}"</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No example questions extracted.</p>
          )}
        </div>
        
        {analysis.hasAnswerBank && (
          <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md">
            <p className="text-sm font-medium text-green-700 dark:text-green-200">This worksheet appears to have an answer bank.</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
            <FileJson className="mr-2 h-5 w-5 text-accent" />
            JSON for Problem Generation
          </h3>
          <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/50">
            <pre className="text-xs whitespace-pre-wrap break-all">
              <code>{analysis.jsonForProblemGeneration}</code>
            </pre>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-1">This JSON is used by the AI to generate new problems.</p>
        </div>
      </CardContent>
    </Card>
  );
}
