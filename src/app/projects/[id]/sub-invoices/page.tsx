"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { subInvoicesModule } from "@/lib/modules";

export default function SubInvoicesPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={subInvoicesModule} projectId={id} />;
}
