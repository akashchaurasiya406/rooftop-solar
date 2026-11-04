import type { Metadata } from "next";
import { safeNext } from "@/lib/auth/validation";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Sign in" };

const DEMO = {
  password: "Demo@1234",
  accounts: [
    { role: "Sales staff", email: "sales@demo.solar" },
    { role: "Sales manager", email: "manager@demo.solar" },
    { role: "Homeowner", email: "homeowner@demo.solar" },
  ],
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const showDemo = process.env.DEMO_MODE !== "false";
  return (
    <>
      <h1 className="text-[1.75rem] font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 mb-8 text-[15px] text-muted">Sign in to track your solar project or manage leads.</p>
      <LoginForm next={safeNext(next) ?? undefined} demo={showDemo ? DEMO : undefined} />
    </>
  );
}
