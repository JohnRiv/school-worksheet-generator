"use client";

import React, { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function MainLayoutContent({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground">
        <p>Made with Google Gemini by JohnRiv | Project ID: {process.env.GC_PROJECT_ID} / {process.env.GC_PROJECT_ID_PROJ}</p>
      </footer>
      <LoadingOverlay />
    </>
  );
}
