"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/lib/store"

function CargandoPantalla() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando datos">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { estado } = useApp()
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {estado ? children : <CargandoPantalla />}
        </main>
      </div>
    </div>
  )
}
