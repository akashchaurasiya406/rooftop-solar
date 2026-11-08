import type { en } from "@/lib/i18n/en";

export type ErrorCode = keyof typeof en.staff.errors;

export class CodedError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function errorText(errors: Record<ErrorCode, string>, e: unknown): string | null {
  if (e instanceof CodedError) return errors[e.code] ?? e.message;
  return null;
}
