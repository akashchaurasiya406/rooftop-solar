import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import type { Session } from "@/lib/auth/session";
import { Logo } from "./ui";

const ROLE_LABEL = { HOMEOWNER: "Homeowner", SALES: "Sales", ADMIN: "Sales manager" } as const;

export function AppHeader({ session, nav = [] }: { session: Session; nav?: { href: string; label: string }[] }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden gap-1 sm:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-line/60 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{session.name}</p>
            <p className="text-xs text-muted">{ROLE_LABEL[session.role]}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-line/60 hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
