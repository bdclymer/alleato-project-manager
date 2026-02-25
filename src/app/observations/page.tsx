"use client";

import { CrudPage } from "@/components/CrudPage";
import { observationsModule } from "@/lib/modules";

export default function ObservationsPage() {
  return <CrudPage config={observationsModule} />;
}
