"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { meetingsModule } from "@/lib/modules";

export default function MeetingsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={meetingsModule} projectId={id} />;
}
