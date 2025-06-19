"use client";

import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { ProblemCard } from '@/components/ProblemCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Shuffle } from 'lucide-react';

export function GeneratedProblemsView() {
  const { generatedProblems } = useAppContext();
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  if (!generatedProblems || generatedProblems.problems.length === 0) {
    return (
        <Card className="mt-8 bg-muted/40 shadow-inner">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-muted-foreground">No Problems Generated Yet</CardTitle>
                <CardDescription>Use the controls above to generate practice problems.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  // Simple shuffle function for answer bank
  const shuffleArray = (array: string[]) => {
    if (!array) return [];
    return [...array].sort(() => Math.random() - 0.5);
  };
  
  // Use useEffect to shuffle only once when component mounts or answerBank changes
  const [shuffledAnswerBank, setShuffledAnswerBank] = useState<string[]>([]);
  
  React.useEffect(() => {
    if (generatedProblems?.answerBank) {
      setShuffledAnswerBank(shuffleArray(generatedProblems.answerBank));
    } else {
      setShuffledAnswerBank([]);
    }
  }, [generatedProblems?.answerBank]);


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
          {generatedProblems.problems.map((problem, index) => (
            <ProblemCard 
              key={index} 
              problemNumber={index + 1}
              problem={problem}
              answer={generatedProblems.answerBank ? "See Answer Bank" : (generatedProblems.problems[index] /* Placeholder if no separate answers */)} // This needs actual answers if not using bank
              initiallyRevealed={showAllAnswers}
            />
          ))}
        </div>

        {shuffledAnswerBank.length > 0 && (
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
