import type { Service, ServiceRate } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type CreateServicesCatalogServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
};

export function createServicesCatalogService({
  apiRequest,
  buildPayload,
  withFallback,
}: CreateServicesCatalogServiceDeps) {
  const getServices = () =>
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
    });

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
    getServiceRates,
  };
}
