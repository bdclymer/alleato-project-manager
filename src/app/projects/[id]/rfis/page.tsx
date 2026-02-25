"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { rfisModule } from "@/lib/modules";

export default function RFIsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={rfisModule} projectId={id} />;
}
