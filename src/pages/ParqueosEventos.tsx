import { useState } from "preact/hooks";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/datepicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { FilterPill } from "../components/ui/FilterPill";
import { apiService, type Event } from "../services/api.service";
import {
  Search,
  Calendar,
  X,
  Eye,
  ArrowLeft,
  Check,
  FileSpreadsheet,
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
import { generateParqueosExcelReport } from "../lib/reportUtils";
import { Spinner } from "../components/ui/spinner";
import { calculateItemAmounts } from "../lib/quoteUtils";

interface ParqueoByDay {
  serviceName: string;
  activityTitle: string;
  totalQuantity: number;
  totalPriceTNI: number;
  totalPriceTI: number;
  totalDiscount: number;
}

export function ParqueosEventos() {
  // Helper para obtener los colores del estado
  const getStatusColor = (event: Event) => {
    const statusCategory = classifyEventStatus(event);
    const definition = STATUS_DEFINITION_MAP[statusCategory];
    return definition?.colorClass || "bg-gray-500";
  };

  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
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
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [parqueoData, setParqueoData] = useState<ParqueoByDay[]>([]);
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(DEFAULT_STATUS_FILTERS);

  const handleSearch = async () => {
    // Validar que haya criterios de búsqueda
    if (filterType === "eventId" && !eventId.trim()) {
      alert("Por favor ingresa un ID de evento");
      return;
    }
    if (filterType === "eventName" && !eventName.trim()) {
      alert("Por favor ingresa un nombre de evento");
      return;
    }
    if (filterType === "dateRange" && (!startDate || !endDate)) {
      alert("Por favor selecciona un rango de fechas");
      return;
    }

    // Validar que el rango no sea mayor a 6 meses solo para búsqueda por fechas
    if (filterType === "dateRange") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

      if (diffMonths > 6) {
        alert(
          "Por favor selecciona un rango de fechas menor a 6 meses para optimizar la búsqueda"
        );
        return;
      }
    }

    setLoading(true);
    setEvents([]);
    setSelectedEvent(null);
    setParqueoData([]);

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
        alert("No se encontraron eventos con los criterios de búsqueda.");
        return;
      }

      // Filtrar por estatus si hay filtros activos (alguno en false)
      const hasActiveFilters = Object.values(statusFilters).some((v) => !v);
      if (hasActiveFilters) {
        foundEvents = foundEvents.filter((event) => {
          const statusCategory = classifyEventStatus(event);
          return statusFilters[statusCategory];
        });

        if (foundEvents.length === 0) {
          alert("No se encontraron eventos con los estatus seleccionados.");
          setEvents([]);
          return;
        }
      }

      // Guardar los eventos encontrados para mostrar en la tabla
      setEvents(foundEvents);
    } catch (error) {
      console.error("Error al buscar eventos:", error);
      alert("Error al buscar eventos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (events.length === 0) {
      alert(
        "No hay eventos con parqueos para exportar. Realiza una búsqueda primero."
      );
      return;
    }

    setGeneratingReport(true);
    try {
      await generateParqueosExcelReport(events);
    } catch (error: any) {
      console.error("Error al generar el reporte:", error);
      alert(error.message || "Hubo un error al generar el reporte de Excel.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const clearFilters = () => {
    setEventId("");
    setEventName("");
    // Resetear todos los filtros a true (todos visibles)
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
    setParqueoData([]);
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
    setSelectedEvent(event);

    // Procesar las actividades para extraer parqueos divididos por día
    const parqueosByDay: ParqueoByDay[] = [];

    const rawEvent = event as any;
    if (!Array.isArray(rawEvent?.activities)) {
      setParqueoData([]);
      return;
    }

    rawEvent.activities.forEach((activity: any) => {
      if (isItemCancelled(activity)) return;
      const activityTitle = activity.activityTitle || "Sin título";

      if (!Array.isArray(activity.services)) return;

      let dayQuantity = 0;
      let dayPriceTNI = 0;
      let dayPriceTI = 0;
      let dayDiscount = 0;
      let serviceRealName = "Parqueo"; // Valor por defecto

      activity.services.forEach((service: any) => {
        if (isItemCancelled(service)) return;
        const serviceName = (service.serviceName || "").toLowerCase();

        // Verificar si es un servicio de parqueo
        if (serviceName.includes("parqueo")) {
          const quantity = service.quantity || 0;
          const { discount } = calculateItemAmounts(service, quantity);
          const priceTNI = service.priceTNI || 0;
          const priceTI = service.priceTI || 0;

          // Capturar el nombre real del servicio (primera vez que se encuentra)
          if (dayQuantity === 0) {
            serviceRealName = service.serviceName || "Parqueo";
          }

          dayQuantity += quantity;
          dayPriceTNI += priceTNI * quantity;
          dayPriceTI += priceTI * quantity;
          dayDiscount += discount;
        }
      });

      // Si hay parqueos en este día, agregarlo
      if (dayQuantity > 0) {
        parqueosByDay.push({
          serviceName: serviceRealName,
          activityTitle,
          totalQuantity: dayQuantity,
          totalPriceTNI: dayPriceTNI,
          totalPriceTI: dayPriceTI,
          totalDiscount: dayDiscount,
        });
      }
    });

    // Ordenar por nombre del servicio
    parqueosByDay.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

    setParqueoData(parqueosByDay);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Calcular totales generales
  const totalQuantity = parqueoData.reduce(
    (sum, item) => sum + item.totalQuantity,
    0
  );
  const totalDiscount = parqueoData.reduce(
    (sum, item) => sum + item.totalDiscount,
    0
  );
  const totalPriceTNI = parqueoData.reduce(
    (sum, item) => sum + item.totalPriceTNI,
    0
  );
  const totalPriceTI = parqueoData.reduce(
    (sum, item) => sum + item.totalPriceTI,
    0
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Parqueos de Eventos</h1>
          <p className="text-muted-foreground">
            Consulta los parqueos asignados a eventos divididos por día
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Buscar Evento</h2>

          {/* Selector de tipo de filtro */}
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

          {/* Inputs según tipo de filtro */}
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

            {/* Filtro de Estatus */}
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
              <Button
                onClick={handleSearch}
                disabled={loading || generatingReport}
                className="flex-1 min-w-[140px]"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>

              <Button
                onClick={handleExportExcel}
                className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
                disabled={loading || generatingReport || events.length === 0}
              >
                {generatingReport ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                {generatingReport ? "Generando..." : "Reporte Excel"}
              </Button>

              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1 min-w-[140px]"
                disabled={loading || generatingReport}
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla de eventos encontrados */}
        {!selectedEvent && events.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Eventos Encontrados ({events.length})
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Número</TableHead>
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
                      <TableCell className="font-mono text-xs">
                        {(event as any).idEvent}
                      </TableCell>
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
                        <Button
                          size="sm"
                          onClick={() => handleViewDetail(event)}
                        >
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

        {/* Vista de detalle del evento seleccionado */}
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
                    setParqueoData([]);
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

            {/* Tabla de parqueos por día */}
            {parqueoData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Parqueos por Día</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Actividad</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead className="text-right">
                          Total Cotización (TNI)
                        </TableHead>
                        <TableHead className="text-right">
                          Total Cotización (TI)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parqueoData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.serviceName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.activityTitle}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.totalQuantity}
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            {formatCurrency(item.totalDiscount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.totalPriceTNI)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.totalPriceTI)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTALES</TableCell>
                        <TableCell>{""}</TableCell>
                        <TableCell className="text-right">
                          {totalQuantity}
                        </TableCell>
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

            {/* Mensaje cuando no hay parqueos en el evento seleccionado */}
            {!loading && parqueoData.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground">
                <p>No se encontraron parqueos asignados a este evento</p>
              </Card>
            )}
          </>
        )}

        {/* Mensaje cuando no hay búsqueda */}
        {!loading && !selectedEvent && events.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <p>Realiza una búsqueda para ver los eventos disponibles</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
