"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { emailsModule } from "@/lib/modules";

export default function EmailsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={emailsModule} projectId={id} />;
}
