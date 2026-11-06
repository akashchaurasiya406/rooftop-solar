import type { Role } from "@/lib/auth/session";

export function staffNav(role: Role) {
  const items = [
    { href: "/sales", label: "Leads" },
    { href: "/sales/projects", label: "Projects" },
  ];
  if (role === "ADMIN") items.push({ href: "/admin/rules", label: "Rules" });
  return items;
}
