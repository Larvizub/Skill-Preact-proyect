import { useEffect, useState } from "preact/hooks";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/datepicker";
import { Select } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { FilterPill } from "../components/ui/FilterPill";
import { apiService, type Event, type Service } from "../services/api.service";
import {
  Search,
  Calendar,
  X,
  Eye,
  ArrowLeft,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-preact";
import {
  getEventStatusText,
  STATUS_DEFINITIONS,
  STATUS_DEFINITION_MAP,
  classifyEventStatus,
  type StatusCategory,
  isItemCancelled,
  DEFAULT_STATUS_FILTERS,
} from "../lib/eventStatus";
import { calculateItemAmounts } from "../lib/quoteUtils";

interface ConsultaItem {
  serviceName: string;
  categoryName: string;
  subCategoryName: string;
  activityTitle: string;
  totalQuantity: number;
  unitPrice: number;
  totalPriceTNI: number;
  totalPriceTI: number;
  totalDiscount: number;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface SubCategoryOption {
  id: number;
  name: string;
  categoryId: number;
}

interface ServiceLookup {
  idService: number;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
}

type TopNoticeType = "error" | "warning" | "success" | "info";

interface TopNoticeState {
  message: string;
  type: TopNoticeType;
}

export function Consultas() {
  const getStatusColor = (event: Event) => {
    const statusCategory = classifyEventStatus(event);
    const definition = STATUS_DEFINITION_MAP[statusCategory];
    return definition?.colorClass || "bg-gray-500";
  };

  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [filterType, setFilterType] = useState<
    "dateRange" | "eventId" | "eventName"
  >("dateRange");
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(now.getMonth() + 1);
    return oneMonthLater.toISOString().split("T")[0];
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([]);
  const [serviceLookup, setServiceLookup] = useState<Map<number, ServiceLookup>>(
    new Map()
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [consultaData, setConsultaData] = useState<ConsultaItem[]>([]);
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(DEFAULT_STATUS_FILTERS);
  const [topNotice, setTopNotice] = useState<TopNoticeState | null>(null);

  const showTopNotice = (
    message: string,
    type: TopNoticeType = "error",
    durationMs = 4000
  ) => {
    setTopNotice({ message, type });
    window.setTimeout(() => {
      setTopNotice((current) =>
        current?.message === message && current?.type === type ? null : current
      );
    }, durationMs);
  };

  useEffect(() => {
    loadServiceCatalog();
  }, []);

  const loadServiceCatalog = async () => {
    setLoadingServices(true);
    try {
      const services = await apiService.getServices();

      const categoryMap = new Map<number, CategoryOption>();
      const subCategoryMap = new Map<number, SubCategoryOption>();
      const lookup = new Map<number, ServiceLookup>();

      services.forEach((service: Service) => {
        const category = service.serviceCategory;
        const subCategory = service.serviceSubCategory;

        if (category?.idServiceCategory) {
          categoryMap.set(category.idServiceCategory, {
            id: category.idServiceCategory,
            name: category.serviceCategoryName || "Sin categoría",
          });
        }

        if (subCategory?.idServiceSubCategory) {
          subCategoryMap.set(subCategory.idServiceSubCategory, {
            id: subCategory.idServiceSubCategory,
            name: subCategory.serviceSubCategoryName || "Sin subcategoría",
            categoryId: category?.idServiceCategory || 0,
          });
        }

        lookup.set(service.idService, {
          idService: service.idService,
          categoryId: category?.idServiceCategory || 0,
          categoryName: category?.serviceCategoryName || "Sin categoría",
          subCategoryId: subCategory?.idServiceSubCategory || 0,
          subCategoryName: subCategory?.serviceSubCategoryName || "Sin subcategoría",
        });
      });

      setCategories(
        Array.from(categoryMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setSubCategories(
        Array.from(subCategoryMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setServiceLookup(lookup);
    } catch (error) {
      console.error("Error cargando catálogo de servicios:", error);
      showTopNotice(
        "No se pudo cargar el catálogo de servicios. Intenta nuevamente para usar el módulo de consultas."
      );
    } finally {
      setLoadingServices(false);
    }
  };

  const visibleSubCategories = subCategories.filter(
    (item) => item.categoryId === Number(selectedCategoryId)
  );

  const handleSearch = async () => {
    if (loadingServices) {
      showTopNotice(
        "Aún se está cargando el catálogo de servicios, intenta nuevamente.",
        "warning"
      );
      return;
    }

    if (!selectedCategoryId) {
      showTopNotice("Por favor selecciona una categoría.", "warning");
      return;
    }

    if (filterType === "eventId" && !eventId.trim()) {
      showTopNotice("Por favor ingresa un ID de evento", "warning");
      return;
    }
    if (filterType === "eventName" && !eventName.trim()) {
      showTopNotice("Por favor ingresa un nombre de evento", "warning");
      return;
    }
    if (filterType === "dateRange" && (!startDate || !endDate)) {
      showTopNotice("Por favor selecciona un rango de fechas", "warning");
      return;
    }

    if (filterType === "dateRange") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

      if (diffMonths > 6) {
        showTopNotice(
          "Por favor selecciona un rango de fechas menor a 6 meses para optimizar la búsqueda",
          "warning"
        );
        return;
      }
    }

    setLoading(true);
    setEvents([]);
    setSelectedEvent(null);
    setConsultaData([]);

    try {
      let foundEvents: Event[];
      if (filterType === "dateRange") {
        foundEvents = await apiService.getEvents(startDate, endDate);
      } else if (filterType === "eventId") {
        foundEvents = await apiService.getEvents(
          undefined,
          undefined,
          eventId.trim()
        );
      } else {
        foundEvents = await apiService.getEvents(
          undefined,
          undefined,
          undefined,
          eventName.trim()
        );
      }

      if (foundEvents.length === 0) {
        showTopNotice(
          "No se encontraron eventos con los criterios de búsqueda.",
          "info"
        );
        return;
      }

      const hasActiveStatusFilters = Object.values(statusFilters).some(
        (value) => !value
      );

      if (hasActiveStatusFilters) {
        foundEvents = foundEvents.filter((event) => {
          const statusCategory = classifyEventStatus(event);
          return statusFilters[statusCategory];
        });
      }

      if (foundEvents.length === 0) {
        showTopNotice(
          "No se encontraron eventos con los filtros de estatus seleccionados.",
          "info"
        );
        return;
      }

      const eventsWithMatchingServices = foundEvents.filter((event) =>
        eventHasMatchingServices(event)
      );

      if (eventsWithMatchingServices.length === 0) {
        showTopNotice(
          "No se encontraron eventos con servicios para los filtros de categoría y subcategoría seleccionados.",
          "info"
        );
        return;
      }

      setEvents(eventsWithMatchingServices);
    } catch (error) {
      console.error("Error al buscar eventos:", error);
      showTopNotice(
        "Error al buscar eventos. Por favor, intenta nuevamente.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const eventHasMatchingServices = (event: Event) => {
    const rawEvent = event as any;
    const targetCategoryId = Number(selectedCategoryId);
    const hasSubCategoryFilter = Boolean(selectedSubCategoryId);
    const targetSubCategoryId = Number(selectedSubCategoryId);

    if (!Array.isArray(rawEvent?.activities)) return false;

    return rawEvent.activities.some((activity: any) => {
      if (isItemCancelled(activity) || !Array.isArray(activity.services)) {
        return false;
      }

      return activity.services.some((service: any) => {
        if (isItemCancelled(service)) return false;

        const serviceId = Number(service.idService || service.service?.idService);
        const categoryId = Number(
          service.serviceCategory?.idServiceCategory ||
            serviceLookup.get(serviceId)?.categoryId ||
            0
        );
        const subCategoryId = Number(
          service.serviceSubCategory?.idServiceSubCategory ||
            serviceLookup.get(serviceId)?.subCategoryId ||
            0
        );

        if (categoryId !== targetCategoryId) return false;
        if (!hasSubCategoryFilter) return true;
        return subCategoryId === targetSubCategoryId;
      });
    });
  };

  const clearFilters = () => {
    setEventId("");
    setEventName("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");

    const resetFilters: Record<StatusCategory, boolean> = {} as any;
    STATUS_DEFINITIONS.forEach((def) => (resetFilters[def.id] = true));
    setStatusFilters(resetFilters);

    const now = new Date();
    setStartDate(now.toISOString().split("T")[0]);
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(now.getMonth() + 1);
    setEndDate(oneMonthLater.toISOString().split("T")[0]);

    setEvents([]);
    setSelectedEvent(null);
    setConsultaData([]);
  };

  const toggleStatusFilter = (id: StatusCategory) => {
    setStatusFilters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleViewDetail = (event: Event) => {
    setSelectedEvent(event);
    processEvent(event);
  };

  const processEvent = (event: Event) => {
    const targetCategoryId = Number(selectedCategoryId);
    const hasSubCategoryFilter = Boolean(selectedSubCategoryId);
    const targetSubCategoryId = Number(selectedSubCategoryId);

    const items: ConsultaItem[] = [];
    const rawEvent = event as any;

    if (!Array.isArray(rawEvent?.activities)) {
      setConsultaData([]);
      return;
    }

    rawEvent.activities.forEach((activity: any) => {
      if (isItemCancelled(activity) || !Array.isArray(activity.services)) {
        return;
      }

      const activityTitle = activity.activityTitle || "Sin título";

      activity.services.forEach((service: any) => {
        if (isItemCancelled(service)) return;

        const serviceId = Number(service.idService || service.service?.idService);
        const lookup = serviceLookup.get(serviceId);

        const categoryId = Number(
          service.serviceCategory?.idServiceCategory || lookup?.categoryId || 0
        );
        const subCategoryId = Number(
          service.serviceSubCategory?.idServiceSubCategory ||
            lookup?.subCategoryId ||
            0
        );

        if (categoryId !== targetCategoryId) {
          return;
        }

        if (hasSubCategoryFilter && subCategoryId !== targetSubCategoryId) {
          return;
        }

        const quantity = Number(service.quantity || 0);
        const { net, discount } = calculateItemAmounts(service, quantity);

        const unitPrice = Number(service.priceTNI || 0);
        const totalPriceTI = net - discount;

        items.push({
          serviceName: service.serviceName || "Sin nombre",
          categoryName:
            service.serviceCategory?.serviceCategoryName ||
            lookup?.categoryName ||
            "Sin categoría",
          subCategoryName:
            service.serviceSubCategory?.serviceSubCategoryName ||
            lookup?.subCategoryName ||
            "Sin subcategoría",
          activityTitle,
          totalQuantity: quantity,
          unitPrice,
          totalPriceTNI: net,
          totalPriceTI,
          totalDiscount: discount,
        });
      });
    });

    const ordered = items.sort((a, b) => {
      const byService = a.serviceName.localeCompare(b.serviceName);
      if (byService !== 0) return byService;
      return a.activityTitle.localeCompare(b.activityTitle);
    });

    setConsultaData(ordered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totalQuantity = consultaData.reduce(
    (sum, item) => sum + item.totalQuantity,
    0
  );
  const totalDiscount = consultaData.reduce(
    (sum, item) => sum + item.totalDiscount,
    0
  );
  const totalPriceTNI = consultaData.reduce(
    (sum, item) => sum + item.totalPriceTNI,
    0
  );
  const totalPriceTI = consultaData.reduce(
    (sum, item) => sum + item.totalPriceTI,
    0
  );

  return (
    <Layout>
      {topNotice && (
        <div className="fixed top-4 left-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 pointer-events-none">
          <div className="pointer-events-auto">
            <div
              className={`flex items-center gap-3 rounded-md border px-4 py-3 shadow-lg backdrop-blur-sm ${
                topNotice.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : topNotice.type === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
              role="status"
              aria-live="polite"
            >
              {topNotice.type === "success" && (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {(topNotice.type === "error" ||
                topNotice.type === "warning" ||
                topNotice.type === "info") && (
                <AlertCircle className="h-4 w-4" />
              )}
              <p className="text-sm font-medium">{topNotice.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">Consultas</h1>
          <p className="text-muted-foreground">
            Consulta servicios por categoría y subcategoría en los eventos
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Buscar Evento</h2>

          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              Tipo de Búsqueda
            </Label>
            <div className="flex gap-2">
              <Button
                variant={filterType === "dateRange" ? "default" : "outline"}
                onClick={() => setFilterType("dateRange")}
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Por Rango de Fechas
              </Button>
              <Button
                variant={filterType === "eventId" ? "default" : "outline"}
                onClick={() => setFilterType("eventId")}
                size="sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Por ID
              </Button>
              <Button
                variant={filterType === "eventName" ? "default" : "outline"}
                onClick={() => setFilterType("eventName")}
                size="sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Por Nombre
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filterType === "dateRange" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <DatePicker
                    id="startDate"
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <DatePicker
                    id="endDate"
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                  />
                </div>
              </div>
            )}

            {filterType === "eventId" && (
              <div>
                <Label htmlFor="eventId">ID del Evento</Label>
                <Input
                  id="eventId"
                  placeholder="Ingresa el ID del evento"
                  value={eventId}
                  onChange={(e) =>
                    setEventId((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            )}

            {filterType === "eventName" && (
              <div>
                <Label htmlFor="eventName">Nombre del Evento</Label>
                <Input
                  id="eventName"
                  placeholder="Ingresa el nombre del evento"
                  value={eventName}
                  onChange={(e) =>
                    setEventName((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  id="category"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const value = (e.target as HTMLSelectElement).value;
                    setSelectedCategoryId(value);
                    setSelectedSubCategoryId("");
                  }}
                  disabled={loadingServices}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="subCategory">Subcategoría</Label>
                <Select
                  id="subCategory"
                  value={selectedSubCategoryId}
                  onChange={(e) =>
                    setSelectedSubCategoryId(
                      (e.target as HTMLSelectElement).value
                    )
                  }
                  disabled={loadingServices || !selectedCategoryId}
                >
                  <option value="">Todas las subcategorías</option>
                  {visibleSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={String(subCategory.id)}>
                      {subCategory.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Filtrar por Estatus
              </span>
              <div className="flex flex-wrap gap-2.5">
                {STATUS_DEFINITIONS.map((definition) => (
                  <FilterPill
                    key={definition.id}
                    checked={statusFilters[definition.id]}
                    onChange={() => toggleStatusFilter(definition.id) as any}
                    label={definition.label}
                  >
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <span
                        className={`absolute inset-0 rounded-sm ${definition.colorClass} opacity-60 transition-opacity peer-checked:opacity-100`}
                      />
                      <Check className="relative h-2.5 w-2.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                    </span>
                  </FilterPill>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSearch} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>

              <Button onClick={clearFilters} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </Card>

        {!selectedEvent && events.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Eventos Encontrados ({events.length})
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Skill</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={(event as any).idEvent}>
                      <TableCell className="font-medium">
                        {(event as any).eventNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {(event as any).title || "Sin título"}
                      </TableCell>
                      <TableCell>{event.startDate}</TableCell>
                      <TableCell>{event.endDate}</TableCell>
                      <TableCell>
                        {(() => {
                          const rawEvent = event as any;
                          const nonCancelledActivities = (
                            rawEvent?.activities || []
                          ).filter((a: any) => !isItemCancelled(a));
                          const firstActivity = nonCancelledActivities[0];
                          return (
                            firstActivity?.activityDate ||
                            firstActivity?.startDate ||
                            "-"
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            event
                          )} text-white`}
                        >
                          {getEventStatusText(event)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleViewDetail(event)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {selectedEvent && (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {(selectedEvent as any).title || "Evento sin título"}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(null);
                    setConsultaData([]);
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Volver a la lista
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <span className="font-medium">
                    {(selectedEvent as any).idEvent}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Número:</span>{" "}
                  <span className="font-medium">
                    {(selectedEvent as any).eventNumber}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Inicio:</span>{" "}
                  <span className="font-medium">{selectedEvent.startDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Fin:</span>{" "}
                  <span className="font-medium">{selectedEvent.endDate}</span>
                </div>
              </div>
            </Card>

            {consultaData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resultados</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Subcategoría</TableHead>
                        <TableHead>Actividad</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">
                          Precio Unitario (TNI)
                        </TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead className="text-right">
                          Total Cotización (TNI)
                        </TableHead>
                        <TableHead className="text-right">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultaData.map((item, index) => (
                        <TableRow key={`${item.serviceName}-${item.activityTitle}-${index}`}>
                          <TableCell className="font-medium">
                            {item.serviceName}
                          </TableCell>
                          <TableCell>{item.categoryName}</TableCell>
                          <TableCell>{item.subCategoryName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.activityTitle}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.totalQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            {formatCurrency(item.totalDiscount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.totalPriceTNI)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(item.totalPriceTI)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTALES</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">{totalQuantity}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right text-red-500">
                          {formatCurrency(totalDiscount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalPriceTNI)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalPriceTI)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {!loading && consultaData.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground">
                <p>
                  No se encontraron servicios para los filtros de categoría y
                  subcategoría seleccionados en este evento
                </p>
              </Card>
            )}
          </>
        )}

        {!loading && !selectedEvent && events.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <p>Realiza una búsqueda para ver los eventos disponibles</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
