import { logout } from "@/app/(auth)/actions";
import type { Session } from "@/lib/auth/session";
import { LanguageToggle } from "./language-toggle";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./ui";

const ROLE_LABEL = { HOMEOWNER: "Homeowner", SALES: "Sales", ADMIN: "Sales manager" } as const;
const ROLE_LABEL_HI = { HOMEOWNER: "घर मालिक", SALES: "सेल्स", ADMIN: "सेल्स मैनेजर" } as const;

export function AppHeader({
  session,
  nav = [],
  lang,
}: {
  session: Session;
  nav?: { href: string; label: string }[];
  lang?: "en" | "hi";
}) {
  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <NavLinks items={nav} />
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{session.name}</p>
            <p className="text-xs text-muted">{(lang === "hi" ? ROLE_LABEL_HI : ROLE_LABEL)[session.role]}</p>
          </div>
          <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
            {initials}
          </span>
          {lang && <LanguageToggle lang={lang} className="max-sm:hidden" />}
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted transition-all hover:bg-line/60 hover:text-ink active:scale-95"
            >
              {lang === "hi" ? "साइन आउट" : "Sign out"}
            </button>
          </form>
        </div>
      </div>
      {nav.length > 1 && (
        <div className="mx-auto max-w-6xl px-3 sm:hidden">
          <NavLinks items={nav} mobile />
        </div>
      )}
    </header>
  );
}
