import { Suspense } from "react"
import { AdministracionView } from "@/components/admin/administracion-view"

export default function Page() {
  return (
    <Suspense>
      <AdministracionView />
    </Suspense>
  )
}
