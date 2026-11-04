import { ButtonLink, Logo } from "@/components/ui";
import { getSession } from "@/lib/auth/server";
import { homeFor } from "@/lib/auth/session";

const STEPS = [
  { n: "1", title: "Tell us about your home", body: "Owner or tenant, roof size and your monthly bill. Two minutes." },
  { n: "2", title: "Upload your electricity bill", body: "We read it for you and suggest the right system size." },
  { n: "3", title: "Get your quote the same day", body: "System size, cost after subsidy and payback — in plain numbers." },
];

export default async function Home() {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        {session ? (
          <ButtonLink href={homeFor(session.role)} variant="secondary">Open dashboard</ButtonLink>
        ) : (
          <ButtonLink href="/login" variant="ghost">Sign in</ButtonLink>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8">
        <section className="max-w-2xl pb-14 pt-12 sm:pt-20">
          <p className="text-sm font-medium text-brand">Rooftop solar across Vidarbha</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Is solar worth it for your home?
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Answer a few questions and upload your bill. We&apos;ll tell you the right system size, what the
            government subsidy covers, and how fast it pays for itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup">Check my home</ButtonLink>
            <ButtonLink href="/login" variant="secondary">Track my project</ButtonLink>
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-line py-12">
          <h2 id="how" className="text-sm font-medium text-muted">How it works</h2>
          <ol className="mt-6 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="num inline-flex size-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                  {s.n}
                </span>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-muted sm:px-8">
        Demo project. All names and numbers are fictional.
      </footer>
    </div>
  );
}
