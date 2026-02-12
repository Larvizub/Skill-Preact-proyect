import { isItemCancelled } from "./eventStatus";

export interface QuoteItem {
  net: number;
  discount: number;
  tax: number;
  price: number;
  total: number;
}

export interface QuoteTotals {
  totalNet: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateItemAmounts(
  item: any,
  quantity: number = 1
): QuoteItem {
  const price = item.priceTNI || item.priceTI || 0;
  const net = item.netAmount || price * quantity;
  // Handle API typo 'groosAmount'
  const gross = item.grossAmount || item.groosAmount || net;
  const discountPct = item.discountPercentage || 0;

  const discount = net * (discountPct / 100);

  // Calculate tax rate
  // 1. Try from unit prices (safer)
  let taxRate = 0;
  const pTNI = item.priceTNI || 0;
  const pTI = item.priceTI || 0;

  if (pTNI > 0 && pTI > pTNI) {
    taxRate = (pTI - pTNI) / pTNI;
  } else if (net > 0 && gross > net) {
    // 2. Fallback: infer from totals (gross vs net)
    // Note: This assumes gross doesn't have discount applied if net doesn't
    taxRate = (gross - net) / net;
  }

  // Tax is calculated on the discounted amount (taxable base)
  const taxableAmount = Math.max(0, net - discount);
  const tax = taxableAmount * taxRate;

  return {
    net,
    discount,
    tax,
    price,
    total: taxableAmount + tax,
  };
}

export function calculateEventQuoteTotals(event: any): QuoteTotals {
  let totalNet = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  if (event?.activities && Array.isArray(event.activities)) {
    event.activities.forEach((activity: any) => {
      if (isItemCancelled(activity)) return;

      // Rooms
      if (activity.rooms && Array.isArray(activity.rooms)) {
        activity.rooms.forEach((room: any) => {
          if (isItemCancelled(room)) return;
          const { net, discount, tax } = calculateItemAmounts(room, 1);
          if (net > 0 || room.priceTNI > 0 || room.priceTI > 0) {
            totalNet += net;
            totalDiscount += discount;
            totalTax += tax;
          }
        });
      }

      // Services
      if (activity.services && Array.isArray(activity.services)) {
        activity.services.forEach((service: any) => {
          if (isItemCancelled(service)) return;
          const quantity = service.quantity || service.serviceQuantity || 1;
          const { net, discount, tax } = calculateItemAmounts(
            service,
            quantity
          );
          if (net > 0 || service.priceTNI > 0 || service.priceTI > 0) {
            totalNet += net;
            totalDiscount += discount;
            totalTax += tax;
          }
        });
      }
    });
  }

  return {
    totalNet,
    totalDiscount,
    totalTax,
    grandTotal: totalNet - totalDiscount + totalTax,
  };
}

export function resolveEventQuoteGrandTotal(
  rawEvent: any,
  quoteData: any
): number {
  const amountSources = [
    rawEvent,
    quoteData,
    quoteData?.result,
    quoteData?.Quote,
    quoteData?.quote,
    quoteData?.totals,
    quoteData?.Totals,
    quoteData?.summary,
    quoteData?.pricing,
    quoteData?.header,
    quoteData?.financial,
    quoteData?.financialSummary,
    quoteData?.eventTotals,
    rawEvent?.totals,
    rawEvent?.Totals,
    rawEvent?.eventTotals,
    rawEvent?.financialSummary,
    rawEvent?.financial,
    rawEvent?.quoteTotals,
    rawEvent?.quote,
    rawEvent?.summary,
    rawEvent?.pricing,
    rawEvent?.eventSummary,
  ];

  const parseNumericValue = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
      return Number.isNaN(normalized) ? null : normalized;
    }
    return null;
  };

  const findNumericDeep = (
    source: unknown,
    keyPattern: RegExp,
    visited = new WeakSet()
  ): number | null => {
    if (!source || typeof source !== "object") return null;
    if (visited.has(source as object)) return null;
    visited.add(source as object);

    if (Array.isArray(source)) {
      for (const item of source) {
        const found = findNumericDeep(item, keyPattern, visited);
        if (found !== null) return found;
      }
      return null;
    }

    for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
      if (keyPattern.test(k)) {
        const parsed = parseNumericValue(v);
        if (parsed !== null) return parsed;
      }
      if (v && typeof v === "object") {
        const child = findNumericDeep(v, keyPattern, visited);
        if (child !== null) return child;
      }
    }
    return null;
  };

  const pickAmount = (keys: string[], fallbackPattern?: RegExp): number | null => {
    for (const source of amountSources) {
      if (!source || typeof source !== "object") continue;
      for (const key of keys) {
        if (!(key in source)) continue;
        const candidate = parseNumericValue((source as Record<string, unknown>)[key]);
        if (candidate !== null) {
          return candidate;
        }
      }
      if (fallbackPattern) {
        const deep = findNumericDeep(source, fallbackPattern);
        if (deep !== null) return deep;
      }
    }
    return null;
  };

  const hasAnyItems =
    Array.isArray(rawEvent?.activities) &&
    rawEvent.activities.some(
      (activity: any) =>
        (Array.isArray(activity?.rooms) && activity.rooms.length > 0) ||
        (Array.isArray(activity?.services) && activity.services.length > 0)
    );

  const computedTotals = calculateEventQuoteTotals(rawEvent);
  const computedGrandTotal = Number.isFinite(computedTotals.grandTotal)
    ? computedTotals.grandTotal
    : 0;

  const providedGrandTotal = pickAmount(
    [
      "totalAmount",
      "grandTotal",
      "eventTotal",
      "totalWithTax",
      "eventAmount",
      "totalQuotation",
      "total",
      "totalQuote",
    ],
    /(total)/i
  );

  if (hasAnyItems && computedGrandTotal > 0) {
    return computedGrandTotal;
  }

  if (providedGrandTotal !== null && Number.isFinite(providedGrandTotal)) {
    return providedGrandTotal;
  }

  return computedGrandTotal;
}
