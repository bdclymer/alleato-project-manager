"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { commitmentCOsModule } from "@/lib/modules";

export default function CommitmentCOsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={commitmentCOsModule} projectId={id} />;
}
