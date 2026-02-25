"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { timesheetsModule } from "@/lib/modules";

export default function TimesheetsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={timesheetsModule} projectId={id} />;
}
