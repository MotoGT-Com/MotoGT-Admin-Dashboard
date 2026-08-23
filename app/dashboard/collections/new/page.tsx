"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CollectionEditor } from "@/components/collections/collection-editor";
import { LoadingState } from "@/components/loading-state";
import type { CollectionType } from "@/lib/domain/collections";

function parseType(value: string | null): CollectionType {
  return value === "automated" ? "automated" : "manual";
}

function NewCollectionContent() {
  const searchParams = useSearchParams();
  const type = useMemo(
    () => parseType(searchParams.get("type")),
    [searchParams],
  );

  return <CollectionEditor mode="create" initialType={type} />;
}

export default function NewCollectionPage() {
  return (
    <Suspense
      fallback={<LoadingState variant="full" label="Loading editor…" />}
    >
      <NewCollectionContent />
    </Suspense>
  );
}
