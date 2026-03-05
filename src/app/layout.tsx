import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary, GlobalErrorHandlers } from "@/components/ErrorBoundary";
import { createClient } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Alleato Project Manager",
  description: "Construction project management by Alleato Group",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const mainClass = user
    ? "flex-1 ml-0 md:ml-60 p-4 md:p-8 overflow-x-hidden"
    : "flex-1 p-4 md:p-8 overflow-x-hidden";

  return (
    <html lang="en">
      <body className="flex min-h-screen">
        {user && <Sidebar userEmail={user.email} />}
        <main className={mainClass}>
          {user && (
            <div className="flex justify-end items-center gap-3 mb-2">
              <span className="text-xs text-gray-400">{user.email}</span>
              <LogoutButton />
            </div>
          )}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <GlobalErrorHandlers />
        </main>
      </body>
    </html>
  );
}
