"use client";

import { CrudPage } from "@/components/CrudPage";
import { inspectionsModule } from "@/lib/modules";

export default function InspectionsPage() {
  return <CrudPage config={inspectionsModule} />;
}
