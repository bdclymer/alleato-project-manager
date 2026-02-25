"use client";

import { CrudPage } from "@/components/CrudPage";
import { paymentsModule } from "@/lib/modules";

export default function PaymentsCompanyPage() {
  return <CrudPage config={{ ...paymentsModule, projectScoped: false }} />;
}
