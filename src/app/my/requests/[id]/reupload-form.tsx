"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BillPicker } from "@/components/bill-picker";
import { Alert, Button } from "@/components/ui";
import type { en } from "@/lib/i18n/en";
import { reuploadBill, type ReuploadState } from "../../actions";

export function ReuploadForm({
  leadId,
  text,
  picker,
}: {
  leadId: string;
  text: { send: string; sending: string; missing: string };
  picker: typeof en.form.picker;
}) {
  const [state, formAction, pending] = useActionState<ReuploadState, FormData>(reuploadBill.bind(null, leadId), {});
  const [file, setFile] = useState<File | null>(null);
  const [missing, setMissing] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setMissing(true);
    const fd = new FormData();
    fd.set("bill", file);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <BillPicker
        file={file}
        onChange={(f) => {
          setFile(f);
          setMissing(false);
        }}
        error={missing ? text.missing : undefined}
        text={picker}
      />
      <Button type="submit" pending={pending} className="w-full">
        {pending ? text.sending : text.send}
      </Button>
    </form>
  );
}
