import { ButtonLink, Logo } from "@/components/ui";
import { getLang } from "@/lib/i18n";

const TEXT = {
  en: { title: "Page not found", body: "The link may be old or mistyped.", home: "Go to home" },
  hi: { title: "पेज नहीं मिला", body: "लिंक पुराना हो सकता है या उसमें कोई ग़लती है।", home: "होम पर जाएँ" },
};

export default async function NotFound() {
  const t = TEXT[await getLang()];
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm animate-rise flex-col justify-center px-5">
      <Logo />
      <p className="num mt-8 text-6xl font-semibold tracking-tight text-line-strong">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-muted">{t.body}</p>
      <ButtonLink href="/" variant="secondary" className="mt-6 self-start">
        {t.home}
      </ButtonLink>
    </main>
  );
}
