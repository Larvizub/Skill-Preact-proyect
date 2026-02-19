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

type GetSchedules = (
  startDate?: string,
  endDate?: string,
  eventNumber?: number,
  idEventActivity?: number
) => Promise<any[]>;

type CreateServicesCatalogServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
  getEvents: GetEvents;
  getSchedules: GetSchedules;
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
  getSchedules,
}: CreateServicesCatalogServiceDeps) {
  const SERVICES_WITH_RATES_CACHE_TTL_MS = 2 * 60 * 1000;
  let lastSuccessfulServiceRatesActivityId: number | null = null;

  const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
  let servicesCatalogCache:
    | {
        data: Service[];
        expiresAt: number;
      }
    | null = null;
  let servicesCatalogInFlight: Promise<Service[]> | null = null;
  let servicesWithRatesCache:
    | {
        data: Service[];
        expiresAt: number;
      }
    | null = null;
  let servicesWithRatesInFlight: Promise<Service[]> | null = null;
  let serviceRatesActivityIdsCache:
    | {
        ids: number[];
        expiresAt: number;
      }
    | null = null;

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
    const now = Date.now();

    if (includeRates && !forceRefresh && servicesWithRatesCache) {
      if (servicesWithRatesCache.expiresAt > now) {
        return servicesWithRatesCache.data;
      }
    }

    if (includeRates && !forceRefresh && servicesWithRatesInFlight) {
      return servicesWithRatesInFlight;
    }

    const normalized = await getServicesCatalogFast(forceRefresh);

    if (!includeRates) {
      return normalized;
    }

    const resolveServicesWithRates = async () => {

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
        const cacheNow = Date.now();
        if (serviceRatesActivityIdsCache && serviceRatesActivityIdsCache.expiresAt > cacheNow) {
          return serviceRatesActivityIdsCache.ids;
        }

        const currentYear = new Date().getFullYear();
        const ids = new Set<number>();

        const yearRanges = [
          { start: `${currentYear}-01-01`, end: `${currentYear}-12-31` },
          { start: `${currentYear - 1}-01-01`, end: `${currentYear - 1}-12-31` },
        ];

        try {
          for (const range of yearRanges) {
            const events = await getEvents(range.start, range.end);
            extractEventActivityIdsDeep(events, ids);

            const eventNumbers = Array.from(
              new Set(
                (events || [])
                  .map((event: any) => Number(event?.eventNumber ?? event?.idEvent))
                  .filter((value: number) => Number.isFinite(value) && value > 0)
              )
            ).slice(0, 40);

            for (const eventNumber of eventNumbers) {
              try {
                const schedules = await getSchedules(
                  undefined,
                  undefined,
                  eventNumber
                );

                extractEventActivityIdsDeep(schedules, ids);
                if (ids.size >= 60) break;
              } catch {
                // noop
              }
            }

            if (ids.size >= 60) break;
          }

          const resolved = Array.from(ids)
            .sort((a, b) => b - a)
            .slice(0, 60);

          serviceRatesActivityIdsCache = {
            ids: resolved,
            expiresAt: cacheNow + SERVICES_WITH_RATES_CACHE_TTL_MS,
          };

          return resolved;
        } catch {
          return [] as number[];
        }
      };

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
              },
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

      const pickActivePriceList = (rateNode: any, todayStr: string) => {
        const lists = Array.isArray(rateNode?.priceLists)
          ? rateNode.priceLists
          : rateNode?.priceList
          ? [rateNode.priceList]
          : [];

        if (lists.length === 0) return null;

        const activeInRange = lists.find(
          (item: any) =>
            item?.priceListActive === true &&
            (!item?.priceListFromDate ||
              !item?.priceListToDate ||
              (item.priceListFromDate <= todayStr &&
                item.priceListToDate >= todayStr))
        );

        if (activeInRange) return activeInRange;

        const active = lists.find((item: any) => item?.priceListActive === true);
        return active || lists[0] || null;
      };

      // Además, intentar obtener tarifas actualizadas desde GetServiceRates
      try {
        const rateMap = new Map<number, any>();
        const todayStr = new Date().toISOString().slice(0, 10);

        const upsertRates = (ratesRaw: any[]) => {
          for (const rateNode of ratesRaw) {
            const id = Number(
              rateNode?.idService ?? rateNode?.id ?? rateNode?.serviceId ?? NaN
            );
            if (!Number.isFinite(id) || id <= 0) continue;

            const chosenPriceList = pickActivePriceList(rateNode, todayStr);
            const hasValidPrice =
              Number.isFinite(Number(chosenPriceList?.servicePriceTaxesIncluded)) ||
              Number.isFinite(Number(chosenPriceList?.servicePriceTaxesNotIncluded));

            const existing = rateMap.get(id);
            if (!existing || (!existing.hasValidPrice && hasValidPrice)) {
              rateMap.set(id, {
                raw: rateNode,
                priceList: chosenPriceList,
                hasValidPrice,
              });
            }
          }
        };

        const targetServiceIds = new Set<number>(
          normalized
            .map((service) => Number((service as any).idService))
            .filter((id) => Number.isFinite(id) && id > 0)
        );

        const candidateActivityIds = await resolveCandidateEventActivityIds();
        const orderedActivities = [
          ...(lastSuccessfulServiceRatesActivityId
            ? [lastSuccessfulServiceRatesActivityId]
            : []),
          0,
          ...candidateActivityIds,
        ].filter((id, index, list) => Number.isFinite(id) && id >= 0 && list.indexOf(id) === index);

        let attempts = 0;
        for (const idEventActivity of orderedActivities) {
          const ratesRaw = await fetchServiceRatesByActivity(idEventActivity);
          if (ratesRaw.length === 0) continue;

          attempts += 1;
          upsertRates(ratesRaw);
          lastSuccessfulServiceRatesActivityId = idEventActivity;

          if (rateMap.size >= targetServiceIds.size) break;
          if (attempts >= 8 && rateMap.size > 0) break;
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

        servicesWithRatesCache = {
          data: merged,
          expiresAt: Date.now() + SERVICES_WITH_RATES_CACHE_TTL_MS,
        };

        return merged;
      } catch (err) {
        // Si falla obtener tarifas, retornamos la lista normalizada sin merge
        console.warn("getServices: no se pudo obtener GetServiceRates:", err);
        return normalized;
      }
    };

    if (forceRefresh) {
      servicesWithRatesCache = null;
    }

    servicesWithRatesInFlight = resolveServicesWithRates().finally(() => {
      servicesWithRatesInFlight = null;
    });

    return servicesWithRatesInFlight;
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
