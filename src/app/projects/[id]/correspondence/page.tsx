"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { correspondenceModule } from "@/lib/modules";

export default function CorrespondencePage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={correspondenceModule} projectId={id} />;
}
