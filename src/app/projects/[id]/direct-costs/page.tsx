"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { directCostsModule } from "@/lib/modules";

export default function DirectCostsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={directCostsModule} projectId={id} />;
}
