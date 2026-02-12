type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

type CreateActivitiesServiceDeps = {
  apiRequest: ApiRequest;
};

export function createActivitiesService({ apiRequest }: CreateActivitiesServiceDeps) {
  const addEventActivity = async (
    eventNumber: number,
    activityPayload: Record<string, unknown>
  ) =>
    apiRequest<{ success: boolean; result?: { idEventActivity?: number } }>(
      `/events/event/${eventNumber}/activity`,
      {
        method: "POST",
        body: JSON.stringify({
          Activity: activityPayload,
        }),
      }
    );

  const addActivityRoom = async (
    idEventActivity: number,
    roomPayload: Record<string, unknown>
  ) =>
    apiRequest<{ success: boolean; result?: { idActivityRoom?: number } }>(
      `/events/event/activity/${idEventActivity}/room`,
      {
        method: "POST",
        body: JSON.stringify({
          room: roomPayload,
        }),
      }
    );

  const addActivityService = async (
    idEventActivity: number,
    servicePayload: Record<string, unknown>
  ) =>
    apiRequest<{ success: boolean; result?: { idActivityService?: number } }>(
      `/events/event/activity/${idEventActivity}/service`,
      {
        method: "POST",
        body: JSON.stringify({
          Service: servicePayload,
        }),
      }
    );

  return {
    addEventActivity,
    addActivityRoom,
    addActivityService,
  };
}
