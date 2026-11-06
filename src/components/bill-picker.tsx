"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPTED_BILL_TYPES, MAX_UPLOAD_BYTES } from "@/lib/files";
import { cx } from "./ui";

const MAX_EDGE = 1800;

export async function shrinkImage(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const SAMPLES = [
  { label: "Clear sample", href: "/sample-bills/sample-bill-clear.jpg" },
  { label: "Blurry sample", href: "/sample-bills/sample-bill-blurry.jpg" },
];

export function BillPicker({
  file,
  onChange,
  error,
  showSamples = true,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  showSamples?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/") || file.type === "image/heic") {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = async (raw: File | undefined) => {
    setLocalError(null);
    if (!raw) return;
    setBusy(true);
    const f = await shrinkImage(raw);
    setBusy(false);
    if (f.size > MAX_UPLOAD_BYTES) {
      setLocalError("That file is larger than 4 MB. Please take a new photo or upload a smaller PDF.");
      onChange(null);
      return;
    }
    onChange(f);
  };

  const loadSample = async (href: string) => {
    setBusy(true);
    const blob = await (await fetch(href)).blob();
    setBusy(false);
    accept(new File([blob], href.split("/").pop()!, { type: blob.type || "image/jpeg" }));
  };

  const shownError = localError ?? error;

  return (
    <div>
      <input
        ref={inputRef}
        id="bill"
        type="file"
        accept={ACCEPTED_BILL_TYPES}
        className="sr-only"
        aria-describedby="bill-help bill-error"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {file ? (
        <div className="flex animate-pop items-center gap-4 rounded-2xl border border-line bg-surface p-3 shadow-soft">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper">
            {preview ? (
              <img src={preview} alt="Your bill" className="size-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted">{file.type === "application/pdf" ? "PDF" : "FILE"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="num text-[13px] text-muted">{Math.max(1, Math.round(file.size / 1024))} KB · ready to send</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft active:scale-95"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cx(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 active:scale-[0.99]",
            shownError ? "border-danger/60 bg-danger-soft/40" : "border-line-strong bg-surface hover:border-brand hover:bg-brand-soft/40",
          )}
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
          <span className="font-medium">{busy ? "Preparing photo…" : "Take a photo or choose a file"}</span>
          <span id="bill-help" className="text-[13px] text-muted">
            Your latest electricity bill · photo or PDF · up to 4 MB
          </span>
        </button>
      )}
      {shownError && (
        <p id="bill-error" role="alert" className="mt-2 animate-fade text-[13px] text-danger">
          {shownError}
        </p>
      )}
      {showSamples && (
        <p className="mt-3 text-[13px] text-muted">
          No bill to hand?{" "}
          {SAMPLES.map((s, i) => (
            <span key={s.href}>
              {i > 0 && " or "}
              <button type="button" onClick={() => loadSample(s.href)} className="font-medium text-brand underline-offset-4 hover:underline">
                {s.label}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
