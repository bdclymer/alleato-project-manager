"use client";

import { CrudPage } from "@/components/CrudPage";
import { timesheetsModule } from "@/lib/modules";

export default function TimesheetsPage() {
  return <CrudPage config={timesheetsModule} />;
}
