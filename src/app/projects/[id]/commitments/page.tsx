"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { commitmentsModule } from "@/lib/modules";

export default function CommitmentsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={commitmentsModule} projectId={id} />;
}
