"use client";

import { CrudPage } from "@/components/CrudPage";
import { meetingsModule } from "@/lib/modules";

export default function MeetingMinutesPage() {
  return <CrudPage config={{ ...meetingsModule, projectScoped: false }} />;
}
