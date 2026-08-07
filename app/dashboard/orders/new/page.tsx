"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChannelOrderForm,
  type OrderEntryChannel,
} from "@/components/orders/channel-order-form";

function parseChannel(value: string | null): OrderEntryChannel {
  if (value === "whatsapp") return "whatsapp";
  return "in_store";
}

function NewOrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = useMemo(
    () => parseChannel(searchParams.get("channel")),
    [searchParams]
  );

  const setChannel = useCallback(
    (next: string) => {
      const parsed = parseChannel(next);
      router.replace(`/dashboard/orders/new?channel=${parsed}`);
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Order</h1>
        <p className="text-muted-foreground mt-1">
          Create an Offline (in-store) or WhatsApp order for a customer.
        </p>
      </div>

      <Tabs value={channel} onValueChange={setChannel}>
        <TabsList>
          <TabsTrigger value="in_store">Offline</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="in_store" className="mt-6">
          <ChannelOrderForm
            key="in_store"
            channel="in_store"
            showTitle={false}
          />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6">
          <ChannelOrderForm
            key="whatsapp"
            channel="whatsapp"
            showTitle={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      }
    >
      <NewOrderPageContent />
    </Suspense>
  );
}
