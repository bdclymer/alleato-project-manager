"use client";

import { CrudPage } from "@/components/CrudPage";
import { actionPlansModule } from "@/lib/modules";

export default function ActionPlansPage() {
  return <CrudPage config={actionPlansModule} />;
}
