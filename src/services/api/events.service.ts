import type { Event, EventInvoice } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type CreateEventsServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
};

export function createEventsService({
  apiRequest,
  buildPayload,
  withFallback,
}: CreateEventsServiceDeps) {
  return {
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

    // Actualizar evento (estricto según doc oficial)
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
        idEventSubsegment: toRequiredNumber(
          (eventPayload as any)?.idEventSubsegment
        ),
        idEventSubtype: toRequiredNumber(
          (eventPayload as any)?.idEventSubtype ?? (eventPayload as any)?.idEventSubType
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
        description: cleanNonNullString((eventPayload as any)?.description),
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
        idClientEventManager: cleanOptional((eventPayload as any)?.idClientEventManager),
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
        contractAlreadySigned: cleanOptional((eventPayload as any)?.contractAlreadySigned),
        signatureDate: cleanOptional((eventPayload as any)?.signatureDate),
        billingName: cleanNonNullString((eventPayload as any)?.billingName),
        quoteExpirationDate: cleanOptional((eventPayload as any)?.quoteExpirationDate),
        standsQuantity: cleanOptional((eventPayload as any)?.standsQuantity),
        idModificationOper: cleanOptional(
          (eventPayload as any)?.idModificationOper ?? (eventPayload as any)?.idCreationOper
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
          { years: 1, label: "1 año" },
          { years: 2, label: "2 años" },
          { years: 5, label: "5 años" },
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

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Timeout en búsqueda de ${range.label}`)),
                15000
              )
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

            const filteredEvents = eventsInRange.filter(
              (event: Event) =>
                event.title &&
                event.title.toLowerCase().includes(eventName.toLowerCase())
            );

            console.log(
              `Después de filtrar por nombre "${eventName}": ${filteredEvents.length} eventos`
            );

            if (filteredEvents.length > 0) {
              console.log(
                `¡Encontrados ${filteredEvents.length} eventos que coinciden con "${eventName}"!`
              );
              return filteredEvents;
            }

            console.log(
              `No se encontraron eventos con nombre "${eventName}" en rango de ${range.label}, expandiendo búsqueda...`
            );
          } catch (error) {
            console.error(`Error al buscar en rango de ${range.label}:`, error);
            continue;
          }
        }

        console.log(
          `No se encontraron eventos con nombre "${eventName}" en ningún rango de búsqueda`
        );
        return [];
      }

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
        if (Array.isArray((payload as any)?.events)) return (payload as any).events;
        if (Array.isArray((payload as any)?.result?.events))
          return (payload as any).result.events;
        return [];
      });
    },

    // Cotización de eventos
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
        body: buildPayload({ eventId }),
      }),
  };
}
