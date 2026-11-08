"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./ui";

const SCENE_MS = 4200;

export interface ShowcaseText {
  steps: { title: string; body: string }[];
  scanning: string;
  read: string;
  units: string;
  load: string;
  amount: string;
  suggested: string;
  quote: string;
  system: string;
  youPay: string;
  payback: string;
  years: string;
  afterSubsidy: string;
  tracking: string;
  stages: string[];
  toast: string;
}

function useCountUp(target: number, run: boolean, ms = 1100) {
  const [v, setV] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function SceneScan({ t }: { t: ShowcaseText }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-4">
      <div className="relative h-[330px] w-full animate-[pop_0.6s_var(--ease-out-soft)_both] overflow-hidden rounded-xl border border-line bg-white shadow-lift">
        <img src="/sample-bills/sample-bill-clear.jpg" alt="" className="block h-full w-full scale-[1.55] object-cover object-[0%_8%] [transform-origin:0_0]" />
        <div className="pointer-events-none absolute inset-x-0 h-16 animate-[scan_2.2s_ease-in-out_0.4s_infinite] bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 h-0.5 animate-[scan_2.2s_ease-in-out_0.4s_infinite] bg-brand shadow-[0_0_14px_2px_var(--color-brand)]" />
        {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((c) => (
          <span key={c} className={cx("absolute size-5 rounded-[3px] border-brand", c)} />
        ))}
      </div>
      <span className="inline-flex animate-[rise_0.5s_var(--ease-out-soft)_0.3s_both] items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand">
        <span className="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        {t.scanning}
      </span>
    </div>
  );
}

function SceneRead({ t }: { t: ShowcaseText }) {
  const rows = [
    [t.units, "340", "99%"],
    [t.load, "3 kW", "97%"],
    [t.amount, "₹3,200", "98%"],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-5">
      <p className="animate-[rise_0.5s_var(--ease-out-soft)_both] text-[13px] font-semibold">{t.read}</p>
      {rows.map(([k, v, c], i) => (
        <div
          key={k}
          className="flex animate-[rise_0.55s_var(--ease-out-soft)_both] items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3 shadow-soft"
          style={{ animationDelay: `${150 + i * 260}ms` }}
        >
          <span className="text-[12px] text-muted">{k}</span>
          <span className="flex items-center gap-2">
            <span className="num text-[15px] font-semibold">{v}</span>
            <span className="num animate-[pop_0.4s_var(--ease-out-soft)_both] rounded-full bg-high-soft px-1.5 py-0.5 text-[10px] font-semibold text-high" style={{ animationDelay: `${600 + i * 260}ms` }}>
              ✓ {c}
            </span>
          </span>
        </div>
      ))}
      <div className="mt-1 flex animate-[pop_0.6s_var(--ease-out-soft)_1.4s_both] items-center justify-between rounded-xl bg-brand px-4 py-3.5 text-on-brand shadow-lift">
        <span className="text-[12px] opacity-85">{t.suggested}</span>
        <span className="num text-lg font-semibold">3 kW</span>
      </div>
    </div>
  );
}

function SceneQuote({ t, run }: { t: ShowcaseText; run: boolean }) {
  const pay = useCountUp(96000, run);
  const sub = useCountUp(78000, run);
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-5">
      <p className="animate-[rise_0.5s_var(--ease-out-soft)_both] text-[13px] font-semibold">{t.quote}</p>
      <div className="animate-[rise_0.55s_var(--ease-out-soft)_0.1s_both] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <span className="text-[12px] text-muted">{t.system}</span>
          <span className="num text-lg font-semibold">3 kW</span>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-muted">{t.youPay}</span>
            <span className="num text-[26px] font-semibold tracking-tight">{inr(pay)}</span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full origin-left animate-[grow_1.1s_var(--ease-out-soft)_0.2s_both] bg-brand" style={{ width: "55%" }} />
            <div className="h-full origin-left animate-[grow_1.1s_var(--ease-out-soft)_0.5s_both] bg-sun" style={{ width: "45%" }} />
          </div>
          <p className="num mt-1.5 text-right text-[11px] text-muted">− {inr(sub)} subsidy</p>
        </div>
        <div className="flex items-baseline justify-between border-t border-line bg-brand-soft/60 px-4 py-3">
          <span className="text-[12px] text-brand">{t.payback}</span>
          <span className="num text-lg font-semibold text-brand">
            2.5 {t.years}
          </span>
        </div>
      </div>
    </div>
  );
}

function SceneTrack({ t }: { t: ShowcaseText }) {
  return (
    <div className="relative flex h-full flex-col justify-center px-5">
      <p className="mb-3 animate-[rise_0.5s_var(--ease-out-soft)_both] text-[13px] font-semibold">{t.tracking}</p>
      <ol>
        {t.stages.slice(0, 5).map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className="mt-0.5 flex size-4 animate-[pop_0.35s_var(--ease-out-soft)_both] items-center justify-center rounded-full bg-brand text-[9px] text-on-brand"
                style={{ animationDelay: `${200 + i * 380}ms`, opacity: i < 3 ? undefined : 0.25 }}
              >
                {i < 3 ? "✓" : ""}
              </span>
              {i < 4 && <span className="my-0.5 h-5 w-0.5 origin-top animate-[grow-y_0.35s_ease-out_both] bg-brand" style={{ animationDelay: `${380 + i * 380}ms`, opacity: i < 2 ? 1 : 0.2 }} />}
            </span>
            <span className={cx("animate-[rise_0.4s_var(--ease-out-soft)_both] text-[12.5px]", i < 3 ? "font-medium" : "text-muted")} style={{ animationDelay: `${200 + i * 380}ms` }}>
              {s}
            </span>
          </li>
        ))}
      </ol>
      <div className="absolute inset-x-3 bottom-4 animate-[toast_0.6s_var(--ease-out-soft)_2.2s_both] rounded-2xl rounded-bl-sm bg-[#dcf8c6] px-3.5 py-2.5 text-[11.5px] leading-snug text-[#1c1b18] shadow-lift">
        <span className="mb-0.5 block text-[10px] font-semibold text-[#128c7e]">WhatsApp</span>
        {t.toast}
      </div>
    </div>
  );
}

export function ProductShowcase({ t, compact, heading }: { t: ShowcaseText; compact?: boolean; heading?: ReactNode }) {
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    const id = window.setTimeout(() => setScene((s) => (s + 1) % 4), SCENE_MS);
    return () => window.clearTimeout(id);
  }, [scene, visible, reduced, cycle]);

  const go = (i: number) => {
    setScene(i);
    setCycle((c) => c + 1);
  };

  const phone = (
    <div className="relative mx-auto w-[280px] shrink-0 sm:w-[300px]">
      <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_30%,transparent),transparent)] blur-2xl" />
      <div className="rounded-[46px] border border-line-strong bg-gradient-to-b from-[#2a2c30] to-[#141518] p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)]">
        <div className="relative h-[560px] overflow-hidden rounded-[38px] bg-paper sm:h-[600px]">
          <div className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0b0c0e]" />
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold">
            <span className="num">9:41</span>
            <span className="flex gap-1">
              <span className="h-2.5 w-4 rounded-sm border border-ink/60" />
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-5 pb-2 pt-5 text-[13px] font-semibold">
            <span className="inline-block size-3.5 rounded-full bg-sun" />
            Rooftop Solar
          </div>
          <div key={`${scene}-${cycle}`} className="absolute inset-x-0 bottom-0 top-20">
            {scene === 0 && <SceneScan t={t} />}
            {scene === 1 && <SceneRead t={t} />}
            {scene === 2 && <SceneQuote t={t} run={visible && !reduced} />}
            {scene === 3 && <SceneTrack t={t} />}
          </div>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div ref={ref} aria-hidden>
        {phone}
      </div>
    );
  }

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
      <div className="order-2 lg:order-1">
      {heading && <div className="mb-8">{heading}</div>}
      <ol className="grid gap-2">
        {t.steps.map((s, i) => {
          const active = i === scene;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={active ? "step" : undefined}
                className={cx(
                  "group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500",
                  active ? "border-line-strong bg-surface shadow-lift" : "border-transparent hover:bg-surface/60",
                )}
              >
                <span className="flex items-baseline gap-4">
                  <span className={cx("num text-sm font-semibold transition-colors", active ? "text-brand" : "text-muted")}>0{i + 1}</span>
                  <span>
                    <span className={cx("block text-lg font-semibold tracking-tight transition-colors", active ? "text-ink" : "text-muted")}>{s.title}</span>
                    <span
                      className={cx(
                        "grid transition-all duration-500 ease-[var(--ease-out-soft)]",
                        active ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <span className="overflow-hidden text-[15px] text-muted">{s.body}</span>
                    </span>
                  </span>
                </span>
                {active && !reduced && (
                  <span
                    key={`bar-${scene}-${cycle}`}
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand"
                    style={{ animation: `grow ${SCENE_MS}ms linear both`, animationPlayState: visible ? "running" : "paused" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
      </div>
      <div className="order-1 lg:order-2" aria-hidden>
        {phone}
      </div>
    </div>
  );
}
