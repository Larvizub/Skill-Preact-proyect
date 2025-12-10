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
      // Rooms
      if (activity.rooms && Array.isArray(activity.rooms)) {
        activity.rooms.forEach((room: any) => {
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
