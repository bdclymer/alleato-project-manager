"use client";

import { CrudPage } from "@/components/CrudPage";
import { submittalsModule } from "@/lib/modules";

export default function SubmittalsPage() {
  return <CrudPage config={{ ...submittalsModule, projectScoped: false }} />;
}
