"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { primeContractsModule } from "@/lib/modules";

export default function PrimeContractsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={primeContractsModule} projectId={id} />;
}
