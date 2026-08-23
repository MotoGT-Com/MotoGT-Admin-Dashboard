"use client";

import { useParams } from "next/navigation";
import { CollectionEditor } from "@/components/collections/collection-editor";

export default function CollectionEditPage() {
  const params = useParams();
  const id = params.id as string;

  return <CollectionEditor mode="edit" collectionId={id} />;
}
