import { FichaView } from "@/components/embajadores/ficha-view"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FichaView id={id} />
}
