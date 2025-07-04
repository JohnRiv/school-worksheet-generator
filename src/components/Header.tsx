import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <Link href="/" className="flex items-center gap-2">
          <BookOpenCheck className="h-8 w-8" />
          <h1 className="text-2xl font-bold font-headline">
            School Worksheet Generator
          </h1>
        </Link>
      </div>
    </header>
  );
}
