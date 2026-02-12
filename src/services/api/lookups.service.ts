import type {
  ActivityPackage,
  ActivityType,
  BillingCurrency,
  ClientEventManager,
  Contingency,
  EventCharacter,
  EventCoordinator,
  EventMarketSubSegment,
  EventPaymentForm,
  EventSector,
  EventSize,
  EventStage,
  EventSubType,
  ExtraTip,
  MarketSegment,
  ReservationType,
  ReservationUse,
  Resource,
  SalesAgent,
  TaxExemption,
} from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type CreateLookupsServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
};

export function createLookupsService({
  apiRequest,
  buildPayload,
  withFallback,
}: CreateLookupsServiceDeps) {
  const getEventTypes = () =>
    withFallback(
      () =>
        apiRequest<{
          success: boolean;
          result?: { eventTypes?: any[] };
        }>("/events/geteventtypes", {
          method: "GET",
        }),
      () =>
        apiRequest<{
          success: boolean;
          result?: { eventTypes?: any[] };
        }>("/GetEventTypes", {
          method: "POST",
          body: buildPayload(),
        })
    ).then((payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.eventTypes))
        return (payload as any).eventTypes;
      if (Array.isArray((payload as any)?.result?.eventTypes))
        return (payload as any).result.eventTypes;
      return [];
    });

  const getEventMarketSegments = async () => {
    const response = await withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { eventMarketSegments?: MarketSegment[] } }
          | { eventMarketSegments?: MarketSegment[] }
          | MarketSegment[]
        >("/events/geteventmarketsegments", {
          method: "GET",
        }),
      () =>
        apiRequest<
          | { success: boolean; result?: { eventMarketSegments?: MarketSegment[] } }
          | { eventMarketSegments?: MarketSegment[] }
          | MarketSegment[]
        >("/GetEventMarketSegments", {
          method: "POST",
          body: buildPayload(),
        })
    );

    if (Array.isArray(response)) return response;
    if (Array.isArray((response as any)?.eventMarketSegments))
      return (response as any).eventMarketSegments;
    if (Array.isArray((response as any)?.result?.eventMarketSegments))
      return (response as any).result.eventMarketSegments;
    return [];
  };

  const getSalesAgents = async (): Promise<SalesAgent[]> => {
    const response = await apiRequest<{
      success: boolean;
      errorCode: number;
      errorMessage: string;
      result: {
        salesAgents: Array<{
          idSalesAgent: number;
          salesAgentName: string;
          salesAgentEmail?: string;
          salesAgentPhone?: string;
          salesAgentMobilePhone?: string;
        }>;
      };
    }>("/events/getsalesagents", {
      method: "GET",
    });

    // Normalizar la respuesta para que coincida con la interfaz esperada
    return (response.result?.salesAgents || []).map((agent) => ({
      idSalesAgent: agent.idSalesAgent,
      salesAgentName: agent.salesAgentName,
      salesAgentEmail: agent.salesAgentEmail,
      salesAgentPhone: agent.salesAgentPhone,
      salesAgentMobilePhone: agent.salesAgentMobilePhone,
      // Campos adicionales para compatibilidad
      id: String(agent.idSalesAgent),
      name: agent.salesAgentName,
      email: agent.salesAgentEmail,
      phone: agent.salesAgentPhone || agent.salesAgentMobilePhone,
    }));
  };

  const getEventStatuses = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result: { eventStatuses: any[] } }>(
          "/events/geteventstatuses",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{
          success: boolean;
          errorCode: number;
          result: { eventStatuses: any[] };
        }>("/GetEventStatuses", {
          method: "POST",
          body: buildPayload(),
        })
    ).then((response) => response.result.eventStatuses);

  const getEventCharacters = () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { eventCharacters?: EventCharacter[] } }
          | { eventCharacters?: EventCharacter[] }
          | EventCharacter[]
        >("/events/geteventcharacters", {
          method: "GET",
        }),
      () =>
        apiRequest<
          | { success: boolean; result?: { eventCharacters?: EventCharacter[] } }
          | { eventCharacters?: EventCharacter[] }
          | EventCharacter[]
        >("/GetEventCharacters", {
          method: "POST",
          body: buildPayload(),
        })
    ).then((payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.eventCharacters))
        return (payload as any).eventCharacters;
      if (Array.isArray((payload as any)?.result?.eventCharacters))
        return (payload as any).result.eventCharacters;
      return [];
    });

  const getEventSectors = () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { eventSectors?: EventSector[] } }
          | { eventSectors?: EventSector[] }
          | EventSector[]
        >("/events/geteventsectors", {
          method: "GET",
        }),
      () =>
        apiRequest<
          | { success: boolean; result?: { eventSectors?: EventSector[] } }
          | { eventSectors?: EventSector[] }
          | EventSector[]
        >("/GetEventSectors", {
          method: "POST",
          body: buildPayload(),
        })
    ).then((payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.eventSectors))
        return (payload as any).eventSectors;
      if (Array.isArray((payload as any)?.result?.eventSectors))
        return (payload as any).result.eventSectors;
      return [];
    });

  const getEventSizes = () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { eventSizes?: EventSize[] } }
          | { eventSizes?: EventSize[] }
          | EventSize[]
        >("/events/geteventsizes", {
          method: "GET",
        }),
      () =>
        apiRequest<
          | { success: boolean; result?: { eventSizes?: EventSize[] } }
          | { eventSizes?: EventSize[] }
          | EventSize[]
        >("/GetEventSizes", {
          method: "POST",
          body: buildPayload(),
        })
    ).then((payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.eventSizes))
        return (payload as any).eventSizes;
      if (Array.isArray((payload as any)?.eventSize))
        return (payload as any).eventSize;
      if (Array.isArray((payload as any)?.result?.eventSizes))
        return (payload as any).result.eventSizes;
      if (Array.isArray((payload as any)?.result?.eventSize))
        return (payload as any).result.eventSize;
      return [];
    });

  const getReservationTypes = () =>
    withFallback(
      () =>
        apiRequest<ReservationType[]>("/events/getreservationtypes", {
          method: "GET",
        }),
      () =>
        apiRequest<ReservationType[]>("/GetReservationTypes", {
          method: "POST",
          body: buildPayload(),
        })
    );

  const getReservationUses = () =>
    withFallback(
      () =>
        apiRequest<ReservationUse[]>("/events/getreservationuses", {
          method: "GET",
        }),
      () =>
        apiRequest<ReservationUse[]>("/GetReservationUses", {
          method: "POST",
          body: buildPayload(),
        })
    );

  const getEventStages = async () => {
    const extractStages = (payload: any): EventStage[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.eventStages)) return payload.eventStages;
      if (Array.isArray(payload?.eventStage)) return payload.eventStage;
      if (Array.isArray(payload?.result?.eventStages))
        return payload.result.eventStages;
      if (Array.isArray(payload?.result?.eventStage))
        return payload.result.eventStage;
      return [];
    };

    try {
      const getPayload = await apiRequest<
        | { success: boolean; result?: { eventStages?: EventStage[] } }
        | { eventStages?: EventStage[] }
        | EventStage[]
      >("/events/geteventstages", {
        method: "GET",
      });

      const stages = extractStages(getPayload);
      if (stages.length > 0) return stages;
    } catch (error) {
      console.warn("getEventStages GET fallo", error);
    }

    const postPayload = await apiRequest<
      | { success: boolean; result?: { eventStages?: EventStage[] } }
      | { eventStages?: EventStage[] }
      | EventStage[]
    >("/GetEventStages", {
      method: "POST",
      body: buildPayload(),
    });

    return extractStages(postPayload);
  };

  const getActivityTypes = () =>
    withFallback(
      () =>
        apiRequest<ActivityType[]>("/events/getactivitytypes", {
          method: "GET",
        }),
      () =>
        apiRequest<ActivityType[]>("/GetActivityTypes", {
          method: "POST",
          body: buildPayload(),
        })
    );

  const getEventCoordinators = () =>
    withFallback(
      () =>
        apiRequest<EventCoordinator[]>("/events/geteventcoordinators", {
          method: "GET",
        }),
      () =>
        apiRequest<EventCoordinator[]>("/GetEventCoordinators", {
          method: "POST",
          body: buildPayload(),
        })
    );

  const getBillingCurrencies = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { billingCurrencies?: BillingCurrency[] } }>(
          "/events/getbillingcurrency",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { billingCurrencies?: BillingCurrency[] } }>(
          "/GetBillingCurrency",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) => response.result?.billingCurrencies || []);

  const getEventMarketSubSegments = async () => {
    try {
      const response = await withFallback(
        () =>
          apiRequest<{
            success: boolean;
            result?: { eventMarketSubSegments?: EventMarketSubSegment[] };
          }>("/events/geteventmarketsubsegments", {
            method: "GET",
          }),
        () =>
          apiRequest<{
            success: boolean;
            result?: { eventMarketSubSegments?: EventMarketSubSegment[] };
          }>("/GetEventMarketSubSegments", {
            method: "POST",
            body: buildPayload(),
          })
      );

      const subsegments =
        (response as any)?.eventMarketSubSegments ||
        response.result?.eventMarketSubSegments ||
        [];
      if (subsegments.length > 0) return subsegments;
    } catch (error) {
      console.warn("getEventMarketSubSegments fallo, usando segmentos", error);
    }

    const segments = await getEventMarketSegments();
    return segments.map((segment: MarketSegment) => ({
      idMarketSubSegment: Number(segment.id),
      marketSubSegmentName: segment.name,
      marketSegmentName: segment.name,
    }));
  };

  const getEventSubTypes = async () => {
    try {
      const response = await withFallback(
        () =>
          apiRequest<{
            success: boolean;
            result?: { eventSubTypes?: EventSubType[] };
          }>("/events/geteventsubtypes", {
            method: "GET",
          }),
        () =>
          apiRequest<{
            success: boolean;
            result?: { eventSubTypes?: EventSubType[] };
          }>("/GetEventSubTypes", {
            method: "POST",
            body: buildPayload(),
          })
      );

      const subTypes = response.result?.eventSubTypes || [];
      if (subTypes.length > 0) return subTypes;
    } catch (error) {
      console.warn("getEventSubTypes fallo, usando event types", error);
    }

    const types = await getEventTypes();
    const fromNested = (types || []).flatMap((type: any) =>
      (type.subTypes || []).map((sub: any) => ({
        ...sub,
        idEventType: sub.idEventType ?? type.idEventType ?? type.id,
        eventTypeName: sub.eventTypeName ?? type.eventTypeName ?? type.name,
      }))
    );

    if (fromNested.length > 0) {
      return fromNested.filter(
        (entry: EventSubType) => (entry.idEventSubType ?? 0) > 0
      );
    }

    return (types || [])
      .map((type: any) => ({
        idEventSubType: Number(type.idEventSubType ?? type.idEventType ?? type.id ?? 0),
        eventSubTypeName: type.eventSubTypeName ?? type.eventTypeName ?? type.name,
        eventTypeName: type.eventTypeName ?? type.name,
        idEventType: type.idEventType ?? type.id,
      }))
      .filter((entry: EventSubType) => entry.idEventSubType > 0);
  };

  const getEventPaymentForms = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { paymentForms?: EventPaymentForm[] } }>(
          "/events/geteventpaymentforms",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { paymentForms?: EventPaymentForm[] } }>(
          "/GetEventPaymentForms",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) =>
      (response.result?.paymentForms || []).map((form) => ({
        ...form,
        paymentFormName: form.paymentFormName || form.paymentFormDescription || "",
      }))
    );

  const getTaxExemptions = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { taxExemptions?: TaxExemption[] } }>(
          "/events/gettaxexemptions",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { taxExemptions?: TaxExemption[] } }>(
          "/GetTaxExemptions",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) => response.result?.taxExemptions || []);

  const getExtraTips = async () => {
    const normalizeTips = (response: any) => {
      const result = response?.result ?? response ?? {};
      const rawTips =
        result?.extraTips ||
        result?.extraTip ||
        result?.extraTipList ||
        result?.extraTipData ||
        result?.extraTipsList ||
        [];
      const tips = Array.isArray(rawTips)
        ? rawTips
        : rawTips?.extraTips || rawTips?.extraTip || [];

      return (tips || []).map((tip: any) => ({
        ...tip,
        idExtraTip: tip.idExtraTip ?? tip.idExtraTipType ?? tip.id ?? 0,
        extraTipName:
          tip.extraTipName ||
          tip.extraTipDescription ||
          tip.description ||
          "",
      }));
    };

    const primaryResponse = await apiRequest<{
      success: boolean;
      result?: { extraTips?: ExtraTip[] };
    }>("/events/getextratips", {
      method: "GET",
    });

    const primaryTips = normalizeTips(primaryResponse);
    if (primaryTips.length > 0) return primaryTips;

    const tryFallback = async (endpoint: string) => {
      const response = await apiRequest<{
        success: boolean;
        result?: { extraTips?: ExtraTip[] };
      }>(endpoint, {
        method: "POST",
        body: buildPayload(),
      });
      return normalizeTips(response);
    };

    try {
      const pluralPost = await tryFallback("/GetExtraTips");
      if (pluralPost.length > 0) return pluralPost;
    } catch (error) {
      console.warn("getExtraTips fallback plural fallo", error);
    }

    try {
      return await tryFallback("/GetExtraTip");
    } catch (error) {
      console.warn("getExtraTips fallback singular fallo", error);
      return primaryTips;
    }
  };

  const getContingencies = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { contingencies?: Contingency[] } }>(
          "/events/getcontingencies",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { contingencies?: Contingency[] } }>(
          "/GetContingencies",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) => response.result?.contingencies || []);

  const getClientEventManagers = (idClient?: number) =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { clientEventManagers?: ClientEventManager[] } }>(
          "/events/getclienteventmanagers",
          {
            method: "POST",
            body: buildPayload({
              idClient: idClient ?? null,
            }),
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { clientEventManagers?: ClientEventManager[] } }>(
          "/GetClientEventManagers",
          {
            method: "POST",
            body: buildPayload({
              idClient: idClient ?? null,
            }),
          }
        )
    ).then((response) => response.result?.clientEventManagers || []);

  const getResources = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { resources?: Resource[] } }>(
          "/events/getresources",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { resources?: Resource[] } }>(
          "/GetResources",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) => response.result?.resources || []);

  const getActivityPackages = () =>
    withFallback(
      () =>
        apiRequest<{ success: boolean; result?: { activityPackages?: ActivityPackage[] } }>(
          "/events/getactivitypackages",
          {
            method: "GET",
          }
        ),
      () =>
        apiRequest<{ success: boolean; result?: { activityPackages?: ActivityPackage[] } }>(
          "/GetActivityPackages",
          {
            method: "POST",
            body: buildPayload(),
          }
        )
    ).then((response) => response.result?.activityPackages || []);

  return {
    getEventTypes,
    getEventMarketSegments,
    getSalesAgents,
    getEventStatuses,
    getEventCharacters,
    getEventSectors,
    getEventSizes,
    getReservationTypes,
    getReservationUses,
    getEventStages,
    getActivityTypes,
    getEventCoordinators,
    getBillingCurrencies,
    getEventMarketSubSegments,
    getEventSubTypes,
    getEventPaymentForms,
    getTaxExemptions,
    getExtraTips,
    getContingencies,
    getClientEventManagers,
    getResources,
    getActivityPackages,
  };
}
