"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { supabase } from "@/lib/supabase";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState("Project");

  useEffect(() => {
    supabase
      .from("projects")
      .select("name")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
      });
  }, [id]);

  return (
    <div className="flex">
      <ProjectSidebar projectId={id} projectName={projectName} />
      <div className="flex-1 ml-52 p-6">{children}</div>
    </div>
  );
}
