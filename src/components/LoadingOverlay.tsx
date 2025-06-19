"use client";

import { useAppContext } from "@/app/context/AppContext";
import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useAppContext();

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="assertive"
      aria-busy="true"
      aria-label={loadingMessage || "Loading"}
    >
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      {loadingMessage && <p className="text-lg text-foreground font-medium">{loadingMessage}</p>}
    </div>
  );
}
