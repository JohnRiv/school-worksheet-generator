"use client";

import Link from 'next/link';
import { BookOpenCheck, KeyRound } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { Input } from '@/components/ui/input';

export function Header() {
  const { accessCode, setAccessCode } = useAppContext();
  
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <BookOpenCheck className="h-8 w-8" />
          <h1 className="text-2xl font-bold font-headline hidden sm:block">
            School Worksheet Generator
          </h1>
        </Link>
        <div className="flex items-center gap-2 w-full max-w-xs justify-end">
          <KeyRound className="h-5 w-5 opacity-70 hidden sm:block" />
          <Input 
            type="password"
            placeholder="Access Code"
            className="h-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 w-32 focus-visible:ring-primary-foreground/50"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
