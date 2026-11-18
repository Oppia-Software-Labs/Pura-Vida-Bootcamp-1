import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <h1 className="text-4xl font-bold">
        Mi primera app en <span className="text-primary">Stellar</span>
      </h1>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conecta tu wallet</CardTitle>
          <CardDescription>
            Conecta tu wallet de Stellar para empezar a usar la red.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Badge variant="outline" className="justify-center py-1">
            Sin conexión
          </Badge>
          <p className="text-sm text-muted-foreground">
            Tu dirección aparecerá aquí después de conectar.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled>
            Conectar wallet
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

export default App
