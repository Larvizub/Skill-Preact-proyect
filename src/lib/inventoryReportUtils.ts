import * as XLSX from "xlsx";
import type { Service } from "../types/skill/api";

export type ServicePriceInfo = {
  tni: number | null;
  ti: number | null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const pickActivePriceList = (service: Service) => {
  const lists = Array.isArray((service as any)?.priceLists)
    ? (service as any).priceLists
    : [];

  if (lists.length === 0) return null;

  const now = new Date().toISOString().slice(0, 10);

  const activeInRange = lists.find(
    (item: any) =>
      item?.priceListActive === true &&
      (!item?.priceListFromDate ||
        !item?.priceListToDate ||
        (item.priceListFromDate <= now && item.priceListToDate >= now))
  );

  return (
    activeInRange ??
    lists.find((item: any) => item?.priceListActive === true) ??
    lists[0]
  );
};

export const getServicePriceInfo = (service: Service): ServicePriceInfo => {
  const selectedList = pickActivePriceList(service);

  const tni =
    asNumber((service as any)?.priceTNI) ??
    asNumber((service as any)?.servicePriceTaxesNotIncluded) ??
    asNumber((service as any)?.servicePriceWithoutTax) ??
    asNumber(selectedList?.servicePriceTaxesNotIncluded) ??
    null;

  const ti =
    asNumber((service as any)?.priceTI) ??
    asNumber((service as any)?.servicePriceTaxesIncluded) ??
    asNumber((service as any)?.servicePriceWithTax) ??
    asNumber(selectedList?.servicePriceTaxesIncluded) ??
    null;

  return { tni, ti };
};

export const buildServicePriceLookup = (
  services: Service[]
): Map<number, ServicePriceInfo> => {
  const lookup = new Map<number, ServicePriceInfo>();
  services.forEach((service) => {
    lookup.set(Number(service.idService), getServicePriceInfo(service));
  });
  return lookup;
};

export async function generateInventoryGeneralExcelReport(
  services: Service[],
  servicePriceLookup?: Map<number, ServicePriceInfo>
) {
  const reportDate = new Date().toISOString().split("T")[0];
  const priceLookup = servicePriceLookup ?? buildServicePriceLookup(services);

  const rows = services.map((service) => {
    const priceInfo =
      priceLookup.get(Number(service.idService)) ?? ({ tni: null, ti: null } as ServicePriceInfo);

    return {
      "ID Servicio": service.idService,
      "Nombre Servicio": service.serviceName,
      Código: service.serviceCode || "",
      Categoría: service.serviceCategory?.serviceCategoryName || "Sin categoría",
      Subcategoría:
        service.serviceSubCategory?.serviceSubCategoryName || "Sin subcategoría",
      Stock: service.serviceStock ?? 0,
      Estado: service.serviceActive ? "Activo" : "Inactivo",
      "Precio TNI": priceInfo.tni ?? "N/D",
      "Precio TI": priceInfo.ti ?? "N/D",
      "Costo Mínimo": (service as any).serviceMinCostPrice ?? "N/D",
      "Costo Máximo": (service as any).serviceMaxCostPrice ?? "N/D",
      Comentarios: service.serviceComments || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "General Inventario");

  XLSX.writeFile(workbook, `Reporte_Inventario_General_${reportDate}.xlsx`);
}

export async function generateInventoryTotalsExcelReport(
  services: Service[],
  servicePriceLookup?: Map<number, ServicePriceInfo>
) {
  const reportDate = new Date().toISOString().split("T")[0];
  const priceLookup = servicePriceLookup ?? buildServicePriceLookup(services);

  const totalsByCategory = new Map<
    string,
    {
      categoria: string;
      subcategoria: string;
      servicios: number;
      activos: number;
      stock: number;
      montoTni: number;
      montoTi: number;
    }
  >();

  services.forEach((service) => {
    const categoria = service.serviceCategory?.serviceCategoryName || "Sin categoría";
    const subcategoria =
      service.serviceSubCategory?.serviceSubCategoryName || "Sin subcategoría";
    const key = `${categoria}::${subcategoria}`;
    const stock = Number(service.serviceStock || 0);
    const priceInfo =
      priceLookup.get(Number(service.idService)) ?? ({ tni: null, ti: null } as ServicePriceInfo);

    const current =
      totalsByCategory.get(key) ??
      {
        categoria,
        subcategoria,
        servicios: 0,
        activos: 0,
        stock: 0,
        montoTni: 0,
        montoTi: 0,
      };

    current.servicios += 1;
    current.activos += service.serviceActive ? 1 : 0;
    current.stock += stock;
    current.montoTni += stock * (priceInfo.tni ?? 0);
    current.montoTi += stock * (priceInfo.ti ?? 0);

    totalsByCategory.set(key, current);
  });

  const summaryRows = Array.from(totalsByCategory.values())
    .sort((a, b) =>
      a.categoria === b.categoria
        ? a.subcategoria.localeCompare(b.subcategoria)
        : a.categoria.localeCompare(b.categoria)
    )
    .map((row) => ({
      Categoría: row.categoria,
      Subcategoría: row.subcategoria,
      "Servicios Totales": row.servicios,
      "Servicios Activos": row.activos,
      "Stock Total": row.stock,
      "Valor Inventario TNI": Number(row.montoTni.toFixed(2)),
      "Valor Inventario TI": Number(row.montoTi.toFixed(2)),
    }));

  const detailRows = services.map((service) => {
    const stock = Number(service.serviceStock || 0);
    const priceInfo =
      priceLookup.get(Number(service.idService)) ?? ({ tni: null, ti: null } as ServicePriceInfo);

    return {
      "ID Servicio": service.idService,
      Servicio: service.serviceName,
      Categoría: service.serviceCategory?.serviceCategoryName || "Sin categoría",
      Subcategoría:
        service.serviceSubCategory?.serviceSubCategoryName || "Sin subcategoría",
      Stock: stock,
      "Precio TNI": priceInfo.tni ?? "N/D",
      "Precio TI": priceInfo.ti ?? "N/D",
      "Valor Total TNI": Number((stock * (priceInfo.tni ?? 0)).toFixed(2)),
      "Valor Total TI": Number((stock * (priceInfo.ti ?? 0)).toFixed(2)),
      Estado: service.serviceActive ? "Activo" : "Inactivo",
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Totales Inventario");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle Servicios");

  XLSX.writeFile(workbook, `Reporte_Inventario_Totales_${reportDate}.xlsx`);
}
