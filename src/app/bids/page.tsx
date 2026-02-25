"use client";

import { CrudPage } from "@/components/CrudPage";
import { bidsModule } from "@/lib/modules";

export default function BidsPage() {
  return <CrudPage config={bidsModule} />;
}
