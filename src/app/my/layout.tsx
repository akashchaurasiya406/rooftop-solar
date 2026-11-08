import { AppHeader } from "@/components/app-header";
import { LanguageToggle } from "@/components/language-toggle";
import { requireRole } from "@/lib/auth/server";
import { getDict } from "@/lib/i18n";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const [session, { lang, t }] = await Promise.all([requireRole("HOMEOWNER"), getDict()]);
  return (
    <div className="dawn min-h-dvh">
      <AppHeader session={session} lang={lang} nav={[{ href: "/my", label: t.common.myRequests }]} />
      <div className="mx-auto flex max-w-2xl justify-end px-4 pt-4 sm:hidden">
        <LanguageToggle lang={lang} />
      </div>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
