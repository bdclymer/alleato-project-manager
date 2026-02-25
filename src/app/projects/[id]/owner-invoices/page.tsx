"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { ownerInvoicesModule } from "@/lib/modules";

export default function OwnerInvoicesPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={ownerInvoicesModule} projectId={id} />;
}
