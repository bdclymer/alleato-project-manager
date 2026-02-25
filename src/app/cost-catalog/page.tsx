"use client";

import { CrudPage } from "@/components/CrudPage";
import { costCatalogModule } from "@/lib/modules";

export default function CostCatalogPage() {
  return <CrudPage config={costCatalogModule} />;
}
