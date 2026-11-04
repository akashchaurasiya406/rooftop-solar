"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { login, signup, type FormState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" htmlFor="email" errors={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required
          defaultValue={state.values?.email} invalid={!!fe.email} aria-describedby="email-error" />
      </Field>
      <Field label="Password" htmlFor="password" errors={fe.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required
          invalid={!!fe.password} aria-describedby="password-error" />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Full name" htmlFor="name" errors={fe.name}>
        <Input id="name" name="name" autoComplete="name" required defaultValue={v.name} invalid={!!fe.name} />
      </Field>
      <Field label="Mobile number" htmlFor="phone" errors={fe.phone} hint="We'll send project updates here.">
        <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" required
          placeholder="98XXXXXXXX" defaultValue={v.phone} invalid={!!fe.phone} />
      </Field>
      <Field label="Email" htmlFor="email" errors={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} invalid={!!fe.email} />
      </Field>
      <Field label="Password" htmlFor="password" errors={fe.password} hint="At least 8 characters, with a letter and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={!!fe.password} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
