import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth/server";
import { pendingFeedbackCount } from "@/lib/feedback/service";
import { getDict } from "@/lib/i18n";
import { staffNav } from "@/lib/nav";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [session, { lang, t }, pending] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), pendingFeedbackCount().catch(() => 0)]);
  return (
    <>
      <AppHeader session={session} lang={lang} nav={staffNav(session.role, t, pending)} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
