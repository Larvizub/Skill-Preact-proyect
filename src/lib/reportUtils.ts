import * as XLSX from "xlsx";
import { apiService } from "../services/api.service";
import { calculateItemAmounts } from "./quoteUtils";
import { isItemCancelled, getEventStatusText } from "./eventStatus";

export async function generateEventsExcelReport(events: any[]) {
  // 1. Obtener los servicios del catálogo para poder categorizar por revenueGroup
  const catalogServices = await apiService.getServices();

  const reportData: any[] = [];

  // Filtrar eventos cancelados para no sobrecargar el API
  const activeEvents = events.filter((e) => !isItemCancelled(e));

  // Procesar en lotes para evitar saturar el navegador y el API
  const BATCH_SIZE = 5;
  for (let i = 0; i < activeEvents.length; i += BATCH_SIZE) {
    const batch = activeEvents.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (event) => {
        let quote = null;
        try {
          const id = event.idEvent || event.eventId || event.eventNumber;
          if (id) {
            quote = await apiService.getEventQuote(String(id));
          }
        } catch (error) {
          console.warn(
            `No se pudo obtener la cotización para el evento ${event.idEvent}:`,
            error
          );
        }

        let totalSalones = 0;
        let totalGastronomia = 0;
        let totalOtros = 0;

        // Usar quote si existe, si no, lo que venga en el evento
        const activities = quote?.activities || event.activities || [];

        if (activities && Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            if (isItemCancelled(activity)) return;

            // Sumar Salones
            if (activity.rooms && Array.isArray(activity.rooms)) {
              activity.rooms.forEach((room: any) => {
                if (isItemCancelled(room)) return;
                const { net, discount } = calculateItemAmounts(room, 1);
                totalSalones += net - discount;
              });
            }

            // Sumar Servicios (Gastronomía vs Otros)
            if (activity.services && Array.isArray(activity.services)) {
              activity.services.forEach((service: any) => {
                if (isItemCancelled(service)) return;
                const quantity =
                  service.quantity || service.serviceQuantity || 1;
                const { net, discount, price } = calculateItemAmounts(
                  service,
                  quantity
                );

                if (net > 0 || price > 0) {
                  const catalogService = catalogServices.find(
                    (cs: any) => cs.idService === service.idService
                  );

                  const revenueGroupName =
                    catalogService?.revenueGroup?.revenueGroupName?.toLowerCase() ||
                    "";
                  const isGastronomia =
                    revenueGroupName.includes("gastronom") ||
                    revenueGroupName.includes("alimento") ||
                    revenueGroupName.includes("bebida") ||
                    revenueGroupName.includes("a y b") ||
                    revenueGroupName.includes("catering");

                  if (isGastronomia) {
                    totalGastronomia += net - discount;
                  } else {
                    totalOtros += net - discount;
                  }
                }
              });
            }
          });
        }

        reportData.push({
          "ID del evento": event.idEvent || event.eventNumber || "",
          "Nombre del Evento": event.title || "",
          "Pax Estimados": event.estimatedPax || 0,
          Estatus: getEventStatusText(event),
          "Nombre del Coordinador": event.salesAgent?.salesAgentName || "",
          "Tipo del Evento": event.eventType?.eventTypeName || "",
          "Fecha Inicial": event.startDate
            ? new Date(event.startDate).toLocaleDateString("es-ES")
            : "",
          "Fecha Final": event.endDate
            ? new Date(event.endDate).toLocaleDateString("es-ES")
            : "",
          "Total de Salones ($)": Number(totalSalones.toFixed(2)),
          "Total de Otros ($)": Number(totalOtros.toFixed(2)),
          "Total de Gastronomía ($)": Number(totalGastronomia.toFixed(2)),
        });
      })
    );
  }

  // Si después de filtrar no quedó nada, o para completar con eventos cancelados sin montos
  if (reportData.length < events.length) {
    const processedIds = new Set(reportData.map((r) => r["ID del evento"]));
    events.forEach((event) => {
      const id = event.idEvent || event.eventNumber || "";
      if (!processedIds.has(id)) {
        reportData.push({
          "ID del evento": id,
          "Nombre del Evento": event.title || "",
          "Pax Estimados": event.estimatedPax || 0,
          Estatus: getEventStatusText(event),
          "Nombre del Coordinador": event.salesAgent?.salesAgentName || "",
          "Tipo del Evento": event.eventType?.eventTypeName || "",
          "Fecha Inicial": event.startDate
            ? new Date(event.startDate).toLocaleDateString("es-ES")
            : "",
          "Fecha Final": event.endDate
            ? new Date(event.endDate).toLocaleDateString("es-ES")
            : "",
          "Total de Salones ($)": 0,
          "Total de Otros ($)": 0,
          "Total de Gastronomía ($)": 0,
        });
      }
    });
  }

  // 2. Crear el libro de Excel
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");

  // 3. Generar el archivo y disparar la descarga
  XLSX.writeFile(
    workbook,
    `Reporte_Eventos_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

export async function generatePersonalExcelReport(events: any[]) {
  const reportData: any[] = [];

  // Servicios de personal que buscamos
  const personalKeywords = [
    "auxiliar de limpieza",
    "auxiliar de montajes",
    "oficial gestion de la proteccion",
    "oficial gestión de la protección",
    "auxiliar de aseo",
  ];

  // Filtrar eventos cancelados
  const activeEvents = events.filter((e) => !isItemCancelled(e));

  // Procesar en lotes
  const BATCH_SIZE = 5;
  for (let i = 0; i < activeEvents.length; i += BATCH_SIZE) {
    const batch = activeEvents.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (event) => {
        let quote = null;
        try {
          const id = event.idEvent || event.eventId || event.eventNumber;
          if (id) {
            quote = await apiService.getEventQuote(String(id));
          }
        } catch (error) {
          console.warn(
            `No se pudo obtener la cotización para el evento ${event.idEvent}:`,
            error
          );
        }

        const activities = quote?.activities || event.activities || [];

        if (activities && Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            if (isItemCancelled(activity)) return;

            const activityTitle = activity.activityTitle || "Sin título";

            if (activity.services && Array.isArray(activity.services)) {
              activity.services.forEach((service: any) => {
                if (isItemCancelled(service)) return;

                const serviceName = (service.serviceName || "").toLowerCase();
                const isPersonal = personalKeywords.some((keyword) =>
                  serviceName.includes(keyword)
                );

                if (isPersonal) {
                  // Normalizar el nombre del servicio para agrupar
                  let normalizedName = service.serviceName || "Sin nombre";
                  if (
                    serviceName.includes("auxiliar de limpieza") ||
                    serviceName.includes("auxiliar de aseo")
                  ) {
                    normalizedName = "Auxiliar de Limpieza";
                  } else if (serviceName.includes("auxiliar de montajes")) {
                    normalizedName = "Auxiliar de Montajes";
                  } else if (
                    serviceName.includes("oficial") &&
                    serviceName.includes("proteccion")
                  ) {
                    normalizedName = "Oficial Gestión de la Protección";
                  }

                  const quantity =
                    service.quantity || service.serviceQuantity || 0;
                  const { net, discount } = calculateItemAmounts(
                    service,
                    quantity
                  );
                  const priceTNI = service.priceTNI || 0;

                  reportData.push({
                    "ID del evento": event.idEvent || event.eventNumber || "",
                    "Nombre del Evento": event.title || "",
                    "Tipo de Personal": normalizedName,
                    Actividad: activityTitle,
                    "Cantidad Total": quantity,
                    Descuento: discount,
                    "Precio Unitario TNI": priceTNI,
                    "Total Cotización TNI": net,
                    TOTAL: net - discount,
                  });
                }
              });
            }
          });
        }
      })
    );
  }

  if (reportData.length === 0) {
    throw new Error(
      "No se encontró personal asignado en los eventos seleccionados."
    );
  }

  // Crear el libro de Excel
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Personal");

  // Generar el archivo
  XLSX.writeFile(
    workbook,
    `Reporte_Personal_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

export async function generateParqueosExcelReport(events: any[]) {
  const reportData: any[] = [];

  // Filtrar eventos cancelados
  const activeEvents = events.filter((e) => !isItemCancelled(e));

  // Procesar en lotes
  const BATCH_SIZE = 5;
  for (let i = 0; i < activeEvents.length; i += BATCH_SIZE) {
    const batch = activeEvents.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (event) => {
        let quote = null;
        try {
          const id = event.idEvent || event.eventId || event.eventNumber;
          if (id) {
            quote = await apiService.getEventQuote(String(id));
          }
        } catch (error) {
          console.warn(
            `No se pudo obtener la cotización para el evento ${event.idEvent}:`,
            error
          );
        }

        const activities = quote?.activities || event.activities || [];

        if (activities && Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            if (isItemCancelled(activity)) return;

            const activityTitle = activity.activityTitle || "Sin título";

            if (activity.services && Array.isArray(activity.services)) {
              activity.services.forEach((service: any) => {
                if (isItemCancelled(service)) return;

                const serviceName = (service.serviceName || "").toLowerCase();

                // Verificar si es un servicio de parqueo
                if (serviceName.includes("parqueo")) {
                  const quantity =
                    service.quantity || service.serviceQuantity || 0;
                  const { net, discount } = calculateItemAmounts(
                    service,
                    quantity
                  );
                  const priceTNI = service.priceTNI || 0;

                  reportData.push({
                    "ID del Evento": event.idEvent || event.eventNumber || "",
                    "Nombre del Evento": event.title || "",
                    Servicio: service.serviceName || "Parqueo",
                    Actividades: activityTitle,
                    Cantidad: quantity,
                    "Precio Unitario TNI": priceTNI,
                    Descuento: discount,
                    "Total cotización TNI": net,
                    TOTAL: net - discount,
                  });
                }
              });
            }
          });
        }
      })
    );
  }

  if (reportData.length === 0) {
    throw new Error(
      "No se encontraron servicios de parqueo en los eventos seleccionados."
    );
  }

  // Crear el libro de Excel
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Parqueos");

  // Generar el archivo
  XLSX.writeFile(
    workbook,
    `Reporte_Parqueos_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

export async function generateConsultasExcelReport(
  events: any[],
  options: {
    categoryId: number;
    subCategoryId?: number | null;
    categoryName?: string;
    subCategoryName?: string;
  }
) {
  const reportData: any[] = [];

  const targetCategoryId = Number(options.categoryId || 0);
  const targetSubCategoryId = Number(options.subCategoryId || 0);
  const hasSubCategoryFilter = targetSubCategoryId > 0;

  if (!targetCategoryId) {
    throw new Error("Selecciona una categoría válida para exportar.");
  }

  const catalogServices = await apiService.getServices();
  const serviceLookup = new Map<
    number,
    {
      categoryId: number;
      categoryName: string;
      subCategoryId: number;
      subCategoryName: string;
    }
  >();

  catalogServices.forEach((service: any) => {
    serviceLookup.set(Number(service.idService), {
      categoryId: Number(service?.serviceCategory?.idServiceCategory || 0),
      categoryName: service?.serviceCategory?.serviceCategoryName || "Sin categoría",
      subCategoryId: Number(
        service?.serviceSubCategory?.idServiceSubCategory || 0
      ),
      subCategoryName:
        service?.serviceSubCategory?.serviceSubCategoryName || "Sin subcategoría",
    });
  });

  const activeEvents = events.filter((event) => !isItemCancelled(event));
  const BATCH_SIZE = 5;

  for (let i = 0; i < activeEvents.length; i += BATCH_SIZE) {
    const batch = activeEvents.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (event) => {
        let quote = null;
        try {
          const id = event.idEvent || event.eventId || event.eventNumber;
          if (id) {
            quote = await apiService.getEventQuote(String(id));
          }
        } catch (error) {
          console.warn(
            `No se pudo obtener la cotización para el evento ${event.idEvent}:`,
            error
          );
        }

        const activities = quote?.activities || event.activities || [];
        if (!Array.isArray(activities)) return;

        activities.forEach((activity: any) => {
          if (isItemCancelled(activity) || !Array.isArray(activity.services)) {
            return;
          }

          const activityTitle = activity.activityTitle || "Sin título";

          activity.services.forEach((service: any) => {
            if (isItemCancelled(service)) return;

            const serviceId = Number(service.idService || service.service?.idService);
            const lookup = serviceLookup.get(serviceId);

            const categoryId = Number(
              service?.serviceCategory?.idServiceCategory ||
                lookup?.categoryId ||
                0
            );
            const subCategoryId = Number(
              service?.serviceSubCategory?.idServiceSubCategory ||
                lookup?.subCategoryId ||
                0
            );

            if (categoryId !== targetCategoryId) return;
            if (hasSubCategoryFilter && subCategoryId !== targetSubCategoryId) {
              return;
            }

            const quantity = Number(service.quantity || service.serviceQuantity || 0);
            const { net, discount } = calculateItemAmounts(service, quantity);
            const unitPrice = Number(service.priceTNI || 0);

            reportData.push({
              "ID del Evento": event.idEvent || event.eventNumber || "",
              "Nombre del Evento": event.title || "",
              Categoría:
                service?.serviceCategory?.serviceCategoryName ||
                lookup?.categoryName ||
                options.categoryName ||
                "Sin categoría",
              Subcategoría:
                service?.serviceSubCategory?.serviceSubCategoryName ||
                lookup?.subCategoryName ||
                (hasSubCategoryFilter
                  ? options.subCategoryName || "Sin subcategoría"
                  : "Todas"),
              Servicio: service.serviceName || "Sin nombre",
              Actividad: activityTitle,
              Cantidad: quantity,
              "Precio Unitario TNI": unitPrice,
              Descuento: discount,
              "Total Cotización TNI": net,
              TOTAL: net - discount,
            });
          });
        });
      })
    );
  }

  if (reportData.length === 0) {
    throw new Error(
      hasSubCategoryFilter
        ? "No se encontraron servicios para la categoría y subcategoría seleccionadas."
        : "No se encontraron servicios para la categoría seleccionada."
    );
  }

  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consultas");

  const safeCategory = (options.categoryName || "Categoria")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 30);
  const safeSubCategory = hasSubCategoryFilter
    ? (options.subCategoryName || "SubCategoria")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 30)
    : "Todas";

  XLSX.writeFile(
    workbook,
    `Reporte_Consultas_${safeCategory}_${safeSubCategory}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`
  );
}
