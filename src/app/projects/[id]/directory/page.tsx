"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { projectDirectoryModule } from "@/lib/modules";

export default function DirectoryPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={projectDirectoryModule} projectId={id} />;
}
