"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/app/_actions/lang";
import { cx } from "./ui";

export function LanguageToggle({ lang, className }: { lang: "en" | "hi"; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (next: "en" | "hi") => {
    if (next === lang) return;
    start(async () => {
      await setLanguage(next);
      document.documentElement.lang = next;
      router.refresh();
    });
  };
  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className={cx("relative inline-flex h-9 items-center rounded-full border border-line bg-surface p-0.5 text-[13px] font-medium", pending && "opacity-70", className)}
    >
      <span
        aria-hidden
        className={cx(
          "absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-ink transition-transform duration-300 ease-[var(--ease-out-soft)]",
          lang === "hi" ? "translate-x-full" : "translate-x-0",
        )}
      />
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={cx("relative z-10 min-w-11 rounded-full px-2.5 py-1 transition-colors duration-300", lang === l ? "text-on-ink" : "text-muted hover:text-ink")}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
