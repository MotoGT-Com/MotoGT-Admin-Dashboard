import { redirect } from "next/navigation";

export default async function InStoreCustomerProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/customers/${id}`);
}
