import type { Metadata } from "next";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { LeadForm } from "./lead-form";

export const metadata: Metadata = { title: "Check my home" };

export default async function NewLeadPage() {
  const { t } = await getDict();
  return (
    <>
      <Link href="/my" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> {t.common.myRequests}
      </Link>
      <div className="mt-4 animate-rise">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-tight">{t.form.title}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t.form.sub}</p>
      </div>
      <div className="mt-8">
        <LeadForm t={t.form} />
      </div>
    </>
  );
}
