"use client";

import { useActionState, useState } from "react";
import { Alert, Button, inr } from "@/components/ui";
import { acceptQuoteAction, type AcceptState } from "../../actions";

export function AcceptQuote({
  quoteId,
  leadId,
  advance,
  text,
}: {
  quoteId: string;
  leadId: string;
  advance: number;
  text: { agreeA: string; agreeB: string; testMode: string; accept: string; confirming: string };
}) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptQuoteAction.bind(null, quoteId, leadId), {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/60 p-4 text-[15px]">
        <input type="checkbox" name="agree" className="mt-1 size-5 shrink-0 accent-[var(--color-brand)]" />
        <span>
          {text.agreeA} <span className="num font-semibold">{inr(advance)}</span> {text.agreeB}
          <span className="mt-1 block text-[13px] text-muted">{text.testMode}</span>
        </span>
      </label>
      <Button type="submit" pending={pending} className="min-h-12 w-full text-base">
        {pending ? text.confirming : text.accept}
      </Button>
    </form>
  );
}

export function CopyLink({ url, copy, copied }: { url: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(url);
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
      className="rounded-lg px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft active:scale-95"
    >
      {done ? copied : copy}
    </button>
  );
}
