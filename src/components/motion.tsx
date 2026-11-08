"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "./ui";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cx("transition-[opacity,transform,filter] duration-[900ms] ease-[var(--ease-out-soft)]", shown ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[2px]", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function WordReveal({ lines, className, accentLine }: { lines: string[]; className?: string; accentLine?: number }) {
  let n = 0;
  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} className={cx("block", li === accentLine && "text-brand")}>
          {line.split(" ").map((w, wi) => {
            const i = n++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span className="inline-block animate-[word_0.9s_var(--ease-out-soft)_both]" style={{ animationDelay: `${120 + i * 70}ms` }}>
                  {w}&nbsp;
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

export function Magnetic({ children, className, strength = 0.28 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    setStyle({ transform: `translate3d(${x}px, ${y}px, 0)`, transition: "transform 0.15s ease-out" });
  };
  const leave = () => setStyle({ transform: "translate3d(0,0,0)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" });
  return (
    <span ref={ref} onPointerMove={move} onPointerLeave={leave} className={cx("inline-block", className)} style={style}>
      {children}
    </span>
  );
}

export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      className={cx(
        "group relative overflow-hidden rounded-[22px] border border-line bg-surface transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-line-strong",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-10 py-1 hover:[animation-play-state:paused]">
        {row.map((it, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap text-sm text-muted">
            {it}
            <span aria-hidden className="size-1 rounded-full bg-sun" />
          </span>
        ))}
      </div>
    </div>
  );
}
