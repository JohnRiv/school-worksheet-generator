
"use client";

import type { AnalyzeWorksheetOutput } from '@/ai/flows/analyze-worksheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, MessageSquareQuote, ListChecks, FileJson, ClipboardList } from 'lucide-react';

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
          {analysis.identified_concepts && analysis.identified_concepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.identified_concepts.map((concept, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {concept.subject}: {concept.main_topic} - {concept.specific_concept}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No specific concepts identified.</p>
          )}
        </div>

        {analysis.worksheet_directions && analysis.worksheet_directions.trim() !== "" && (
           <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
                <ClipboardList className="mr-2 h-5 w-5 text-accent" />
                Worksheet Directions
            </h3>
            <p className="text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{analysis.worksheet_directions}</p>
           </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
            <MessageSquareQuote className="mr-2 h-5 w-5 text-accent" />
            Question Formats
          </h3>
          {analysis.identified_question_formats && analysis.identified_question_formats.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-foreground">
              {analysis.identified_question_formats.map((format, index) => (
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
          {analysis.example_questions && analysis.example_questions.length > 0 ? (
            <ul className="list-decimal list-inside space-y-1 bg-muted/30 p-4 rounded-md text-foreground">
              {analysis.example_questions.map((question, index) => (
                <li key={index} className="italic">"{question}"</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No example questions extracted.</p>
          )}
        </div>
        
        {analysis.answer_bank_present && (
          <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md">
            <p className="text-sm font-medium text-green-700 dark:text-green-200">This worksheet appears to have an answer bank.</p>
          </div>
        )}
        
        {analysis.additional_notes_for_generation && analysis.additional_notes_for_generation.trim() !== "" && (
           <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
                Additional Notes for Generation
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{analysis.additional_notes_for_generation}</p>
           </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center font-headline">
            <FileJson className="mr-2 h-5 w-5 text-accent" />
            Analysis JSON (for AI Problem Generation)
          </h3>
          <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/50">
            <pre className="text-xs whitespace-pre-wrap break-all">
              <code>{JSON.stringify(analysis, null, 2)}</code>
            </pre>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-1">This JSON is used by the AI to generate new problems.</p>
        </div>

      </CardContent>
    </Card>
  );
}

