"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { changeEventsModule } from "@/lib/modules";

export default function ChangeEventsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={changeEventsModule} projectId={id} />;
}
