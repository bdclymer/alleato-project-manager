"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { photosModule } from "@/lib/modules";

export default function PhotosPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={photosModule} projectId={id} />;
}
