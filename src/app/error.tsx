"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Never show raw error messages to users — they can leak internals.
  return (
    <main role="alert" className="mx-auto flex min-h-[60dvh] max-w-sm flex-col justify-center px-5">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, contact the office.</p>
      <Button onClick={reset} variant="secondary" className="mt-6 self-start">Try again</Button>
    </main>
  );
}
