"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ProblemCardProps {
  problemNumber: number;
  problem: string;
  answer?: string; // Optional: if answer bank is used, this might be less direct.
  initiallyRevealed?: boolean;
}

export function ProblemCard({ problemNumber, problem, answer, initiallyRevealed = false }: ProblemCardProps) {
  const [showAnswer, setShowAnswer] = useState(initiallyRevealed);

  useEffect(() => {
    setShowAnswer(initiallyRevealed);
  }, [initiallyRevealed]);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold font-headline">Problem {problemNumber}</CardTitle>
          {answer && (
            <Button variant="ghost" size="sm" onClick={() => setShowAnswer(!showAnswer)} aria-expanded={showAnswer} aria-controls={`answer-${problemNumber}`}>
              {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground text-base leading-relaxed">{problem}</p>
        {showAnswer && answer && (
          <div id={`answer-${problemNumber}`} className="mt-4 pt-3 border-t border-dashed">
            <h4 className="text-sm font-semibold text-primary mb-1 flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Answer
            </h4>
            <p className="text-muted-foreground text-base italic">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
