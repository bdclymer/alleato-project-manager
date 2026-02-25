"use client";

import { useParams } from "next/navigation";
import { CrudPage } from "@/components/CrudPage";
import { budgetModule } from "@/lib/modules";

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  return <CrudPage config={budgetModule} projectId={id} />;
}
