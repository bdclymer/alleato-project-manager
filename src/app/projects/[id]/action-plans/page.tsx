"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { actionPlansModule } from "@/lib/modules";

export default function ActionPlansPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={actionPlansModule} projectId={id} />;
}
