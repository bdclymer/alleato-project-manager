"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { submittalsModule } from "@/lib/modules";

export default function SubmittalsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={submittalsModule} projectId={id} />;
}
