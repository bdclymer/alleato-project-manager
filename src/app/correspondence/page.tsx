"use client";

import { CrudPage } from "@/components/CrudPage";
import { correspondenceModule } from "@/lib/modules";

export default function CorrespondencePage() {
  return <CrudPage config={correspondenceModule} />;
}
