import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth/server";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SALES", "ADMIN");
  return (
    <>
      <AppHeader session={session} nav={[{ href: "/sales", label: "Leads" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
