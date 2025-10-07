import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import FilterPill from "../components/ui/FilterPill";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { DatePicker } from "../components/ui/datepicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { apiService } from "../services/api.service";
import type { Event } from "../services/api.service";
import { Search, Calendar, Eye, Filter, X, Check } from "lucide-preact";
import {
  STATUS_DEFINITIONS,
  DEFAULT_STATUS_FILTERS,
  classifyEventStatus,
  getEventStatusText,
  getEventStatusColor,
  collectMarketSegments,
  getEventMarketSegmentKey,
  getMarketSegmentKeyFromLabel,
  SEGMENT_FILTER_DEFAULTS,
  type SegmentOption,
  type StatusCategory,
} from "../lib/eventStatus";

export function Eventos() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(() => ({ ...DEFAULT_STATUS_FILTERS }));
  const [segmentFilters, setSegmentFilters] = useState<Record<string, boolean>>(
    {}
  );
  const [baseSegments, setBaseSegments] = useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);

  // Filtros
  const [filterType, setFilterType] = useState<
    "dateRange" | "eventNumber" | "eventName"
  >("dateRange");
  const [eventNumber, setEventNumber] = useState("");
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

  const loadEvents = async () => {
    // Validar que haya criterios de búsqueda
    if (filterType === "eventNumber" && !eventNumber.trim()) {
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

    try {
      let data: Event[];
      if (filterType === "dateRange") {
        data = await apiService.getEvents(startDate, endDate);
      } else if (filterType === "eventNumber") {
        // Optimización: buscar directamente por ID de evento (Skill) en la API
        data = await apiService.getEvents(
          undefined,
          undefined,
          eventNumber.trim()
        );
      } else if (filterType === "eventName") {
        // Optimización: buscar directamente por nombre en la API usando el parámetro 'title'
        data = await apiService.getEvents(
          undefined,
          undefined,
          undefined,
          eventName.trim()
        );
      } else {
        // Fallback por si acaso
        data = await apiService.getEvents();
      }

      // Para búsqueda por ID y nombre, ya viene filtrado de la API
      // Solo filtramos adicionalmente si es necesario
      let filtered = data;

      if (filterType === "dateRange" && startDate && endDate) {
        const startBoundary = new Date(`${startDate}T00:00:00`);
        const endBoundary = new Date(`${endDate}T23:59:59`);

        filtered = data.filter((eventItem: Event) => {
          const eventStart = eventItem.startDate
            ? new Date(eventItem.startDate)
            : undefined;
          const eventEnd = eventItem.endDate
            ? new Date(eventItem.endDate)
            : eventStart;

          if (!eventStart && !eventEnd) {
            return false;
          }

          const startToCompare = eventStart ?? eventEnd!;
          const endToCompare = eventEnd ?? eventStart!;

          return startToCompare <= endBoundary && endToCompare >= startBoundary;
        });
      }

      if (filterType === "eventNumber" && eventNumber.trim()) {
        // Para ID de evento, hacer filtrado adicional por si la API devuelve resultados parciales
        filtered = data.filter((eventItem: Event) =>
          ((eventItem as any)?.eventNumber ?? "")
            .toString()
            .includes(eventNumber.trim())
        );
      }
      // Para búsqueda por nombre, la API ya filtra, no necesitamos filtrado adicional
      // El filtrado adicional puede causar problemas de rendimiento

      setEvents(filtered);
    } catch (error) {
      console.error("Error loading events:", error);
      alert("Error al cargar eventos. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadEvents();
  };

  const clearFilters = () => {
    setEventNumber("");
    setEventName("");
    const now = new Date();
    setStartDate(now.toISOString().split("T")[0]);
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(now.getMonth() + 1);
    setEndDate(oneMonthLater.toISOString().split("T")[0]);
    setEvents([]);
    setStatusFilters({ ...DEFAULT_STATUS_FILTERS });
    setSegmentFilters({});
  };

  const handleEventClick = (event: Event) => {
    // Guardar el evento en sessionStorage para que EventoDetalle pueda acceder a él
    sessionStorage.setItem("currentEvent", JSON.stringify(event));
    sessionStorage.setItem(
      "currentEventSearchRange",
      JSON.stringify({ startDate, endDate })
    );
    // Guardar la página de origen para el botón "Volver"
    sessionStorage.setItem("eventDetailOrigin", "/eventos");
    route(`/eventos/${(event as any)?.eventNumber ?? event.idEvent}`);
  };

  const toggleStatusFilter = (id: StatusCategory) => {
    setStatusFilters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const toggleSegmentFilter = (key: string) => {
    setSegmentFilters((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  useEffect(() => {
    let active = true;

    const fetchSegments = async () => {
      setSegmentsLoading(true);

      try {
        const data = await apiService.getEventMarketSegments();
        if (!active) return;

        const map = new Map<string, string>();

        data.forEach((segment: any) => {
          const rawLabel =
            segment?.name ??
            segment?.marketSegmentName ??
            segment?.description ??
            "";

          const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
          if (!label) {
            return;
          }

          const key = getMarketSegmentKeyFromLabel(label);
          if (!map.has(key)) {
            map.set(key, label);
          }
        });

        const options = Array.from(map.entries())
          .map(([key, label]) => ({ key, label }))
          .sort((a, b) => a.label.localeCompare(b.label, "es"));

        setBaseSegments(options);
      } catch (error) {
        console.error("Error loading market segments:", error);
      } finally {
        if (!active) return;
        setSegmentsLoading(false);
      }
    };

    fetchSegments();

    return () => {
      active = false;
    };
  }, []);

  const derivedSegments = useMemo(
    () => collectMarketSegments(events),
    [events]
  );

  const availableSegments = useMemo(() => {
    const map = new Map<string, string>();

    baseSegments.forEach((segment) => {
      map.set(segment.key, segment.label);
    });

    derivedSegments.forEach((segment) => {
      if (!map.has(segment.key)) {
        map.set(segment.key, segment.label);
      }
    });

    if (!map.has(SEGMENT_FILTER_DEFAULTS.FALLBACK_KEY)) {
      const fallback = derivedSegments.find(
        (segment) => segment.key === SEGMENT_FILTER_DEFAULTS.FALLBACK_KEY
      );
      if (fallback) {
        map.set(fallback.key, fallback.label);
      }
    }

    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [baseSegments, derivedSegments]);

  useEffect(() => {
    if (availableSegments.length === 0) {
      setSegmentFilters((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    setSegmentFilters((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;

      for (const segment of availableSegments) {
        if (Object.prototype.hasOwnProperty.call(prev, segment.key)) {
          next[segment.key] = prev[segment.key];
        } else {
          next[segment.key] = true;
          changed = true;
        }
      }

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      if (!changed) {
        return prev;
      }

      return next;
    });
  }, [availableSegments]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const statusCategory = classifyEventStatus(event);
        const statusActive = statusFilters[statusCategory] !== false;

        const segmentKey = getEventMarketSegmentKey(event);
        const segmentActive = segmentFilters[segmentKey] !== false;

        return statusActive && segmentActive;
      }),
    [events, statusFilters, segmentFilters]
  );

  const hiddenByFilters = events.length - filteredEvents.length;
  const showEmptyState = !loading && events.length === 0;
  const showFilteredEmptyState =
    !loading && events.length > 0 && filteredEvents.length === 0;
  const hasVisibleEvents = filteredEvents.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Eventos</h1>
            <p className="text-muted-foreground">
              Busca eventos por ID (Skill), nombre o rango de fechas (máximo 6
              meses para búsqueda por fechas)
            </p>
          </div>
        </div>

        {/* Filtros Avanzados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tipo de Filtro */}
              <div className="grid gap-2">
                <Label htmlFor="filterType">Buscar por</Label>
                <Select
                  id="filterType"
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(
                      (e.target as HTMLSelectElement).value as
                        | "dateRange"
                        | "eventNumber"
                        | "eventName"
                    )
                  }
                >
                  <option value="dateRange">Rango de Fechas</option>
                  <option value="eventNumber">ID del Evento (Skill)</option>
                  <option value="eventName">Nombre del Evento</option>
                </Select>
              </div>

              {/* Campos según el tipo de filtro */}
              {filterType === "dateRange" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <div className="min-w-0">
                      <DatePicker
                        id="startDate"
                        value={startDate}
                        onInput={(e) =>
                          setStartDate((e.target as HTMLInputElement).value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <div className="min-w-0">
                      <DatePicker
                        id="endDate"
                        value={endDate}
                        onInput={(e) =>
                          setEndDate((e.target as HTMLInputElement).value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {filterType === "eventNumber" && (
                <div className="grid gap-2">
                  <Label htmlFor="eventNumber">ID del Evento (Skill)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="eventNumber"
                      placeholder="Ej: 12345"
                      className="pl-10"
                      value={eventNumber}
                      onInput={(e) =>
                        setEventNumber((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                </div>
              )}

              {filterType === "eventName" && (
                <div className="grid gap-2">
                  <Label htmlFor="eventName">Nombre del Evento</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="eventName"
                      placeholder="Buscar por nombre..."
                      className="pl-10"
                      value={eventName}
                      onInput={(e) =>
                        setEventName((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Filtro por segmento de mercado */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Segmento de Mercado
                </span>
                {segmentsLoading && availableSegments.length === 0 ? (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                    <span>Cargando segmentos…</span>
                  </div>
                ) : availableSegments.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {availableSegments.map((segment) => (
                      <FilterPill
                        key={segment.key}
                        checked={segmentFilters[segment.key] ?? true}
                        onChange={() => toggleSegmentFilter(segment.key) as any}
                        label={segment.label}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/80">
                    No hay segmentos disponibles.
                  </p>
                )}
              </div>

              {/* Filtro por estatus */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Estatus
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

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSearch}
                  className="flex-1"
                  disabled={loading}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar Eventos"}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>

              {/* Indicador de resultados */}
              {filteredEvents.length > 0 && !loading && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  Se encontraron <strong>{filteredEvents.length}</strong>{" "}
                  evento(s)
                  {hiddenByFilters > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground/80">
                      ({hiddenByFilters} oculto
                      {hiddenByFilters === 1 ? "" : "s"} por filtros)
                    </span>
                  )}
                </div>
              )}
              {events.length > 0 && filteredEvents.length === 0 && !loading && (
                <div className="text-sm text-amber-600 bg-amber-100/60 border border-amber-200 rounded-md p-3">
                  No hay eventos visibles con los filtros seleccionados. Ajusta
                  los filtros para ver resultados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-sm">
                  <Spinner size="lg" label="Cargando eventos..." />
                </div>
              )}
              {showEmptyState ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No se encontraron eventos
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa los filtros de arriba para buscar
                  </p>
                </div>
              ) : showFilteredEmptyState ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No hay eventos con los filtros seleccionados
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajusta los filtros de estatus o segmento para ver resultados
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">
                          ID Evento (Skill)
                        </TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Fecha Fin</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hasVisibleEvents ? (
                        filteredEvents.map((event) => {
                          const statusText = getEventStatusText(event);
                          const statusColor = getEventStatusColor(event);

                          return (
                            <TableRow
                              key={
                                (event as any)?.eventNumber?.toString() ??
                                event.idEvent
                              }
                            >
                              <TableCell className="font-mono text-xs">
                                {(event as any)?.eventNumber ?? "-"}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{event.title}</p>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {new Date(event.startDate).toLocaleDateString(
                                    "es-ES"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(event.endDate).toLocaleDateString(
                                  "es-ES"
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span
                                    className={`inline-flex h-3 w-3 rounded-full ${statusColor}`}
                                  />
                                  <span className="line-clamp-2">
                                    {statusText || "No especificado"}
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEventClick(event)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-sm text-muted-foreground"
                          >
                            {loading
                              ? "Preparando resultados…"
                              : "No hay eventos disponibles para mostrar."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
