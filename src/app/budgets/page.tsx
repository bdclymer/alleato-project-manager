"use client";

import { CrudPage } from "@/components/CrudPage";
import { budgetModule } from "@/lib/modules";

export default function BudgetsPage() {
  return <CrudPage config={{ ...budgetModule, projectScoped: false }} />;
}
