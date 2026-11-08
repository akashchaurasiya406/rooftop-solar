import { ButtonLink, Logo } from "@/components/ui";
import { getLang } from "@/lib/i18n";

export const metadata = { title: "No access" };

const TEXT = {
  en: { title: "You don't have access to this page", body: "This area is for a different kind of account.", home: "Go to home" },
  hi: { title: "आपको इस पेज तक पहुँच नहीं है", body: "यह हिस्सा किसी दूसरे तरह के खाते के लिए है।", home: "होम पर जाएँ" },
  mr: { title: "तुम्हाला या पानावर प्रवेश नाही", body: "हा भाग वेगळ्या प्रकारच्या खात्यासाठी आहे.", home: "मुख्य पानावर जा" },
};

export default async function Forbidden() {
  const t = TEXT[await getLang()];
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm animate-rise flex-col justify-center px-5">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-muted">{t.body}</p>
      <ButtonLink href="/" variant="secondary" className="mt-6 self-start">
        {t.home}
      </ButtonLink>
    </main>
  );
}
