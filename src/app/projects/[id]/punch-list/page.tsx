"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { punchListModule } from "@/lib/modules";

export default function PunchListPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={punchListModule} projectId={id} />;
}
