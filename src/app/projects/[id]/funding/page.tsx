"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { fundingModule } from "@/lib/modules";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={fundingModule} projectId={id} />;
}
