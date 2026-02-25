import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary, GlobalErrorHandlers } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Alleato Project Manager",
  description: "Construction project management by Alleato Group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-60 p-4 md:p-8 overflow-x-hidden">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <GlobalErrorHandlers />
        </main>
      </body>
    </html>
  );
}
