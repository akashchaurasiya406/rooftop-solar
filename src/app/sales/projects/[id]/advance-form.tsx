"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { moveStage, type StaffFormState } from "../../actions";

export function AdvanceForm({ projectId, to, label }: { projectId: string; to: string; label: string }) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(moveStage.bind(null, projectId, to), {});
  return (
    <form action={action} className="space-y-3">
      {state.ok && <Alert tone="info">{state.ok}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Note (optional)" htmlFor="note" hint="Shown in the timeline, not to the customer.">
        <Input id="note" name="note" maxLength={300} placeholder="e.g. Inverter serial 4K-2231" />
      </Field>
      <Button type="submit" pending={pending} className="w-full">
        {pending ? "Updating…" : `Mark as "${label}"`}
      </Button>
    </form>
  );
}
