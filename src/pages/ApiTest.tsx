import { useState } from "preact/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { API_CONFIG } from "../services/auth.service";

export function ApiTest() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Probando conexión...\n");

    try {
      // Test 1: Ping básico
      setResult((prev) => prev + "\n📡 Test 1: Verificando conectividad...\n");
      const authToken = btoa(`${API_CONFIG.username}:${API_CONFIG.password}`);

      const endpoints = ["/Login", "/authenticate", "/auth", "/token"];

      for (const endpoint of endpoints) {
        try {
          setResult(
            (prev) => prev + `\nProbando ${API_CONFIG.baseURL}${endpoint}...\n`
          );

          const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({
              companyAuthId: API_CONFIG.companyAuthId,
              idData: API_CONFIG.idData,
            }),
          });

          setResult(
            (prev) =>
              prev + `Status: ${response.status} ${response.statusText}\n`
          );

          if (response.ok) {
            const data = await response.json();
            setResult(
              (prev) =>
                prev +
                `✅ Respuesta exitosa:\n${JSON.stringify(data, null, 2)}\n`
            );
            break;
          } else {
            const errorText = await response.text();
            setResult((prev) => prev + `❌ Error: ${errorText}\n`);
          }
        } catch (err: any) {
          setResult(
            (prev) => prev + `❌ Error en ${endpoint}: ${err.message}\n`
          );
        }
      }

      setResult(
        (prev) => prev + "\n✔️ Prueba completada. Revisa los resultados arriba."
      );
    } catch (error: any) {
      setResult((prev) => prev + `\n❌ Error general: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Herramienta de Diagnóstico del API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Configuración Actual:</h3>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
              {`Base URL: ${API_CONFIG.baseURL}
Username: ${API_CONFIG.username}
Company Auth ID: ${API_CONFIG.companyAuthId}
ID Data: ${API_CONFIG.idData}`}
            </pre>
          </div>

          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Probando..." : "Probar Conexión con API"}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Resultados:</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
            <h4 className="font-semibold mb-2 text-sm">💡 Instrucciones:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Haz clic en "Probar Conexión con API"</li>
              <li>Revisa los resultados de cada endpoint</li>
              <li>
                Si alguno responde con éxito (✅), ese es el endpoint correcto
              </li>
              <li>Copia la respuesta y compártela si necesitas ayuda</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
