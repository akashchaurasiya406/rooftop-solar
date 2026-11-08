import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { SignupForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const { t } = await getDict();
  return (
    <>
      <h1 className="text-[2rem] font-semibold tracking-tight">{t.auth.createTitle}</h1>
      <p className="mb-8 mt-1.5 text-[15px] text-muted">{t.auth.createSub}</p>
      <SignupForm t={t.auth} signInLabel={t.common.signIn} />
    </>
  );
}
