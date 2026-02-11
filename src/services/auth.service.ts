// Configuración de la API
// Construir baseURL según entorno: si defines VITE_API_BASE en build se usa;
// por defecto usar `/api` para que Firebase Hosting reescriba a la Cloud Function proxy.

// Determina la baseURL en este orden:
// 1. `VITE_API_BASE` (build-time env var)
// 2. Si no está, usar `/api` para que Vite/dev o el hosting puedan reenviar a la API real
const resolvedBaseURL = import.meta.env.VITE_API_BASE || "/api";

export type Recinto = "CCCR" | "CCCI" | "CEVP";

const RECINTO_ID_DATA: Record<Recinto, string> = {
  CCCR: "14",
  CCCI: "22",
  CEVP: "29",
};

const storedRecinto = (localStorage.getItem("skill_recinto") ||
  "CCCR") as Recinto;
const initialIdData = RECINTO_ID_DATA[storedRecinto] || "14";

export const API_CONFIG = {
  baseURL: resolvedBaseURL,
  username: "wsSk4Api",
  password: "5qT2Uu!qIjG%$XeD",
  companyAuthId: "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  idData: initialIdData,
};

// Tipos para la autenticación
export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// Servicio de autenticación
class AuthService {
  private token: string | null = null;
  private recinto: Recinto = storedRecinto;

  async authenticate(): Promise<boolean> {
    try {
      // Según la documentación de Skill: POST {url}/api/authenticate
      // El endpoint correcto es /authenticate, no /Login
      const response = await fetch(`${API_CONFIG.baseURL}/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: API_CONFIG.username,
          password: API_CONFIG.password,
          companyAuthId: API_CONFIG.companyAuthId,
          companyId: "",
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Authentication failed:", errorText);
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auth response:", data);

      // Según la documentación, la respuesta tiene este formato:
      // { success: true, errorCode: 0, result: { token: "...", expiresUtc: "..." } }
      if (data.success && data.result && data.result.token) {
        this.token = data.result.token;
        localStorage.setItem("skill_auth_token", data.result.token);
        localStorage.setItem("skill_token_expires", data.result.expiresUtc);
        return true;
      }

      // Si hay error, mostrar el código de error
      if (!data.success) {
        console.error("Authentication failed with error code:", data.errorCode);
      }

      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }

  getRecinto(): Recinto {
    return this.recinto;
  }

  setRecinto(recinto: Recinto): void {
    this.recinto = recinto;
    API_CONFIG.idData = RECINTO_ID_DATA[recinto];
    localStorage.setItem("skill_recinto", recinto);
    localStorage.setItem("skill_id_data", API_CONFIG.idData);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("skill_auth_token");
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem("skill_auth_token");
  }
}

export const authService = new AuthService();
