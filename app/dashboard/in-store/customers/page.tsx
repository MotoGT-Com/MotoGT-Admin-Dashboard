import { redirect } from "next/navigation";

export default function InStoreCustomersRedirect() {
  redirect("/dashboard/customers");
}
