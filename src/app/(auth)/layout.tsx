import { SolarIllustration } from "@/components/solar-illustration";
import { Logo } from "@/components/ui";

const POINTS = [
  "Know in minutes if solar suits your home",
  "Quote with subsidy and payback the same day",
  "Follow your installation step by step",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col">
        <header className="animate-fade px-5 py-5 sm:px-8">
          <Logo />
        </header>
        <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:items-center sm:pt-0">
          <div className="w-full max-w-sm animate-rise">{children}</div>
        </main>
      </div>

      <aside aria-hidden className="dawn relative hidden overflow-hidden border-l border-line lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="dots absolute inset-0 opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <div className="relative mx-auto w-full max-w-md">
          <SolarIllustration className="w-full animate-[pop_0.8s_var(--ease-out-soft)_0.1s_both]" />
          <ul className="stagger mt-8 space-y-3">
            {POINTS.map((p, i) => (
              <li key={p} style={{ "--i": i + 3 } as React.CSSProperties} className="flex items-center gap-3 text-[15px]">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 10.5 8.5 14 15 6.5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
