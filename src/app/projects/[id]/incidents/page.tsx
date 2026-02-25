"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { incidentsModule } from "@/lib/modules";

export default function IncidentsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={incidentsModule} projectId={id} />;
}
