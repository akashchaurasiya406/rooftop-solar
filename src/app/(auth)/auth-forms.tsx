"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type ComponentProps } from "react";
import { Alert, Button, cx, Field, Input } from "@/components/ui";
import type { en } from "@/lib/i18n/en";
import { login, signup, type FormState } from "./actions";

type AuthText = typeof en.auth;

function PasswordInput({ show, hide, ...props }: ComponentProps<typeof Input> & { show: string; hide: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-20" />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-controls={props.id}
        className="absolute inset-y-1.5 right-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-line/60 hover:text-ink"
      >
        {shown ? hide : show}
      </button>
    </div>
  );
}

export interface DemoAccount {
  role: string;
  email: string;
}

export function LoginForm({
  next,
  demo,
  t,
  signInLabel,
}: {
  next?: string;
  demo?: { accounts: DemoAccount[]; password: string };
  t: AuthText;
  signInLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const fillDemo = (email: string) => {
    const form = formRef.current;
    if (!form || !demo) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = email;
    (form.elements.namedItem("password") as HTMLInputElement).value = demo.password;
    setPicked(email);
  };

  return (
    <>
      <form ref={formRef} action={action} className="space-y-4" noValidate>
        {state.error && <Alert>{state.error}</Alert>}
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t.email} htmlFor="email" errors={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} invalid={!!fe.email} aria-describedby="email-error" />
        </Field>
        <Field label={t.password} htmlFor="password" errors={fe.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" required invalid={!!fe.password} aria-describedby="password-error" show={t.show} hide={t.hide} />
        </Field>
        <Button type="submit" className="w-full" pending={pending}>
          {pending ? t.signingIn : signInLabel}
        </Button>
        <p className="text-center text-sm text-muted">
          {t.newHere}{" "}
          <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">
            {t.createAccount}
          </Link>
        </p>
      </form>

      {demo && (
        <section aria-labelledby="demo-title" className="mt-8 rounded-2xl border border-dashed border-line-strong p-4">
          <h2 id="demo-title" className="text-[13px] font-medium text-muted">
            {t.demoTitle}
          </h2>
          <div className="mt-3 grid gap-2">
            {demo.accounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 active:scale-[0.98]",
                  picked === a.email ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-ink/25",
                )}
              >
                <span className="font-medium">{a.role}</span>
                <span className="truncate text-[13px] text-muted">{a.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[13px] text-muted">
            {t.passwordForAll} <code className="text-ink">{demo.password}</code>
          </p>
        </section>
      )}
    </>
  );
}

export function SignupForm({ t, signInLabel }: { t: AuthText; signInLabel: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      <Field label={t.fullName} htmlFor="name" errors={fe.name}>
        <Input id="name" name="name" autoComplete="name" required defaultValue={v.name} invalid={!!fe.name} />
      </Field>
      <Field label={t.mobile} htmlFor="phone" errors={fe.phone} hint={t.mobileHint}>
        <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="98XXXXXXXX" defaultValue={v.phone} invalid={!!fe.phone} />
      </Field>
      <Field label={t.email} htmlFor="email" errors={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} invalid={!!fe.email} />
      </Field>
      <Field label={t.password} htmlFor="password" errors={fe.password} hint={t.passwordHint}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required invalid={!!fe.password} show={t.show} hide={t.hide} />
      </Field>
      <Button type="submit" className="w-full" pending={pending}>
        {pending ? t.creating : t.createAccount}
      </Button>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          {signInLabel}
        </Link>
      </p>
    </form>
  );
}
