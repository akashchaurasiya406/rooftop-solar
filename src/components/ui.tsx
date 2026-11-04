// Small shared UI kit. Every screen uses these so the design stays consistent.

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost";
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 min-h-11 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-paper",
  ghost: "text-ink hover:bg-line/60",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-[var(--radius-card)] border border-line bg-surface", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !errors?.length && <p className="text-[13px] text-muted">{hint}</p>}
      {errors?.length ? (
        <p id={errorId} role="alert" className="text-[13px] text-danger">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx(
        "block w-full min-h-11 rounded-lg border bg-surface px-3 text-[15px] placeholder:text-muted/70",
        invalid ? "border-danger" : "border-line-strong focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "rounded-lg px-3.5 py-2.5 text-sm",
        tone === "danger" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
      )}
    >
      {children}
    </div>
  );
}

const scoreStyles = {
  HIGH: "bg-high-soft text-high",
  MEDIUM: "bg-medium-soft text-medium",
  LOW: "bg-low-soft text-low",
} as const;
const scoreLabels = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" } as const;

export function ScoreBadge({ score }: { score: keyof typeof scoreStyles | null }) {
  if (!score) return <span className="text-sm text-muted">Not scored</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium", scoreStyles[score])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {scoreLabels[score]}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.5" fill="var(--color-brand)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="11.25" y="1.5" width="1.5" height="3.5" rx=".75" fill="var(--color-brand)" transform={`rotate(${a} 12 12)`} />
        ))}
      </svg>
      Rooftop Solar
    </Link>
  );
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
