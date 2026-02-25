"use client";

import { CrudPage } from "@/components/CrudPage";
import { companyDocumentsModule } from "@/lib/modules";

export default function CompanyDocumentsPage() {
  return <CrudPage config={companyDocumentsModule} />;
}
