import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Dashboard - Alleato Project Manager",
};

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
