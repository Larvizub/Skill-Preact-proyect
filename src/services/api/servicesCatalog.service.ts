import type { Service, ServiceRate } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type GetEvents = (
  startDate?: string,
  endDate?: string,
  eventNumber?: string,
  eventName?: string
) => Promise<any[]>;

type CreateServicesCatalogServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
  getEvents: GetEvents;
};

type GetServicesOptions = {
  includeRates?: boolean;
  forceRefresh?: boolean;
};

export function createServicesCatalogService({
  apiRequest,
  buildPayload,
  withFallback,
  getEvents,
}: CreateServicesCatalogServiceDeps) {
  const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
  let servicesCatalogCache:
    | {
        data: Service[];
        expiresAt: number;
      }
    | null = null;
  let servicesCatalogInFlight: Promise<Service[]> | null = null;

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

  const normalizeServicesPayload = (payload: unknown) => {
    let raw: any[] = [];
    if (Array.isArray(payload)) raw = payload as any[];
    else if (Array.isArray((payload as any)?.services)) raw = (payload as any).services;
    else if (Array.isArray((payload as any)?.result?.services))
      raw = (payload as any).result.services;

    return raw.map((service: any) => {
      const priceTI = pickFirstNumber(service, withTaxKeys);
      const priceTNI = pickFirstNumber(service, withoutTaxKeys);

      let finalPriceTI = service.priceTI ?? priceTI;
      let finalPriceTNI = service.priceTNI ?? priceTNI;
      if (finalPriceTNI === undefined && finalPriceTI !== undefined) {
        finalPriceTNI = undefined;
      }
      if (finalPriceTI === undefined && finalPriceTNI !== undefined) {
        finalPriceTI = undefined;
      }

      return {
        ...service,
        priceTI: finalPriceTI,
        priceTNI: finalPriceTNI,
      } as Service;
    });
  };

  const fetchNormalizedServices = () =>
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
    ).then(normalizeServicesPayload);

  const getServicesCatalogFast = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && servicesCatalogCache && servicesCatalogCache.expiresAt > now) {
      return servicesCatalogCache.data;
    }

    if (!forceRefresh && servicesCatalogInFlight) {
      return servicesCatalogInFlight;
    }

    servicesCatalogInFlight = fetchNormalizedServices()
      .then((normalized) => {
        servicesCatalogCache = {
          data: normalized,
          expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
        };
        return normalized;
      })
      .finally(() => {
        servicesCatalogInFlight = null;
      });

    return servicesCatalogInFlight;
  };

  const getServices = async ({
    includeRates = true,
    forceRefresh = false,
  }: GetServicesOptions = {}) => {
    const normalized = await getServicesCatalogFast(forceRefresh);

    if (!includeRates) {
      return normalized;
    }

      const parseRatesRaw = (ratesPayload: any) => {
        if (Array.isArray(ratesPayload)) return ratesPayload;
        if (Array.isArray(ratesPayload?.serviceRates)) return ratesPayload.serviceRates;
        if (Array.isArray(ratesPayload?.result?.serviceRates))
          return ratesPayload.result.serviceRates;
        return [] as any[];
      };

      const extractEventActivityIdsDeep = (
        source: unknown,
        output: Set<number>,
        depth = 0
      ) => {
        if (!source || depth > 6) return;

        if (Array.isArray(source)) {
          source.forEach((item) =>
            extractEventActivityIdsDeep(item, output, depth + 1)
          );
          return;
        }

        if (typeof source !== "object") return;

        const node = source as Record<string, unknown>;
        const maybeId = Number(
          node.idEventActivity ?? node.eventActivityId ?? node.idActivity
        );
        if (Number.isFinite(maybeId) && maybeId > 0) output.add(maybeId);

        Object.values(node).forEach((value) => {
          if (value && (typeof value === "object" || Array.isArray(value))) {
            extractEventActivityIdsDeep(value, output, depth + 1);
          }
        });
      };

      const resolveCandidateEventActivityIds = async () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = `${currentYear}-12-31`;

        try {
          const events = await getEvents(startDate, endDate);
          const ids = new Set<number>();
          extractEventActivityIdsDeep(events, ids);
          return Array.from(ids).slice(0, 12);
        } catch {
          return [] as number[];
        }
      };

      const serviceIds = Array.from(
        new Set(
          normalized
            .map((service) => Number((service as any).idService))
            .filter((id) => Number.isFinite(id) && id > 0)
        )
      );

      const fetchServiceRatesByActivity = async (idEventActivity: number) => {
        const now = new Date();
        const dateCandidates = [
          now.toISOString().slice(0, 10),
          `${now.getFullYear()}-01-01`,
          `${now.getFullYear()}-12-31`,
        ];

        for (const priceDate of dateCandidates) {
          const payloads = [
            buildPayload({
              serviceRates: {
                idEventActivity,
                priceDate,
                ...(serviceIds.length > 0 ? { serviceList: serviceIds } : {}),
              },
            }),
            buildPayload({
              idEventActivity,
              priceDate,
              ...(serviceIds.length > 0 ? { serviceList: serviceIds } : {}),
            }),
          ];

          for (const body of payloads) {
            try {
              const ratesPayload = await apiRequest<any>("/events/getservicerates", {
                method: "POST",
                body,
              });

              const ratesRaw = parseRatesRaw(ratesPayload);
              if (ratesRaw.length > 0) return ratesRaw;
            } catch {
              // noop
            }
          }
        }

        return [] as any[];
      };

      // Además, intentar obtener tarifas actualizadas desde GetServiceRates
      try {
        let ratesRaw = await fetchServiceRatesByActivity(0);

        if (ratesRaw.length === 0) {
          const candidateActivityIds = await resolveCandidateEventActivityIds();
          for (const idEventActivity of candidateActivityIds) {
            ratesRaw = await fetchServiceRatesByActivity(idEventActivity);
            if (ratesRaw.length > 0) break;
          }
        }

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

          rateMap.set(id, { raw: r, priceList: chosenPriceList });
        }

        const merged = normalized.map((s: any) => {
          const entry = rateMap.get(Number(s.idService));
          if (entry && entry.priceList) {
            const pl = entry.priceList;
            // Acceder directamente a los campos correctos
            const inc = pl.servicePriceTaxesIncluded;
            const notInc = pl.servicePriceTaxesNotIncluded;

            return {
              ...s,
              priceTI: inc ?? s.priceTI,
              priceTNI: notInc ?? s.priceTNI,
            } as Service;
          }
          return s;
        });
        return merged;
      } catch (err) {
        // Si falla obtener tarifas, retornamos la lista normalizada sin merge
        console.warn("getServices: no se pudo obtener GetServiceRates:", err);
        return normalized;
      }
    };

  const getServiceRates = () =>
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
    );

  return {
    getServices,
    getServicesCatalogFast,
    getServiceRates,
  };
}
