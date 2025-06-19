
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { ProblemCard } from '@/components/ProblemCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Shuffle } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Added missing import

export function GeneratedProblemsView() {
  const { generatedProblems } = useAppContext();
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [shuffledAnswerBank, setShuffledAnswerBank] = useState<string[]>([]);

  const shuffleArray = (array: string[] | undefined): string[] => {
    if (!array || array.length === 0) return [];
    // Simple shuffle
    return [...array].sort(() => Math.random() - 0.5);
  };
  
  useEffect(() => {
    if (generatedProblems?.answerBank) {
      setShuffledAnswerBank(shuffleArray(generatedProblems.answerBank));
    } else {
      setShuffledAnswerBank([]);
    }
  }, [generatedProblems?.answerBank]);


  if (!generatedProblems || !generatedProblems.problems || generatedProblems.problems.length === 0) {
    return (
        <Card className="mt-8 bg-muted/40 shadow-inner">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-muted-foreground">No Problems Generated Yet</CardTitle>
                <CardDescription>Use the controls above to generate practice problems.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-headline">Generated Practice Problems</CardTitle>
          {generatedProblems.problems.length > 0 && (
             <Button variant="outline" onClick={() => setShowAllAnswers(!showAllAnswers)} className="shrink-0">
             {showAllAnswers ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
             {showAllAnswers ? 'Hide All Answers' : 'Reveal All Answers'}
           </Button>
          )}
        </div>
        <CardDescription>Review the problems below. You can reveal answers individually or all at once.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {generatedProblems.problems.map((problemItem, index) => (
            <ProblemCard 
              key={index} 
              problemNumber={index + 1}
              problem={problemItem.question}
              answer={generatedProblems.answer_bank_present ? "See Answer Bank" : problemItem.answer}
              initiallyRevealed={showAllAnswers}
            />
          ))}
        </div>

        {generatedProblems.answer_bank_present && shuffledAnswerBank.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-xl font-semibold mb-3 font-headline flex items-center">
              <Shuffle className="mr-2 h-5 w-5 text-primary"/>
              Answer Bank (Shuffled)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {shuffledAnswerBank.map((ans, idx) => (
                <Badge key={idx} variant="secondary" className="text-center justify-center p-2 text-sm break-all">
                  {ans}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Match these answers to the problems above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
