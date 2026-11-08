import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

type Variant = "primary" | "secondary" | "ghost";
const buttonBase =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-xl px-5 min-h-11 text-[15px] font-medium transition-[background-color,box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none";
const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-brand text-on-brand shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-6px_rgb(31_95_69/0.6)] hover:bg-brand-hover hover:shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_10px_22px_-8px_rgb(31_95_69/0.7)]",
  secondary: "bg-surface text-ink border border-line-strong shadow-soft hover:border-ink/30",
  ghost: "text-ink hover:bg-line/60",
};

export function Spinner({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cx("size-4 animate-spin", className)} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  pending,
  disabled,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; pending?: boolean }) {
  return (
    <button
      {...props}
      className={cx(buttonBase, buttonVariants[variant], className)}
      aria-busy={pending || undefined}
      disabled={pending || disabled}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, interactive, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface shadow-soft",
        interactive &&
          "transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
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
        <p id={errorId} role="alert" className="animate-fade text-[13px] text-danger">
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
        "block w-full min-h-12 rounded-xl border bg-surface px-3.5 text-[15px] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/60",
        invalid
          ? "border-danger focus:shadow-[0_0_0_4px_rgb(180_35_24/0.12)]"
          : "border-line-strong hover:border-ink/25 focus:border-brand focus:shadow-[0_0_0_4px_rgb(31_95_69/0.12)]",
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
        "animate-pop rounded-xl px-3.5 py-2.5 text-sm",
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

export function ScoreBadge({
  score,
  labels,
}: {
  score: keyof typeof scoreStyles | null;
  labels?: { HIGH: string; MEDIUM: string; LOW: string; none: string };
}) {
  if (!score) return <span className="text-sm text-muted">{labels?.none ?? "Not scored"}</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium", scoreStyles[score])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {labels?.[score] ?? scoreLabels[score]}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="dots flex animate-rise flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-16 text-center">
      <span aria-hidden className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-sun-soft">
        <SunMark className="size-6" />
      </span>
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SunMark({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <g className={cx(spin && "origin-center animate-spin-slow")}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="11.2" y="1.2" width="1.6" height="3.6" rx=".8" fill="var(--color-sun)" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="4.6" fill="var(--color-sun)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
      <span className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-45">
        <SunMark className="size-[22px]" />
      </span>
      Rooftop Solar
    </Link>
  );
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
