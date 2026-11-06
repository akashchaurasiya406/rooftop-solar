import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth/server";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("HOMEOWNER");
  return (
    <div className="dawn min-h-dvh">
      <AppHeader session={session} nav={[{ href: "/my", label: "My requests" }]} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
