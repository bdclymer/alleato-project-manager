"use client";

import { CrudPage } from "@/components/CrudPage";
import { directoryModule } from "@/lib/modules";

export default function DirectoryPage() {
  return <CrudPage config={directoryModule} />;
}
