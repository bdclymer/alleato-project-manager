"use client";

import { CrudPage } from "@/components/CrudPage";
import { rfisModule } from "@/lib/modules";

export default function RFIsPage() {
  return <CrudPage config={{ ...rfisModule, projectScoped: false }} />;
}
