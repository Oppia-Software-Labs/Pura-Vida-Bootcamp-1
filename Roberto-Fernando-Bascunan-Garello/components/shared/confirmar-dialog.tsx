"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  descripcion?: React.ReactNode
  textoConfirmar?: string
  destructivo?: boolean
  deshabilitado?: boolean
  onConfirmar: () => void
  children?: React.ReactNode
}

export function ConfirmarDialog({
  abierto,
  onAbiertoChange,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  destructivo,
  deshabilitado,
  onConfirmar,
  children,
}: Props) {
  return (
    <AlertDialog open={abierto} onOpenChange={onAbiertoChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descripcion && <AlertDialogDescription>{descripcion}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={destructivo ? "destructive" : "default"}
            disabled={deshabilitado}
            onClick={() => {
              onConfirmar()
              onAbiertoChange(false)
            }}
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
