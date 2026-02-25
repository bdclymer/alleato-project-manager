"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { contractCOsModule } from "@/lib/modules";

export default function ContractCOsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={contractCOsModule} projectId={id} />;
}
