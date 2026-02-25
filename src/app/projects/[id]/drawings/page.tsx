"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { drawingsModule } from "@/lib/modules";

export default function DrawingsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={drawingsModule} projectId={id} />;
}
