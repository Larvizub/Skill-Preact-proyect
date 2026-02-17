import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Settings } from "lucide-preact";

export function Configuracion() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Ajustes generales de la plataforma
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Próximamente podrás administrar preferencias, permisos e
              integraciones desde este módulo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este módulo está en preparación.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
