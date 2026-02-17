import { API_CONFIG, authService } from "../auth.service";
import { route } from "preact-router";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authService.getToken();

  const fullUrl = `${API_CONFIG.baseURL}${endpoint}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      idData: authService.getIdData(),
      companyAuthId: API_CONFIG.companyAuthId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      authService.logout();
      try {
        route("/login", true);
      } catch (e) {
        console.warn(
          "preact-router route() falló, usando window.location as fallback",
          e
        );
        window.location.href = "/login";
      }
      throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    }
    const text = await response.text();
    throw new Error(`API Error: ${response.statusText} - ${text}`);
  }

  return response.json();
}

export const buildPayload = (payload: Record<string, unknown> = {}) =>
  JSON.stringify({
    companyAuthId: API_CONFIG.companyAuthId,
    idData: authService.getIdData(),
    ...payload,
  });

export const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    if (fallback) {
      console.warn("apiService fallback", error);
      return fallback();
    }
    throw error;
  }
};
