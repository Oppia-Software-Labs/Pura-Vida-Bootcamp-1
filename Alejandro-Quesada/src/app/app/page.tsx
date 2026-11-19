import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Mi pensión — Koired",
};

export default function AppRoute() {
  return <Dashboard />;
}
