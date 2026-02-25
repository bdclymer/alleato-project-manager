"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { dailyLogsModule } from "@/lib/modules";

export default function DailyLogsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={dailyLogsModule} projectId={id} />;
}
