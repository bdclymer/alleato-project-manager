"use client";

import { CrudPage } from "@/components/CrudPage";
import { workflowsModule } from "@/lib/modules";

export default function WorkflowsPage() {
  return <CrudPage config={workflowsModule} />;
}
