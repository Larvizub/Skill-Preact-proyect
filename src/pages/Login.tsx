import { useState } from "preact/hooks";
import { route } from "preact-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Spinner } from "../components/ui/spinner";
import { authService } from "../services/auth.service";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recinto, setRecinto] = useState(authService.getRecinto());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting authentication...");
      authService.setRecinto(recinto);
      const success = await authService.authenticate();

      if (success) {
        console.log("Authentication successful, redirecting to dashboard");
        route("/dashboard");
      } else {
        setError(
          "No se pudo autenticar con el servidor. Por favor, verifica la conexión."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Error al conectar con el servidor. Verifica la consola para más detalles."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo de Heroica */}
          <div className="flex justify-center mb-4">
            <img
              src="https://costaricacc.com/cccr/Logoheroica.png"
              alt="Logo Heroica"
              className="h-20 w-auto dark:invert transition-all"
            />
          </div>
          <CardTitle className="text-2xl">Skill Platform</CardTitle>
          <CardDescription>Accede a la plataforma Skill</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> La autenticación se realiza con los
                credenciales de Skill.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Usuario, Contraseña y presionar el botón Iniciar Sesión".
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="recinto" className="text-sm font-medium">
                Recinto
              </label>
              <Select
                id="recinto"
                value={recinto}
                onChange={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  setRecinto(value as typeof recinto);
                  authService.setRecinto(value as typeof recinto);
                }}
                disabled={loading}
              >
                <option value="CCCR">CCCR</option>
                <option value="CCCI">CCCI</option>
                <option value="CEVP">CEVP</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Usuario
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onInput={(e) =>
                  setUsername((e.target as HTMLInputElement).value)
                }
                placeholder="Ingresa cualquier texto"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onInput={(e) =>
                  setPassword((e.target as HTMLInputElement).value)
                }
                placeholder="Ingresa cualquier texto"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Spinner size="sm" className="border-t-white border-white/30" />
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
