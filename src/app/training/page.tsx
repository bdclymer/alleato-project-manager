"use client";

import { CrudPage } from "@/components/CrudPage";
import { trainingModule } from "@/lib/modules";

export default function TrainingPage() {
  return <CrudPage config={trainingModule} />;
}
