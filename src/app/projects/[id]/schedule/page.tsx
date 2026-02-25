"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { scheduleModule } from "@/lib/modules";

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={scheduleModule} projectId={id} />;
}
