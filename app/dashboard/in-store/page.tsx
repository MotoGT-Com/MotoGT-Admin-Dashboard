import { redirect } from "next/navigation";

export default function InStoreNewSaleRedirect() {
  redirect("/dashboard/orders/new?channel=in_store");
}
