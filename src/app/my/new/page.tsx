import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "./lead-form";

export const metadata: Metadata = { title: "Check my home" };

export default function NewLeadPage() {
  return (
    <>
      <Link href="/my" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> My requests
      </Link>
      <div className="mt-4 animate-rise">
        <h1 className="text-[1.75rem] font-semibold tracking-tight">Is solar right for your home?</h1>
        <p className="mt-1.5 text-[15px] text-muted">Two quick steps. We&apos;ll read your bill and suggest a system size.</p>
      </div>
      <div className="mt-8">
        <LeadForm />
      </div>
    </>
  );
}
