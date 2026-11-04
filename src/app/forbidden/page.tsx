import { ButtonLink, Logo } from "@/components/ui";

export const metadata = { title: "No access" };

export default function Forbidden() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-muted">This area is for a different kind of account.</p>
      <ButtonLink href="/" variant="secondary" className="mt-6 self-start">Go to home</ButtonLink>
    </main>
  );
}
