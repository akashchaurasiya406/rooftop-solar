"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export function NavLinks({ items, mobile }: { items: { href: string; label: string; badge?: number }[]; mobile?: boolean }) {
  const pathname = usePathname();
  const matches = items.filter((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className={mobile ? "-mx-1 flex gap-1 overflow-x-auto pb-2 sm:hidden" : "hidden gap-1 sm:flex"}>
      {items.map((n) => {
        const active = n.href === activeHref;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
              active ? "font-medium text-ink" : "text-muted hover:bg-line/60 hover:text-ink",
            )}
          >
            {n.label}
            {n.badge ? (
              <span className="ml-1.5 inline-flex min-w-5 animate-pop items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-semibold text-[#1c1b18]">
                {n.badge}
              </span>
            ) : null}
            {active && <span className={cx("absolute inset-x-3 h-0.5 animate-fade rounded-full bg-brand", mobile ? "-bottom-[9px]" : "-bottom-[13px]")} />}
          </Link>
        );
      })}
    </nav>
  );
}
