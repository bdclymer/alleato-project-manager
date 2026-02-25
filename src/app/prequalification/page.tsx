"use client";

import { CrudPage } from "@/components/CrudPage";
import { prequalModule } from "@/lib/modules";

export default function PrequalificationPage() {
  return <CrudPage config={prequalModule} />;
}
