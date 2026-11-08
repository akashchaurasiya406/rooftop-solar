import type { Role } from "@/lib/auth/session";
import type { Dict } from "@/lib/i18n/en";

export function staffNav(role: Role, t: Dict, pendingFeedback = 0) {
  const items: { href: string; label: string; badge?: number }[] = [
    { href: "/sales", label: t.staff.nav.leads },
    { href: "/sales/projects", label: t.staff.nav.projects },
    { href: "/sales/feedback", label: t.staff.nav.feedback, badge: pendingFeedback || undefined },
  ];
  if (role === "ADMIN") items.push({ href: "/admin/rules", label: t.staff.nav.rules });
  return items;
}
