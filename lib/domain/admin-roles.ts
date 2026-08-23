/**
 * Fixed dashboard access roles.
 */

export type AdminRole = "super_admin" | "admin" | "store_staff";

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "store_staff",
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  store_staff: "Store Staff",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access, including managing admins.",
  admin: "Full access except Admin Settings.",
  store_staff: "Dashboard, Orders, and Customers only.",
};

/** Counter tools only — matches Operations subset for Store Staff. */
export const STORE_STAFF_HREFS = new Set([
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/customers",
]);

export const ADMIN_SETTINGS_HREF = "/dashboard/admin-settings";

/** Stub pages — Super Admin only until shipped. */
export const COMING_SOON_HREFS = new Set([
  "/dashboard/collections",
  "/dashboard/discounts",
  "/dashboard/cms",
  "/dashboard/newsletter",
]);

/** Normalize login/JWT role strings into AdminRole (legacy `admin` stays `admin`). */
export function normalizeAdminRole(
  role: string | null | undefined,
): AdminRole | null {
  if (!role) return null;
  const value = role.toLowerCase();
  if (value === "super_admin" || value === "superadmin") return "super_admin";
  if (value === "store_staff" || value === "storestaff") return "store_staff";
  if (value === "admin") return "admin";
  return null;
}

export function canAccessAdminSettings(role: AdminRole): boolean {
  return role === "super_admin";
}

export function canAccessComingSoonPages(role: AdminRole): boolean {
  return role === "super_admin";
}

export function isComingSoonHref(href: string): boolean {
  return [...COMING_SOON_HREFS].some(
    (path) => href === path || href.startsWith(`${path}/`),
  );
}

export function canAccessHref(role: AdminRole, href: string): boolean {
  if (role === "super_admin") return true;

  if (isComingSoonHref(href)) return false;

  if (role === "admin") {
    return (
      href !== ADMIN_SETTINGS_HREF &&
      !href.startsWith(`${ADMIN_SETTINGS_HREF}/`)
    );
  }

  // store_staff
  if (href === "/dashboard") return true;
  return [...STORE_STAFF_HREFS].some(
    (allowed) =>
      allowed !== "/dashboard" &&
      (href === allowed || href.startsWith(`${allowed}/`)),
  );
}

export function adminRoleLabel(role: AdminRole | string): string {
  return ADMIN_ROLE_LABELS[role as AdminRole] ?? role;
}

export function countSuperAdmins(
  admins: Array<{ role: AdminRole }>,
): number {
  return admins.filter((a) => a.role === "super_admin").length;
}

export function isLastSuperAdmin(
  admins: Array<{ id: string; role: AdminRole }>,
  adminId: string,
): boolean {
  const target = admins.find((a) => a.id === adminId);
  if (!target || target.role !== "super_admin") return false;
  return countSuperAdmins(admins) <= 1;
}
