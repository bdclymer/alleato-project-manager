"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { projectBiddingModule } from "@/lib/modules";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={projectBiddingModule} projectId={id} />;
}
