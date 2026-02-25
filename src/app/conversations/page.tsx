"use client";

import { CrudPage } from "@/components/CrudPage";
import { conversationsModule } from "@/lib/modules";

export default function ConversationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Conversations</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Company-wide messaging, threaded discussions, and correspondence.
        </p>
      </div>
      <CrudPage
        config={{ ...conversationsModule, projectScoped: false }}
        showHeader={false}
      />
    </div>
  );
}
