"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { coordinationIssuesModule } from "@/lib/modules";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={coordinationIssuesModule} projectId={id} />;
}
