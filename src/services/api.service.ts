import { API_CONFIG, authService } from "./auth.service";
import { route } from "preact-router";

// Función genérica para hacer peticiones a la API
async function apiRequest<T>(
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
      // Headers requeridos por Skill Suite API
      idData: authService.getIdData(),
      companyAuthId: API_CONFIG.companyAuthId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Si es 401, el token expiró - limpiar sesión y redirigir
    if (response.status === 401) {
      // Token inválido/expirado: limpiar sesión y navegar usando el router SPA.
      authService.logout();
      try {
        // Usar route de preact-router para evitar recarga completa de la página
        // y asegurar que el componente Login montado en /login sea utilizado.
        route("/login", true);
      } catch (e) {
        // Alternativa: usar window.location si por alguna razón route falla
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

const buildPayload = (payload: Record<string, unknown> = {}) =>
  JSON.stringify({
    companyAuthId: API_CONFIG.companyAuthId,
    idData: authService.getIdData(),
    ...payload,
  });

const withFallback = async <T>(
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

export interface Room {
  idRoom: number;
  roomName: string;
  roomCode: string;
  roomMt2: number;
  roomHeight: number;
  roomComments: string;
  roomVisualOrder: number;
  roomActive: boolean;
  roomBackGroundColor: number;
  roomForeColor: number | null;
  roomType: {
    idRoomType: number;
    roomTypeName: string;
    roomTypeVisualOrder: number;
  };
  location: {
    idLocation: number;
    locationName: string;
    locationVisualOrder: number;
  };
  revenueGroup: {
    idRevenueGroup: number;
    revenueGroupName: string;
    revenueGroupColumnName: string;
    revenueGroupVisualOrder: number;
  };
  roomSetups: Array<{
    idRoomSetup: number;
    roomSetupName: string;
    roomSetupPaxsCapacity: number;
    roomSetupPreparationTime: number;
    roomSetupCleaningTime: number;
  }>;
}

export interface Service {
  idService: number;
  serviceName: string;
  serviceNameAlternative: string;
  serviceCode: string;
  serviceStock: number;
  serviceMinCostPrice: number;
  serviceMaxCostPrice: number;
  // Precios con y sin impuestos (normalizados desde priceLists)
  priceTI?: number; // Price Taxes Included (con impuesto)
  priceTNI?: number; // Price Taxes Not Included (sin impuesto)
  serviceProfitMargin: number;
  serviceComments: string;
  serviceActive: boolean;
  revenueGroup: {
    idRevenueGroup: number;
    revenueGroupName: string;
    revenueGroupColumnName: string;
    revenueGroupVisualOrder: number;
  };
  serviceCategory: {
    idServiceCategory: number;
    serviceCategoryName: string;
    serviceCategorySystem: boolean;
    serviceCategoryActive: boolean;
    serviceCategoryVisualOrder: number;
    serviceCategoryAffectsExtraTip: boolean;
  };
  serviceSubCategory: {
    idServiceSubCategory: number;
    serviceSubCategoryName: string;
    serviceSubCategoryActive: boolean;
  };
  // Datos originales de priceLists (si existen)
  priceLists?: Array<{
    servicePriceTaxesIncluded?: number;
    servicePriceTaxesNotIncluded?: number;
    priceListActive?: boolean;
    priceListFromDate?: string;
    priceListToDate?: string;
  }>;
}

export interface RoomRate {
  id: string;
  roomId: string;
  rate: number;
  currency: string;
}

export interface ServiceRate {
  id: string;
  serviceId: string;
  rate: number;
  currency: string;
}

export interface RoomAvailability {
  roomId: string;
  date: string;
  available: boolean;
}

export interface EventType {
  id: string;
  name: string;
  description?: string;
}

export interface MarketSegment {
  id: string;
  name: string;
}

export interface SalesAgent {
  idSalesAgent: number;
  salesAgentName: string;
  salesAgentEmail?: string;
  salesAgentPhone?: string;
  salesAgentMobilePhone?: string;
  // Campos adicionales para compatibilidad con UI
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface EventStatus {
  id: string;
  name: string;
  color?: string;
}

export interface EventCharacter {
  id: string;
  name: string;
}

export interface EventSector {
  id: string;
  name: string;
}

export interface EventSize {
  id: string;
  name: string;
}

export interface ReservationType {
  id: string;
  name: string;
}

export interface ReservationUse {
  id: string;
  name: string;
}

export interface EventStage {
  id: string;
  name: string;
}

export interface ActivityType {
  id: string;
  name: string;
}

export interface EventCoordinator {
  id: string;
  name: string;
  email?: string;
}

export interface BillingCurrency {
  idCurrency: number;
  currencyName?: string;
  currencyCode?: string;
}

export interface EventMarketSubSegment {
  idMarketSubSegment: number;
  marketSubSegmentName?: string;
  marketSegmentName?: string;
  idMarketSegment?: number;
}

export interface EventSubType {
  idEventSubType: number;
  eventSubTypeName?: string;
  eventTypeName?: string;
  idEventType?: number;
  idMarketSubSegment?: number;
  idEventMarketSubSegment?: number;
  idEventSubSegment?: number;
  subSegmentId?: number;
}

export interface EventPaymentForm {
  idPaymentForm: number;
  paymentFormName?: string;
  paymentFormDescription?: string;
}

export interface TaxExemption {
  idTaxExemption: number;
  taxExemptionName?: string;
}

export interface ExtraTip {
  idExtraTip: number;
  extraTipName?: string;
  extraTipDescription?: string;
}

export interface Contingency {
  idContingency: number;
  contingencyName?: string;
}

export interface ClientEventManager {
  idClientEventManager: number;
  clientEventManagerName?: string;
  clientEventManagerEmail?: string;
  clientEventManagerPhone?: string;
}

export interface Resource {
  idResource: number;
  resourceName?: string;
}

export interface ActivityPackage {
  idActivityPackage: number;
  activityPackageName?: string;
}

export interface Client {
  idClient?: number;
  clientCode?: string;
  clientName?: string;
  tradeName?: string;
  legalName?: string;
  address?: string;
  identificationNumber?: string;
  email?: string;
  location?: string;
  city?: string | null;
  zipcode?: string | null;
  province?: string | null;
  phone?: string;
  idIdentificationType?: number | null;
  idProfileType?: number | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface Contact {
  idClientEventManager?: number;
  clientEventManagerName?: string;
  clientEventManagerEmail?: string;
  clientEventManagerMobilePhone?: string;
  clientEventManagerPhone?: string;
  client?: any;
  idClient?: number;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
}

export interface Schedule {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Event {
  idEvent: number;
  eventNumber: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedPax: number;
  realPax: number;
  contractNumber: string;
  reference: string;
  comments: string;
  internalComments: string;
  creationDate: string;
  modificationDate: string;
  icca?: boolean | number;
  sustainable?: boolean | number;
  // Propiedades opcionales para simplificar
  salesAgent?: any;
  eventType?: any;
  eventStatus?: any;
  client?: any;
  activities?: any[];
  eventRooms?: any[];
}

export interface EventQuote {
  id: string;
  eventId: string;
  total: number;
  currency: string;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EventInvoice {
  id: string;
  eventId: string;
  invoiceNumber: string;
  date: string;
  total: number;
  currency: string;
  status: string;
}

// Servicios de API
export const apiService = {
  // Salones
  getRooms: () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { rooms?: Room[] } }
          | { rooms?: Room[] }
          | Room[]
        >("/events/getrooms", {
          method: "GET",
        }),
      () =>
        apiRequest<{
          success: boolean;
          errorCode: number;
          result: { rooms: Room[] };
        }>("/GetRooms", {
          method: "POST",
          body: buildPayload(),
        })
    ).then(async (payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.rooms)) return (payload as any).rooms;
      if (Array.isArray((payload as any)?.result?.rooms))
        return (payload as any).result.rooms;
      return [];
    }),

  // Servicios
  getServices: () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { services?: Service[] } }
          | { services?: Service[] }
          | Service[]
        >("/events/getservices", {
          method: "POST",
          body: JSON.stringify({
            services: {
              serviceName: "",
            },
          }),
        }),
      () =>
        apiRequest<{
          success: boolean;
          errorCode: number;
          result: { services: Service[] };
        }>("/GetServices", {
          method: "POST",
          body: buildPayload({
            services: {
              serviceName: "",
            },
          }),
        })
    ).then(async (payload) => {
      // Normalizar el payload a Service[] y mapear nombres alternativos de campos de precio
      let raw: any[] = [];
      if (Array.isArray(payload)) raw = payload as any[];
      else if (Array.isArray((payload as any)?.services))
        raw = (payload as any).services;
      else if (Array.isArray((payload as any)?.result?.services))
        raw = (payload as any).result.services;

      const pickFirstNumber = (obj: any, keys: string[]) => {
        for (const k of keys) {
          if (obj == null) continue;
          const v = obj[k];
          if (v === 0) return 0;
          if (typeof v === "number") return v;
          if (typeof v === "string") {
            const n = Number(v.replace(/[^0-9.-]+/g, ""));
            if (!Number.isNaN(n)) return n;
          }
        }
        return undefined;
      };

      const withTaxKeys = [
        "priceTI",
        "price_with_tax",
        "priceWithTax",
        "priceConIVA",
        "priceConIva",
        "priceConImp",
        "servicePriceWithTax",
        "price_with_vat",
        "priceWithVat",
        "priceTI0",
        "price",
      ];
      const withoutTaxKeys = [
        "priceTNI",
        "price_without_tax",
        "priceWithoutTax",
        "priceSinIVA",
        "priceSinIva",
        "servicePriceWithoutTax",
        "price_net",
        "priceNet",
        "unitPrice",
      ];

      const normalized = raw.map((s: any) => {
        const priceTI = pickFirstNumber(s, withTaxKeys);
        const priceTNI = pickFirstNumber(s, withoutTaxKeys);

        // Si la API solo provee un precio, intentar deducir:
        // asumir `price` o `unitPrice` como sin impuesto si no hay campo explícito con impuesto
        let finalPriceTI = s.priceTI ?? priceTI;
        let finalPriceTNI = s.priceTNI ?? priceTNI;
        if (finalPriceTNI === undefined && finalPriceTI !== undefined) {
          // no se puede calcular el impuesto de forma fiable -> conservar solo un campo (TI)
          finalPriceTNI = undefined;
        }
        if (finalPriceTI === undefined && finalPriceTNI !== undefined) {
          finalPriceTI = undefined;
        }

        return {
          ...s,
          priceTI: finalPriceTI,
          priceTNI: finalPriceTNI,
        } as Service;
      });

      // Además, intentar obtener tarifas actualizadas desde GetServiceRates
      try {
        const today = new Date().toISOString().slice(0, 10);
        const ratesPayload = await apiRequest<any>("/events/getservicerates", {
          method: "POST",
          body: buildPayload({
            serviceRates: { idEventActivity: 0, priceDate: today },
          }),
        });

        console.log("GetServiceRates response:", ratesPayload);

        let ratesRaw: any[] = [];
        if (Array.isArray(ratesPayload)) ratesRaw = ratesPayload;
        else if (Array.isArray(ratesPayload?.serviceRates))
          ratesRaw = ratesPayload.serviceRates;
        else if (Array.isArray(ratesPayload?.result?.serviceRates))
          ratesRaw = ratesPayload.result.serviceRates;

        console.log("Rates raw array:", ratesRaw);

        const rateMap = new Map<number, any>();
        const todayStr = new Date().toISOString().slice(0, 10);
        for (const r of ratesRaw) {
          const id = Number(r.idService ?? r.id ?? r.serviceId ?? NaN);
          if (Number.isNaN(id)) continue;

          let chosenPriceList: any | undefined;
          const lists = Array.isArray(r.priceLists)
            ? r.priceLists
            : r.priceList
            ? [r.priceList]
            : [];
          if (lists.length > 0) {
            // preferir la lista activa que cubra la fecha actual
            chosenPriceList = lists.find(
              (p: any) =>
                p.priceListActive === true &&
                (!p.priceListFromDate ||
                  !p.priceListToDate ||
                  (p.priceListFromDate <= todayStr &&
                    p.priceListToDate >= todayStr))
            );
            if (!chosenPriceList) {
              // en su defecto usar cualquier lista activa
              chosenPriceList =
                lists.find((p: any) => p.priceListActive === true) || lists[0];
            }
          }

          console.log(
            `Service ${id}: priceLists =`,
            lists,
            "chosen =",
            chosenPriceList
          );
          rateMap.set(id, { raw: r, priceList: chosenPriceList });
        }

        const merged = normalized.map((s: any) => {
          const entry = rateMap.get(Number(s.idService));
          if (entry && entry.priceList) {
            const pl = entry.priceList;
            // Acceder directamente a los campos correctos
            const inc = pl.servicePriceTaxesIncluded;
            const notInc = pl.servicePriceTaxesNotIncluded;

            console.log(
              `Service ${s.idService} (${s.serviceName}): TI=${inc}, TNI=${notInc}`,
              pl
            );

            return {
              ...s,
              priceTI: inc ?? s.priceTI,
              priceTNI: notInc ?? s.priceTNI,
            } as Service;
          }
          return s;
        });

        console.log("Merged services with rates:", merged.slice(0, 3));
        return merged;
      } catch (err) {
        // Si falla obtener tarifas, retornamos la lista normalizada sin merge
        console.warn("getServices: no se pudo obtener GetServiceRates:", err);
        return normalized;
      }
    }),

  // Tarifas de salones
  getRoomRates: () =>
    withFallback(
      () =>
        apiRequest<RoomRate[]>("/events/getroomrates", {
          method: "POST",
          body: buildPayload(),
        }),
      () =>
        apiRequest<RoomRate[]>("/GetRoomRates", {
          method: "POST",
          body: buildPayload(),
        })
    ),

  // Tarifas de servicios
  getServiceRates: () =>
    withFallback(
      () =>
        apiRequest<ServiceRate[]>("/events/getservicerates", {
          method: "POST",
          body: buildPayload(),
        }),
      () =>
        apiRequest<ServiceRate[]>("/GetServiceRates", {
          method: "POST",
          body: buildPayload(),
        })
    ),

  // Disponibilidad de salones
  getRoomsAvailability: (startDate: string, endDate: string) =>
    apiRequest<RoomAvailability[]>("/events/getroomsavailability", {
      method: "POST",
      body: buildPayload({
        roomsAvailability: {
          fromDate: startDate,
          toDate: endDate,
          eventStatusList: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includesPreparationTime: true,
          includesCleaningTime: true,
          roomList: [],
          roomPaxCapacity: 0,
          roomTypeList: [],
          locationList: [],
          availabilityType: 0,
        },
      }),
    }),

  // Tipos de eventos
  getEventTypes: () =>
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
    }),

  // Segmentos de mercado
  getEventMarketSegments: async () => {
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
  },

  // Coordinadores de cuenta
  getSalesAgents: async (): Promise<SalesAgent[]> => {
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
  },

  // Estados de eventos
  getEventStatuses: () =>
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
    ).then((response) => response.result.eventStatuses),

  // Carácter del evento
  getEventCharacters: () =>
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
    }),

  // Sector del evento
  getEventSectors: () =>
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
    }),

  // Tamaño del evento
  getEventSizes: () =>
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
    }),

  // Tipos de reservación
  getReservationTypes: () =>
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
    ),

  // Usos de reservación
  getReservationUses: () =>
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
    ),

  // Etapas del evento
  getEventStages: async () => {
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
  },

  // Tipos de actividades
  getActivityTypes: () =>
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
    ),

  // Coordinadores de eventos
  getEventCoordinators: () =>
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
    ),

  // Monedas de facturacion
  getBillingCurrencies: () =>
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
    ).then((response) => response.result?.billingCurrencies || []),

  // Subsegmentos de mercado
  getEventMarketSubSegments: async () => {
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

    const segments = await apiService.getEventMarketSegments();
    return segments.map((segment: MarketSegment) => ({
      idMarketSubSegment: Number(segment.id),
      marketSubSegmentName: segment.name,
      marketSegmentName: segment.name,
    }));
  },

  // Subtipos de evento
  getEventSubTypes: async () => {
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

    const types = await apiService.getEventTypes();
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
        idEventSubType: Number(
          type.idEventSubType ?? type.idEventType ?? type.id ?? 0
        ),
        eventSubTypeName:
          type.eventSubTypeName ?? type.eventTypeName ?? type.name,
        eventTypeName: type.eventTypeName ?? type.name,
        idEventType: type.idEventType ?? type.id,
      }))
      .filter((entry: EventSubType) => entry.idEventSubType > 0);
  },

  // Formas de pago
  getEventPaymentForms: () =>
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
        paymentFormName:
          form.paymentFormName ||
          form.paymentFormDescription ||
          "",
      }))
    ),

  // Exenciones de impuestos
  getTaxExemptions: () =>
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
    ).then((response) => response.result?.taxExemptions || []),

  // Propinas extra
  getExtraTips: async () => {
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
        idExtraTip:
          tip.idExtraTip ??
          tip.idExtraTipType ??
          tip.id ??
          0,
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
  },

  // Imprevistos
  getContingencies: () =>
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
    ).then((response) => response.result?.contingencies || []),

  // Responsables del evento del lado del cliente
  getClientEventManagers: (idClient?: number) =>
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
    ).then((response) => response.result?.clientEventManagers || []),

  // Recursos
  getResources: () =>
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
    ).then((response) => response.result?.resources || []),

  // Paquetes de actividad
  getActivityPackages: () =>
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
    ).then((response) => response.result?.activityPackages || []),

  // Calendarios
  getSchedules: (
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
      return Promise.resolve([]);
    }

    const params = new URLSearchParams();
    params.append("eventNumber", String(eventNumber));
    if (idEventActivity)
      params.append("idEventActivity", String(idEventActivity));
    const queryString = params.toString();
    const url = `/events/getschedules?${queryString}`;

    return apiRequest<{ success: boolean; result: { schedules: Schedule[] } }>(
      url,
      {
        method: "GET",
      }
    ).then((response) => response.result?.schedules || []);
  },

  // Crear evento
  createEvent: async (eventPayload: Record<string, unknown>) =>
    apiRequest<{ success: boolean; result?: { eventNumber?: number } }>(
      "/events/event",
      {
        method: "POST",
        body: JSON.stringify({
          Event: eventPayload,
        }),
      }
    ),

  // Actualizar evento
  updateEvent: async (
    eventNumber: number,
    eventPayload: Record<string, unknown>,
    idEvent?: number,
    _options?: {
      stopOnFirstSuccess?: boolean;
    }
  ) => {
    const normalizedEventNumber = Number(eventNumber);
    if (!Number.isFinite(normalizedEventNumber) || normalizedEventNumber <= 0) {
      throw new Error("eventNumber invalido para actualizar el evento.");
    }

    const resolvedIdEvent =
      idEvent ??
      (typeof (eventPayload as any)?.idEvent === "number"
        ? ((eventPayload as any).idEvent as number)
        : undefined);

    const toRequiredString = (value: unknown) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const toRequiredNumber = (value: unknown) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return parsed;
    };

    const required = {
      title: toRequiredString((eventPayload as any)?.title),
      startDate: toRequiredString((eventPayload as any)?.startDate),
      endDate: toRequiredString((eventPayload as any)?.endDate),
      idClient: toRequiredNumber((eventPayload as any)?.idClient),
      idCurrency: toRequiredNumber((eventPayload as any)?.idCurrency),
      idSalesAgent: toRequiredNumber((eventPayload as any)?.idSalesAgent),
      idEventSubsegment: toRequiredNumber((eventPayload as any)?.idEventSubsegment),
      idEventSubtype: toRequiredNumber(
        (eventPayload as any)?.idEventSubtype ??
          (eventPayload as any)?.idEventSubType
      ),
      idEventCharacter: toRequiredNumber((eventPayload as any)?.idEventCharacter),
      idEventSector: toRequiredNumber((eventPayload as any)?.idEventSector),
      idEventSize: toRequiredNumber((eventPayload as any)?.idEventSize),
      estimatedPax: toRequiredNumber((eventPayload as any)?.estimatedPax),
      realPax: toRequiredNumber((eventPayload as any)?.realPax),
    };

    const repetitiveEvent = (eventPayload as any)?.repetitiveEvent;
    const missingRequired: string[] = [];

    (Object.keys(required) as Array<keyof typeof required>).forEach((key) => {
      const value = required[key];
      if (value === null || value === undefined) {
        missingRequired.push(String(key));
      }
    });

    if (typeof repetitiveEvent !== "boolean") {
      missingRequired.push("repetitiveEvent");
    }

    if (missingRequired.length > 0) {
      throw new Error(
        `No se puede actualizar: faltan campos obligatorios (${missingRequired.join(
          ", "
        )}).`
      );
    }

    const cleanOptional = (value: unknown) => {
      if (value === undefined) return undefined;
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      return value;
    };

    const cleanNonNullString = (value: unknown) => {
      if (value === undefined || value === null) return "";
      if (typeof value === "string") return value.trim();
      return String(value);
    };

    const eventForUpdate: Record<string, unknown> = {
      ...(resolvedIdEvent ? { idEvent: resolvedIdEvent } : {}),
      title: required.title,
      description: cleanOptional((eventPayload as any)?.description),
      startDate: required.startDate,
      endDate: required.endDate,
      idClient: required.idClient,
      idCurrency: required.idCurrency,
      discountPercentage: cleanOptional((eventPayload as any)?.discountPercentage),
      idSalesAgent: required.idSalesAgent,
      idEventSubsegment: required.idEventSubsegment,
      idEventSubtype: required.idEventSubtype,
      idEventSubType: required.idEventSubtype,
      idEventCharacter: required.idEventCharacter,
      idEventSector: required.idEventSector,
      idEventSize: required.idEventSize,
      idEventPaymentForm: cleanOptional((eventPayload as any)?.idEventPaymentForm),
      idClientEventManager: cleanOptional(
        (eventPayload as any)?.idClientEventManager
      ),
      idEventCoordinator: cleanOptional((eventPayload as any)?.idEventCoordinator),
      repetitiveEvent,
      estimatedPax: required.estimatedPax,
      realPax: required.realPax,
      contractNumber: cleanNonNullString((eventPayload as any)?.contractNumber),
      reference: cleanNonNullString((eventPayload as any)?.reference),
      comments: cleanNonNullString((eventPayload as any)?.comments),
      internalComments: cleanNonNullString((eventPayload as any)?.internalComments),
      idExemption: cleanOptional((eventPayload as any)?.idExemption),
      idExtraTip: cleanOptional((eventPayload as any)?.idExtraTip),
      extraTipAmount: cleanOptional((eventPayload as any)?.extraTipAmount),
      idContingency: cleanOptional((eventPayload as any)?.idContingency),
      contingenciesAmount: cleanOptional((eventPayload as any)?.contingenciesAmount),
      personalContract: cleanOptional((eventPayload as any)?.personalContract),
      contractAlreadySigned: cleanOptional(
        (eventPayload as any)?.contractAlreadySigned
      ),
      signatureDate: cleanOptional((eventPayload as any)?.signatureDate),
      billingName: cleanNonNullString((eventPayload as any)?.billingName),
      quoteExpirationDate: cleanOptional((eventPayload as any)?.quoteExpirationDate),
      standsQuantity: cleanOptional((eventPayload as any)?.standsQuantity),
      idModificationOper: cleanOptional(
        (eventPayload as any)?.idModificationOper ??
          (eventPayload as any)?.idCreationOper
      ),
      idEventStage: cleanOptional((eventPayload as any)?.idEventStage),
      sustainable: cleanOptional((eventPayload as any)?.sustainable),
      icca: cleanOptional((eventPayload as any)?.icca),
    };

    const response = await apiRequest<{
      success?: boolean;
      errorCode?: number;
      errorMessage?: string;
      message?: string;
      result?: unknown;
    }>(`/events/event/${normalizedEventNumber}`, {
      method: "PUT",
      body: JSON.stringify({ Event: eventForUpdate }),
    });

    const hasSuccessFlag = typeof (response as any)?.success === "boolean";
    const hasErrorCode = typeof (response as any)?.errorCode === "number";
    const isSuccess =
      (!hasSuccessFlag || (response as any).success === true) &&
      (!hasErrorCode || (response as any).errorCode === 0);

    if (!isSuccess) {
      const errorCode = (response as any)?.errorCode;
      const errorMessage =
        (response as any)?.errorMessage ||
        (response as any)?.message ||
        "No se pudo actualizar el evento.";
      throw new Error(
        typeof errorCode === "number"
          ? `${errorMessage} (errorCode ${errorCode})`
          : errorMessage
      );
    }

    return {
      attempt: "PUT /events/event/{eventNumber} (Event wrapper, strict)",
      response,
    };
  },

  // Crear actividad dentro de un evento
  addEventActivity: async (
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
    ),

  // Reservar salon a una actividad
  addActivityRoom: async (
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
    ),

  // Agregar servicio a una actividad
  addActivityService: async (
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
    ),

  // Eventos
  // Optimización: soporta búsqueda directa por ID y nombre usando parámetros de la API
  getEvents: async (
    startDate?: string,
    endDate?: string,
    eventNumber?: string,
    eventName?: string
  ) => {
    // Si se proporciona eventNumber, buscar por identificador específico (ID de Evento en Skill)
    if (eventNumber) {
      const numericEventNumber = Number(eventNumber);
      return withFallback(
        () =>
          apiRequest<
            | { success: boolean; result?: { events?: Event[] } }
            | { events?: Event[] }
            | Event[]
          >("/events", {
            method: "POST",
            body: JSON.stringify({
              Events: {
                eventNumber: numericEventNumber,
              },
            }),
          }),
        () =>
          apiRequest<{
            success: boolean;
            errorCode: number;
            result: { events: Event[] };
          }>("/GetEvents", {
            method: "POST",
            body: buildPayload({
              eventNumber: numericEventNumber,
            }),
          })
      ).then((payload) => {
        let events: Event[] = [];
        if (Array.isArray(payload)) events = payload as Event[];
        else if (Array.isArray((payload as any)?.events))
          events = (payload as any).events;
        else if (Array.isArray((payload as any)?.result?.events))
          events = (payload as any).result.events;

        if (!events || events.length === 0) return [];

        return events.filter((eventItem: Event) => {
          const eventNumberValue = (eventItem as any)?.eventNumber;
          const idValue = eventItem?.idEvent;
          return (
            eventNumberValue?.toString() === eventNumber ||
            idValue?.toString() === eventNumber
          );
        });
      });
    }

    // Si se proporciona eventName, buscar por título (filtrado local por rendimiento)
    if (eventName) {
      // Estrategia optimizada: buscar en rangos progresivos con manejo de errores y timeout
      const now = new Date();
      const searchRanges = [
        { years: 1, label: "1 año" }, // 1 año atrás + 1 año adelante = 2 años
        { years: 2, label: "2 años" }, // 2 años atrás + 2 años adelante = 4 años
        { years: 5, label: "5 años" }, // 5 años atrás + 5 años adelante = 10 años
      ];

      for (const range of searchRanges) {
        try {
          const startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - range.years);
          const searchStartDate = startDate.toISOString().split("T")[0];

          const endDate = new Date(now);
          endDate.setFullYear(now.getFullYear() + range.years);
          const searchEndDate = endDate.toISOString().split("T")[0];

          console.log(
            `Buscando eventos en rango de ${range.label} (${searchStartDate} a ${searchEndDate}) para nombre: "${eventName}"`
          );

          // Agregar timeout para evitar que la búsqueda se quede colgada
          const timeoutPromise = new Promise<never>(
            (_, reject) =>
              setTimeout(
                () =>
                  reject(new Error(`Timeout en búsqueda de ${range.label}`)),
                15000
              ) // 15 segundos timeout
          );

          const searchPromise = withFallback(
            () =>
              apiRequest<
                | { success: boolean; result?: { events?: Event[] } }
                | { events?: Event[] }
                | Event[]
              >("/events", {
                method: "POST",
                body: JSON.stringify({
                  Events: {
                    startDate: searchStartDate,
                    endDate: searchEndDate,
                  },
                }),
              }),
            () =>
              apiRequest<{
                success: boolean;
                errorCode: number;
                result: { events: Event[] };
              }>("/GetEvents", {
                method: "POST",
                body: buildPayload({
                  startDate: searchStartDate,
                  endDate: searchEndDate,
                }),
              })
          ).then((payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray((payload as any)?.events))
              return (payload as any).events;
            if (Array.isArray((payload as any)?.result?.events))
              return (payload as any).result.events;
            return [];
          });

          const eventsInRange = await Promise.race([
            searchPromise,
            timeoutPromise,
          ]);

          console.log(
            `Encontrados ${eventsInRange.length} eventos en rango de ${range.label}`
          );

          // Filtrar localmente por nombre (búsqueda parcial e insensible a mayúsculas)
          const filteredEvents = eventsInRange.filter(
            (event: Event) =>
              event.title &&
              event.title.toLowerCase().includes(eventName.toLowerCase())
          );

          console.log(
            `Después de filtrar por nombre "${eventName}": ${filteredEvents.length} eventos`
          );

          // Si encontramos resultados, devolverlos
          if (filteredEvents.length > 0) {
            console.log(
              `¡Encontrados ${filteredEvents.length} eventos que coinciden con "${eventName}"!`
            );
            return filteredEvents;
          }

          // Si no encontramos en este rango, continuar con el siguiente rango más amplio
          console.log(
            `No se encontraron eventos con nombre "${eventName}" en rango de ${range.label}, expandiendo búsqueda...`
          );
        } catch (error) {
          console.error(`Error al buscar en rango de ${range.label}:`, error);
          // Continuar con el siguiente rango en caso de error
          continue;
        }
      }

      // Si llegamos aquí, no encontramos nada en ningún rango
      console.log(
        `No se encontraron eventos con nombre "${eventName}" en ningún rango de búsqueda`
      );
      return [];
    }

    // Si no se proporcionan fechas, usar rango del año actual
    const now = new Date();
    const defaultStart = startDate || `${now.getFullYear()}-01-01`;
    const defaultEnd = endDate || `${now.getFullYear()}-12-31`;

    return withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { events?: Event[] } }
          | { events?: Event[] }
          | Event[]
        >("/events", {
          method: "POST",
          body: JSON.stringify({
            Events: {
              startDate: defaultStart,
              endDate: defaultEnd,
            },
          }),
        }),
      () =>
        apiRequest<{
          success: boolean;
          errorCode: number;
          result: { events: Event[] };
        }>("/GetEvents", {
          method: "POST",
          body: buildPayload({
            startDate: defaultStart,
            endDate: defaultEnd,
          }),
        })
    ).then((payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.events))
        return (payload as any).events;
      if (Array.isArray((payload as any)?.result?.events))
        return (payload as any).result.events;
      return [];
    });
  },

  // Cotización de eventos
  // Intenta primero la ruta REST (prefijo /events) y luego la ruta legacy /GetEventQuote
  getEventQuote: async (eventId: string) => {
    return withFallback(
      () =>
        apiRequest<any>("/events/geteventquote", {
          method: "POST",
          body: JSON.stringify({
            eventId,
          }),
        }),
      () =>
        apiRequest<any>("/GetEventQuote", {
          method: "POST",
          body: buildPayload({ eventId }),
        })
    ).then((payload) => {
      // Normalizar payload: algunos endpoints envuelven en result o quote
      if (!payload) return null;
      if ((payload as any)?.result?.quote) return (payload as any).result.quote;
      if ((payload as any)?.result) return (payload as any).result;
      if ((payload as any)?.quote) return (payload as any).quote;
      return payload;
    });
  },

  // Facturas
  getEventInvoices: (eventId: string) =>
    apiRequest<EventInvoice[]>("/GetEventInvoices", {
      method: "POST",
      body: JSON.stringify({
        companyAuthId: API_CONFIG.companyAuthId,
        idData: API_CONFIG.idData,
        eventId,
      }),
    }),

  // Salones disponibles
  getAvailableRooms: async (
    startDate: string,
    endDate: string
  ): Promise<Room[]> => {
    // Intentaremos usar la API de disponibilidad; si falla o no entrega datos útiles,
    // caemos a un fallback que infiere ocupación desde los eventos en el rango.
    const allRooms = await apiService.getRooms();

    try {
      const availability = await apiService.getRoomsAvailability(
        startDate,
        endDate
      );

      // Si la API devolvió algo razonable, procesarlo
      if (Array.isArray(availability) && availability.length > 0) {
        // Generar la lista de fechas en el rango (yyyy-MM-dd)
        const dates: string[] = [];
        let d = new Date(startDate + "T00:00:00");
        const dEnd = new Date(endDate + "T00:00:00");
        while (d <= dEnd) {
          dates.push(d.toISOString().split("T")[0]);
          d.setDate(d.getDate() + 1);
        }

        console.log("RoomsAvailability entries:", availability.length);
        if (availability.length > 0)
          console.log("Sample availability:", availability.slice(0, 3));

        const availMap = new Map<number, Set<string>>();
        availability.forEach((entry: any) => {
          // Diferentes formas en que puede venir el id de sala
          const rid = Number(
            entry.roomId ??
              entry.room?.idRoom ??
              entry.room?.id ??
              entry.idRoom ??
              entry.id
          );
          if (Number.isNaN(rid)) return;
          const rawDate =
            entry.date ??
            entry.availabilityDate ??
            entry.day ??
            entry.fecha ??
            entry.Date;
          if (!rawDate) return;
          const parsed = new Date(rawDate + "");
          if (isNaN(parsed.getTime())) return;
          const date = parsed.toISOString().split("T")[0];
          const availableFlag =
            entry.available === true ||
            entry.available === "true" ||
            entry.available === 1 ||
            entry.available === "1";
          if (!availableFlag) return;
          if (!availMap.has(rid)) availMap.set(rid, new Set<string>());
          availMap.get(rid)!.add(date);
        });

        const availableRooms = allRooms.filter((room: Room) => {
          if (!room.roomActive) return false;
          const rid = Number(room.idRoom);
          const set = availMap.get(rid);
          if (!set) return false;
          for (const date of dates) {
            if (!set.has(date)) return false;
          }
          return true;
        });

        return availableRooms;
      }

      // Si la API devolvió array vacío, continuar a fallback
      console.warn(
        "GetRoomsAvailability devolvió arreglo vacío, usando fallback por eventos"
      );
    } catch (err) {
      console.warn(
        "GetRoomsAvailability falló, usando fallback por eventos:",
        err
      );
    }

    // --- Fallback: inferir ocupación desde eventos/schedules en el rango ---
    try {
      const [events, schedulesPayload] = await Promise.all([
        apiService.getEvents(startDate, endDate),
        apiService.getSchedules(startDate, endDate).catch((scheduleError) => {
          console.warn(
            "No se pudo obtener schedules, se continúa solo con eventos:",
            scheduleError
          );
          return [] as Schedule[];
        }),
      ]);

      const normalizeForCompare = (s: string) =>
        s && typeof s === "string" && (s as any).normalize
          ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
          : s;

      const blockingStatuses = new Set<string>([
        "confirmado",
        "por confirmar",
        "reunion interna",
        "evento interno",
      ]);

      // Helpers para normalizar fechas y gestionar intervalos
      const extractDateToken = (value: any): string | null => {
        if (value == null) return null;
        const str = String(value).trim();
        if (!str) return null;
        const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        return null;
      };

      const startRange = startDate;
      const endRange = endDate;

      const rangeOverlaps = (startA: string | null, endA: string | null) => {
        if (!startA || !endA) return true; // si no tenemos fechas precisas, asumir overlap por seguridad
        const aStart = startA < endRange ? startA : endRange;
        const aEnd = endA > startRange ? endA : startRange;
        if (aEnd < startRange) return false;
        if (aStart > endRange) return false;
        return !(aEnd < startRange || aStart > endRange);
      };

      const validRoomIds = new Set<number>(
        allRooms.map((r: Room) => Number(r.idRoom))
      );
      const roomNameMap = new Map<string, number[]>();
      allRooms.forEach((room: Room) => {
        const key = String(room.roomName || "")
          .trim()
          .toLowerCase();
        if (!roomNameMap.has(key)) roomNameMap.set(key, []);
        roomNameMap.get(key)!.push(Number(room.idRoom));
      });

      const resolveRoomIds = (rawIds: Set<number>, rawNames: Set<string>) => {
        const resolved = new Set<number>();
        const unmatchedIds: number[] = [];
        rawIds.forEach((id) => {
          if (validRoomIds.has(id)) {
            resolved.add(id);
          } else {
            unmatchedIds.push(id);
          }
        });

        const unmatchedNames: string[] = [];
        rawNames.forEach((name) => {
          if (!name) return;
          const normalized = name.trim().toLowerCase();
          if (!normalized) return;
          const exact = roomNameMap.get(normalized);
          if (exact && exact.length > 0) {
            exact.forEach((id) => resolved.add(id));
            return;
          }
          let matched = false;
          for (const [key, ids] of roomNameMap.entries()) {
            if (key.includes(normalized) || normalized.includes(key)) {
              ids.forEach((id) => resolved.add(id));
              matched = true;
            }
          }
          if (!matched) unmatchedNames.push(normalized);
        });

        return { resolved, unmatchedIds, unmatchedNames };
      };

      const extractRoomRefs = (
        source: any,
        outIds: Set<number>,
        outNames: Set<string>,
        depth = 0
      ) => {
        if (source == null || depth > 6) return;
        if (typeof source === "number") {
          outIds.add(source);
          return;
        }
        if (typeof source === "string") {
          const trimmed = source.trim();
          if (trimmed) outNames.add(trimmed.toLowerCase());
          return;
        }
        if (Array.isArray(source)) {
          source.forEach((item) =>
            extractRoomRefs(item, outIds, outNames, depth + 1)
          );
          return;
        }
        if (typeof source === "object") {
          const maybeId =
            source.idRoom ??
            source.roomId ??
            source.id ??
            source.room?.idRoom ??
            source.room?.id ??
            source.idSalon ??
            source.salonId;
          if (maybeId !== undefined && maybeId !== null) {
            const parsed = Number(maybeId);
            if (!Number.isNaN(parsed)) outIds.add(parsed);
          }

          const maybeName =
            source.roomName ??
            source.name ??
            source.room?.roomName ??
            source.room?.name ??
            source.salonName ??
            source.salon ??
            source.descripcionSalon;
          if (maybeName) {
            const nm = String(maybeName).trim().toLowerCase();
            if (nm) outNames.add(nm);
          }

          for (const key of Object.keys(source)) {
            try {
              const val = source[key];
              if (
                key.toLowerCase().includes("room") ||
                key.toLowerCase().includes("salon") ||
                Array.isArray(val) ||
                typeof val === "object"
              ) {
                extractRoomRefs(val, outIds, outNames, depth + 1);
              }
            } catch (error) {
              // ignore
            }
          }
        }
      };

      const schedulesList = (() => {
        if (Array.isArray(schedulesPayload)) return schedulesPayload as any[];
        if (Array.isArray((schedulesPayload as any)?.schedules))
          return (schedulesPayload as any).schedules;
        if (Array.isArray((schedulesPayload as any)?.result?.schedules))
          return (schedulesPayload as any).result.schedules;
        return [] as any[];
      })();

      const schedulesByEvent = new Map<number, any[]>();
      schedulesList.forEach((scheduleEntry: any) => {
        const eventIdCandidate = Number(
          scheduleEntry.eventId ??
            scheduleEntry.idEvent ??
            scheduleEntry.idEvento ??
            scheduleEntry.id ??
            scheduleEntry.event?.idEvent
        );
        if (Number.isNaN(eventIdCandidate)) return;
        if (!schedulesByEvent.has(eventIdCandidate)) {
          schedulesByEvent.set(eventIdCandidate, []);
        }
        schedulesByEvent.get(eventIdCandidate)!.push(scheduleEntry);
      });

      const occupiedRooms = new Set<number>();

      events.forEach((ev: any, idx: number) => {
        const eventId = Number(ev.idEvent ?? ev.eventId ?? ev.id);
        if (Number.isNaN(eventId)) {
          console.debug(`Evento[${idx}] sin idEvent válido`, ev);
          return;
        }

        const statusCandidates: string[] = [];
        try {
          if (ev.eventStatus) {
            statusCandidates.push(
              String(
                ev.eventStatus.name ??
                  ev.eventStatus.eventStatusName ??
                  ev.eventStatus.statusName ??
                  ev.eventStatus.eventStatus ??
                  ""
              )
            );
          }
        } catch (error) {}
        try {
          if (ev.status) statusCandidates.push(String(ev.status));
        } catch (error) {}
        try {
          if (ev.statusName) statusCandidates.push(String(ev.statusName));
        } catch (error) {}
        try {
          if (ev.eventStatusName)
            statusCandidates.push(String(ev.eventStatusName));
        } catch (error) {}

        const statusRaw =
          statusCandidates
            .map((s) => s.trim())
            .find((s) => s && s.length > 0) || "";
        const statusNormalized = normalizeForCompare(
          statusRaw.toLowerCase()
        ).toLowerCase();

        if (!blockingStatuses.has(statusNormalized)) {
          console.debug(
            `Evento[${idx}] #${eventId} con estatus '${statusRaw}' (norm: '${statusNormalized}') no bloquea salas`
          );
          return;
        }

        const eventStartStr = extractDateToken(
          ev.startDate ?? ev.eventStartDate ?? ev.start ?? ev.fechaInicio
        );
        const eventEndStr =
          extractDateToken(
            ev.endDate ?? ev.eventEndDate ?? ev.end ?? ev.fechaFin
          ) || eventStartStr;

        if (!rangeOverlaps(eventStartStr, eventEndStr)) {
          console.debug(
            `Evento[${idx}] #${eventId} con estatus bloqueante no se solapa con el rango solicitado`
          );
          return;
        }

        const collectedIds = new Set<number>();
        const collectedNames = new Set<string>();

        extractRoomRefs(
          ev.eventRooms ?? ev.rooms ?? ev.Rooms ?? ev.eventRoomsList,
          collectedIds,
          collectedNames
        );
        extractRoomRefs(ev, collectedIds, collectedNames);

        const relatedSchedules = schedulesByEvent.get(eventId) ?? [];
        relatedSchedules.forEach((scheduleEntry) => {
          extractRoomRefs(scheduleEntry, collectedIds, collectedNames);
        });

        const { resolved, unmatchedIds, unmatchedNames } = resolveRoomIds(
          collectedIds,
          collectedNames
        );

        if (resolved.size === 0) {
          console.debug(
            `Evento[${idx}] #${eventId} (${statusRaw}) sin salones detectables. ids detectados: ${Array.from(
              collectedIds
            )}, nombres detectados: ${Array.from(
              collectedNames
            )}, ids descartados: ${unmatchedIds}, nombres no encontrados: ${unmatchedNames}`
          );
          console.debug(`Evento[${idx}] sample:`, ev);
          return;
        }

        resolved.forEach((roomId) => occupiedRooms.add(roomId));
        console.debug(
          `Evento[${idx}] #${eventId} (${statusRaw}) -> salones ocupados:`,
          Array.from(resolved)
        );
      });

      console.log(
        `Inferencia por eventos: ${events.length} eventos, ${occupiedRooms.size} salones ocupados detectados`
      );

      const availableRooms = allRooms.filter((room: Room) => {
        if (!room.roomActive) return false;
        const roomId = Number(room.idRoom);
        return !occupiedRooms.has(roomId);
      });

      return availableRooms;
    } catch (err) {
      console.error("Fallback por eventos falló:", err);
      return [];
    }
  },

  // Clientes
  getClients: async (): Promise<Client[]> => {
    try {
      // Intentar endpoint directo de clientes primero
      const response = await withFallback(
        () =>
          apiRequest<
            | { success: boolean; result?: { clients?: Client[] } }
            | { clients?: Client[] }
            | Client[]
          >("/clients", {
            method: "GET",
          }),
        () =>
          apiRequest<
            | { success: boolean; result?: { clients?: Client[] } }
            | { clients?: Client[] }
            | Client[]
          >("/GetClients", {
            method: "POST",
            body: buildPayload(),
          })
      );

      // Normalizar respuesta
      let clients: Client[] = [];
      if (Array.isArray(response)) {
        clients = response;
      } else if (Array.isArray((response as any)?.clients)) {
        clients = (response as any).clients;
      } else if (Array.isArray((response as any)?.result?.clients)) {
        clients = (response as any).result.clients;
      }

      return clients;
    } catch (error) {
      console.warn(
        "Endpoint de clientes falló, extrayendo desde eventos:",
        error
      );
      // Fallback: extraer clientes desde eventos
      const events = await apiService.getEvents("2025-01-01", "2025-12-31");
      const clientMap = new Map<string, Client>();

      events.forEach((event: any) => {
        if (event.client) {
          const client = event.client;
          const key = client.clientCode || client.idClient || client.clientName;
          if (key && !clientMap.has(key)) {
            clientMap.set(key, {
              idClient: client.idClient,
              clientCode: client.clientCode || "",
              clientName: client.clientName || "",
              tradeName: client.tradeName,
              legalName: client.legalName,
              address: client.address,
              identificationNumber: client.identificationNumber,
              email: client.email,
              location: client.location,
              city: client.city,
              zipcode: client.zipcode,
              province: client.province,
              phone: client.phone,
              idIdentificationType: client.idIdentificationType,
              idProfileType: client.idProfileType,
              firstName: client.firstName,
              lastName: client.lastName,
            });
          }
        }
      });

      return Array.from(clientMap.values());
    }
  },

  // Contactos
  getContacts: async (): Promise<Contact[]> => {
    try {
      // Intentar endpoint directo de contactos primero
      const response = await withFallback(
        () =>
          apiRequest<
            | { success: boolean; result?: { contacts?: Contact[] } }
            | { contacts?: Contact[] }
            | Contact[]
          >("/contacts", {
            method: "GET",
          }),
        () =>
          apiRequest<
            | { success: boolean; result?: { contacts?: Contact[] } }
            | { contacts?: Contact[] }
            | Contact[]
          >("/GetContacts", {
            method: "POST",
            body: buildPayload(),
          })
      );

      // Normalizar respuesta
      let contacts: Contact[] = [];
      if (Array.isArray(response)) {
        contacts = response;
      } else if (Array.isArray((response as any)?.contacts)) {
        contacts = (response as any).contacts;
      } else if (Array.isArray((response as any)?.result?.contacts)) {
        contacts = (response as any).result.contacts;
      }

      return contacts;
    } catch (error) {
      console.warn(
        "Endpoint de contactos falló, extrayendo desde eventos:",
        error
      );
      // Fallback: extraer contactos desde eventos
      const events = await apiService.getEvents("2025-01-01", "2025-12-31");
      const contactMap = new Map<string, Contact>();

      events.forEach((event: any) => {
        if (event.clientEventManager) {
          const contact = event.clientEventManager;
          const key =
            contact.idClientEventManager ||
            contact.clientEventManagerEmail ||
            contact.clientEventManagerName;
          if (key && !contactMap.has(String(key))) {
            contactMap.set(String(key), {
              idClientEventManager: contact.idClientEventManager,
              clientEventManagerName: contact.clientEventManagerName || "",
              clientEventManagerEmail: contact.clientEventManagerEmail,
              clientEventManagerMobilePhone:
                contact.clientEventManagerMobilePhone,
              clientEventManagerPhone: contact.clientEventManagerPhone,
              client: event.client,
              idClient: contact.idClient || event.client?.idClient,
              firstName: contact.firstName,
              lastName: contact.lastName,
              position: contact.position,
              department: contact.department,
            });
          }
        }
      });

      return Array.from(contactMap.values());
    }
  },
};
