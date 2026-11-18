import type { Metadata } from "next";
import { JourneyView } from "@/components/JourneyView";
import { isLevel } from "@/lib/journey";

export const metadata: Metadata = { title: "El viaje" };

export default async function JourneyPage({ searchParams }: {
  searchParams: Promise<{ nivel?: string | string[] }>;
}) {
  const value = (await searchParams).nivel;
  const candidate = typeof value === "string" ? Number(value) : undefined;
  const requested = isLevel(candidate) ? candidate : undefined;

  return <JourneyView key={requested ?? 0} requested={requested}/>;
}
