"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { keepValues } from "@/components/keep-values";
import { Alert, Button, Field, Input } from "@/components/ui";
import { moveStage, type StaffFormState } from "../../actions";

export function AdvanceForm({
  projectId,
  to,
  text,
}: {
  projectId: string;
  to: string;
  text: { note: string; noteHint: string; notePlaceholder: string; mark: string; updating: string };
}) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(moveStage.bind(null, projectId, to), {});
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);
  return (
    <form onSubmit={keepValues(action)} className="space-y-3">
      {state.ok && <Alert tone="info">{state.ok}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <Field label={text.note} htmlFor="note" hint={text.noteHint}>
        <Input id="note" name="note" maxLength={300} placeholder={text.notePlaceholder} />
      </Field>
      <Button type="submit" pending={pending} className="group w-full">
        {pending ? text.updating : text.mark}
        {!pending && (
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        )}
      </Button>
    </form>
  );
}
