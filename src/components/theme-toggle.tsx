"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";

type Theme = "light" | "dark";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(current()), []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-switching"), 400);
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cx(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-ink transition-all duration-300 hover:border-line-strong active:scale-90",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cx("absolute size-[18px] transition-all duration-500 ease-[var(--ease-out-soft)]", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cx("absolute size-[18px] transition-all duration-500 ease-[var(--ease-out-soft)]", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
