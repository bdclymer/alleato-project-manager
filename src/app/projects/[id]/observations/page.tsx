"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { observationsModule } from "@/lib/modules";

export default function ObservationsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={observationsModule} projectId={id} />;
}
