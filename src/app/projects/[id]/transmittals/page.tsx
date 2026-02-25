"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { transmittalsModule } from "@/lib/modules";

export default function TransmittalsPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={transmittalsModule} projectId={id} />;
}
