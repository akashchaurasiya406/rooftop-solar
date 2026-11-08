"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { submitFeedback, type FeedbackState } from "@/app/_actions/feedback";
import type { en } from "@/lib/i18n/en";
import { Alert, Button, cx, Field, Input } from "./ui";

type FeedbackText = typeof en.feedback;

export interface WallItem {
  id: string;
  name: string | null;
  city: string | null;
  rating: number;
  message: string;
  sample: boolean;
}

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={cx(size, i <= value ? "text-sun" : "text-line-strong")} fill="currentColor" aria-hidden>
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  );
}

function initials(name: string | null) {
  const p = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return p.length ? p.slice(0, 2).map((x) => x[0]!.toUpperCase()).join("") : "★";
}

function Quote({ f, sampleLabel }: { f: WallItem; sampleLabel: string }) {
  return (
    <figure className="w-[300px] shrink-0 rounded-2xl border border-line bg-surface p-5 shadow-soft transition-transform duration-500 hover:-translate-y-1 sm:w-[340px]">
      <div className="flex items-center justify-between gap-2">
        <Stars value={f.rating} />
        {f.sample && <span className="rounded-full bg-low-soft px-2 py-0.5 text-[11px] font-medium text-low">{sampleLabel}</span>}
      </div>
      <blockquote className="mt-3 text-[15px] leading-relaxed">“{f.message}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 text-sm">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">{initials(f.name)}</span>
        <span className="leading-tight">
          <span className="block font-medium">{f.name ?? "—"}</span>
          {f.city && <span className="text-[13px] text-muted">{f.city}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export function FeedbackWall({ items, t }: { items: WallItem[]; t: FeedbackText }) {
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center text-muted">{t.empty}</p>;
  }
  const half = Math.ceil(items.length / 2);
  const rows = items.length >= 4 ? [items.slice(0, half), items.slice(half)] : [items];
  return (
    <div className="space-y-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      {rows.map((row, r) => {
        const loop = [...row, ...row, ...(row.length < 4 ? row : [])];
        return (
          <div key={r} className="overflow-hidden">
            <div
              className="flex w-max gap-4 py-2 hover:[animation-play-state:paused]"
              style={{ animation: `marquee ${Math.max(30, row.length * 9)}s linear infinite ${r % 2 ? "reverse" : ""}` }}
            >
              {loop.map((f, i) => (
                <Quote key={`${f.id}-${i}`} f={f} sampleLabel={t.sample} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FeedbackForm({ t }: { t: FeedbackText }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(submitFeedback, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setDone(true);
      formRef.current?.reset();
      setRating(0);
    }
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rating", String(rating || ""));
    startTransition(() => action(fd));
  };

  const shown = hover || rating;

  if (done) {
    return (
      <div className="flex min-h-[420px] animate-pop flex-col items-center justify-center rounded-[24px] border border-line bg-surface p-8 text-center shadow-lift">
        <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-brand text-on-brand">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-30" />
          <svg viewBox="0 0 20 20" className="relative size-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 10.5 8.5 14 15 6.5" />
          </svg>
        </span>
        <p className="mt-6 text-2xl font-semibold tracking-tight">{t.thanks}</p>
        <p className="mt-2 max-w-xs text-muted">{t.thanksSub}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setDone(false)}>
          {t.another}
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-[24px] border border-line bg-surface p-6 shadow-lift sm:p-8">
      <h3 className="text-2xl font-semibold tracking-tight">{t.formTitle}</h3>
      <p className="mt-1 text-[15px] text-muted">{t.formSub}</p>
      {state.error && (
        <div className="mt-4">
          <Alert>{state.error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <span id="rating-label" className="block text-sm font-medium">
          {t.rating}
        </span>
        <div role="radiogroup" aria-labelledby="rating-label" className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} — ${t.ratingLabels[i - 1]}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(0)}
              onClick={() => setRating(i)}
              className="rounded-lg p-1 transition-transform duration-200 hover:scale-125 active:scale-90"
            >
              <svg
                viewBox="0 0 20 20"
                className={cx("size-8 transition-colors duration-200", i <= shown ? "text-sun drop-shadow-[0_2px_6px_rgb(233_150_46/0.45)]" : "text-line-strong")}
                fill="currentColor"
                aria-hidden
              >
                <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
              </svg>
            </button>
          ))}
          <span key={shown} className="ml-2 animate-fade text-sm font-medium text-muted">
            {shown ? t.ratingLabels[shown - 1] : ""}
          </span>
        </div>
        {fe.rating && !rating && (
          <p role="alert" className="mt-1.5 text-[13px] text-danger">
            {fe.rating[0]}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <Field label={t.message} htmlFor="fb-message" errors={fe.message}>
          <textarea
            id="fb-message"
            name="message"
            rows={4}
            maxLength={500}
            placeholder={t.messagePlaceholder}
            className={cx(
              "block w-full resize-none rounded-xl border bg-surface px-3.5 py-3 text-[15px] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/60",
              fe.message ? "border-danger" : "border-line-strong hover:border-ink/25 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_15%,transparent)]",
            )}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name} htmlFor="fb-name">
            <Input id="fb-name" name="name" maxLength={40} autoComplete="given-name" />
          </Field>
          <Field label={t.city} htmlFor="fb-city">
            <Input id="fb-city" name="city" maxLength={40} />
          </Field>
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      </div>

      <Button type="submit" pending={pending} className="mt-6 w-full min-h-12 text-base">
        {pending ? t.sending : t.submit}
      </Button>
    </form>
  );
}
