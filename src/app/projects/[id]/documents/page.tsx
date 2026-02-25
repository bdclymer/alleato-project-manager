"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { documentsModule } from "@/lib/modules";

export default function DocumentsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={documentsModule} projectId={id} />;
}
