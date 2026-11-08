"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const TEXT = {
  en: { title: "Something went wrong", body: "Please try again. If it keeps happening, contact the office.", retry: "Try again" },
  hi: { title: "कुछ गड़बड़ हो गई", body: "कृपया फिर से कोशिश करें। अगर बार-बार हो, तो दफ़्तर से संपर्क करें।", retry: "फिर कोशिश करें" },
};

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  useEffect(() => setLang(document.documentElement.lang === "hi" ? "hi" : "en"), []);
  const t = TEXT[lang];
  return (
    <main role="alert" className="mx-auto flex min-h-[60dvh] max-w-sm animate-rise flex-col justify-center px-5">
      <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-muted">{t.body}</p>
      <Button onClick={reset} variant="secondary" className="mt-6 self-start">
        {t.retry}
      </Button>
    </main>
  );
}
