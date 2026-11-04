"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden gap-1 sm:flex">
      {items.map((n) => {
        const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
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
            {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 animate-fade rounded-full bg-brand" />}
          </Link>
        );
      })}
    </nav>
  );
}
