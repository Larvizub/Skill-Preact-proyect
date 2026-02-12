import type { Schedule } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

type CreateSchedulesServiceDeps = {
  apiRequest: ApiRequest;
};

export function createSchedulesService({ apiRequest }: CreateSchedulesServiceDeps) {
  const getSchedules = (
    _startDate?: string,
    _endDate?: string,
    eventNumber?: number,
    idEventActivity?: number
  ) => {
    // El endpoint GET /events/getschedules requiere eventNumber como parámetro obligatorio
    // Si no se proporciona, retornamos array vacío ya que no podemos hacer la consulta genérica
    // Nota: _startDate y _endDate se mantienen por compatibilidad pero el API no los usa
    if (!eventNumber) {
      console.warn(
        "getSchedules: eventNumber es requerido por el API, retornando array vacío"
      );
      return Promise.resolve([] as Schedule[]);
    }

    const params = new URLSearchParams();
    params.append("eventNumber", String(eventNumber));
    if (idEventActivity) params.append("idEventActivity", String(idEventActivity));
    const queryString = params.toString();
    const url = `/events/getschedules?${queryString}`;

    return apiRequest<{ success: boolean; result: { schedules: Schedule[] } }>(
      url,
      {
        method: "GET",
      }
    ).then((response) => response.result?.schedules || []);
  };

  return {
    getSchedules,
  };
}
