"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { DocumentList, type DocItem } from "@/components/document-list";
import { Alert, Button, Field, Input } from "@/components/ui";
import { ACCEPTED_BILL_TYPES } from "@/lib/files";
import { uploadProjectDocument, type StaffFormState } from "../../actions";

export function ProjectDocuments({
  projectId,
  initial,
  text,
}: {
  projectId: string;
  initial: DocItem[];
  text: { docsNone: string; docTitle: string; docTitlePlaceholder: string; docFile: string; docFileHint: string; upload: string; uploading: string };
}) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(uploadProjectDocument.bind(null, projectId), {});
  const [docs, setDocs] = useState(initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const doc = state.doc;
    if (!doc) return;
    setDocs((list) => (list.some((d) => d.id === doc.id) ? list : [doc, ...list]));
    ref.current?.reset();
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <DocumentList docs={docs} empty={text.docsNone} />
      <form ref={ref} action={action} className="mt-4 space-y-3 border-t border-line pt-4">
        {state.ok && <Alert tone="info">{state.ok}</Alert>}
        {state.error && <Alert>{state.error}</Alert>}
        <Field label={text.docTitle} htmlFor="docTitle" errors={fe.title}>
          <Input id="docTitle" name="title" maxLength={80} placeholder={text.docTitlePlaceholder} />
        </Field>
        <Field label={text.docFile} htmlFor="docFile" hint={text.docFileHint} errors={fe.file}>
          <Input id="docFile" name="file" type="file" accept={ACCEPTED_BILL_TYPES} />
        </Field>
        <Button type="submit" variant="secondary" pending={pending} className="w-full">
          {pending ? text.uploading : text.upload}
        </Button>
      </form>
    </>
  );
}
