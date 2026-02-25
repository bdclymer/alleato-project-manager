"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { inspectionsModule } from "@/lib/modules";

export default function InspectionsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={inspectionsModule} projectId={id} />;
}
