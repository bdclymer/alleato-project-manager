"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { warrantiesModule } from "@/lib/modules";

export default function WarrantiesPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={warrantiesModule} projectId={id} />;
}
