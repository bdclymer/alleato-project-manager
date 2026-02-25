"use client";

import { CrudPage } from "@/components/CrudPage";
import { incidentsModule } from "@/lib/modules";

export default function IncidentsPage() {
  return <CrudPage config={incidentsModule} />;
}
