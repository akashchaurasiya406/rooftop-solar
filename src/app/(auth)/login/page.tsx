import type { Metadata } from "next";
import { safeNext } from "@/lib/auth/validation";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Sign in" };

const DEMO_ACCOUNTS = [
  { role: "Sales staff", email: "sales@demo.solar" },
  { role: "Sales manager", email: "manager@demo.solar" },
  { role: "Homeowner", email: "homeowner@demo.solar" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const showDemo = process.env.DEMO_MODE !== "false";
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 mb-7 text-[15px] text-muted">Track your solar project or manage leads.</p>
      <LoginForm next={safeNext(next) ?? undefined} />

      {showDemo && (
        <details className="mt-8 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Demo accounts</summary>
          <ul className="mt-3 space-y-1.5 text-muted">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex justify-between gap-3">
                <span>{a.role}</span>
                <code className="text-ink">{a.email}</code>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted">
            Password for all: <code className="text-ink">Demo@1234</code>
          </p>
        </details>
      )}
    </>
  );
}
