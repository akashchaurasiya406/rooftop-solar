"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BillPicker } from "@/components/bill-picker";
import { Alert, Button } from "@/components/ui";
import { reuploadBill, type ReuploadState } from "../../actions";

export function ReuploadForm({ leadId }: { leadId: string }) {
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
        error={missing ? "Please add a new photo of your bill." : undefined}
        showSamples
      />
      <Button type="submit" pending={pending} className="w-full">
        {pending ? "Reading your bill…" : "Send new photo"}
      </Button>
    </form>
  );
}
