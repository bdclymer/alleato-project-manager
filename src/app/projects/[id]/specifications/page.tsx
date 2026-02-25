"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { specificationsModule } from "@/lib/modules";

export default function SpecificationsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={specificationsModule} projectId={id} />;
}
