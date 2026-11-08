import type { Metadata } from "next";
import { safeNext } from "@/lib/auth/validation";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }] = await Promise.all([searchParams, getDict()]);
  const showDemo = process.env.DEMO_MODE !== "false";
  const demo = {
    password: "Demo@1234",
    accounts: [
      { role: t.auth.roles.sales, email: "sales@demo.solar" },
      { role: t.auth.roles.manager, email: "manager@demo.solar" },
      { role: t.auth.roles.homeowner, email: "homeowner@demo.solar" },
    ],
  };
  return (
    <>
      <h1 className="text-[2rem] font-semibold tracking-tight">{t.auth.welcome}</h1>
      <p className="mb-8 mt-1.5 text-[15px] text-muted">{t.auth.welcomeSub}</p>
      <LoginForm next={safeNext(next) ?? undefined} demo={showDemo ? demo : undefined} t={t.auth} signInLabel={t.common.signIn} />
    </>
  );
}
