import { redirect } from "next/navigation";

/** Orphan mock CRUD retired — Admin Settings is the single place for team management. */
export default function AdminsRedirectPage() {
  redirect("/dashboard/admin-settings");
}
