import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
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
import { Search, Calendar, Eye, Filter, X, Check, FileSpreadsheet } from "lucide-preact";
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
import { parseDateLocal } from "../lib/dateUtils";
import { generateEventsExcelReport } from "../lib/reportUtils";

export function Eventos() {
  // Helper: devuelve ms restantes hasta creationDate + 1 mes, o null si no aplica
  const getCountdownMsForEvent = (event: Event): number | null => {
    try {
      const category = classifyEventStatus(event);
      if (!["opcion1", "opcion2", "opcion3"].includes(category)) return null;

      const raw =
        (event as any)?.creationDate ?? (event as any)?.CreationDate ?? null;
      if (!raw) return null;
      const creation = new Date(raw);
      if (Number.isNaN(creation.getTime())) return null;

      const addOneMonth = (d: Date) => {
        const copy = new Date(d.getTime());
        copy.setMonth(copy.getMonth() + 1);
        return copy;
      };

      const deadline = addOneMonth(creation);
      return deadline.getTime() - Date.now();
    } catch (e) {
      return null;
    }
  };

  const formatCountdownShort = (ms: number) => {
    const abs = Math.abs(ms);
    const days = Math.floor(abs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((abs / (1000 * 60)) % 60);
    if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
      2,
      "0"
    )}m`;
  };
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(() => ({ ...DEFAULT_STATUS_FILTERS }));
  const [segmentFilters, setSegmentFilters] = useState<Record<string, boolean>>(
    {}
  );
  const [baseSegments, setBaseSegments] = useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);

  const resolveEventDateRange = useCallback((event: Event) => {
    const rawEvent = event as any;
    const startCandidates: Date[] = [];
    const endCandidates: Date[] = [];

    const pushCandidate = (value: unknown, bucket: Date[]) => {
      if (value == null) {
        return;
      }

      if (value instanceof Date) {
        if (!Number.isNaN(value.getTime())) {
          bucket.push(value);
        }
        return;
      }

      if (typeof value === "number") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          bucket.push(date);
        }
        return;
      }

      if (typeof value === "string") {
        const parsed =
          parseDateLocal(value) ??
          (() => {
            const byNative = new Date(value);
            return Number.isNaN(byNative.getTime()) ? null : byNative;
          })();

        if (parsed) {
          bucket.push(parsed);
        }
      }
    };

    pushCandidate(rawEvent?.startDate, startCandidates);
    pushCandidate(rawEvent?.StartDate, startCandidates);
    pushCandidate(rawEvent?.eventStartDate, startCandidates);
    pushCandidate(rawEvent?.endDate, endCandidates);
    pushCandidate(rawEvent?.EndDate, endCandidates);
    pushCandidate(rawEvent?.eventEndDate, endCandidates);

    if (Array.isArray(rawEvent?.activities)) {
      rawEvent.activities.forEach((activity: any) => {
        pushCandidate(
          activity?.activityDate ?? activity?.startDate ?? activity?.date,
          startCandidates
        );
        pushCandidate(
          activity?.activityDate ?? activity?.endDate ?? activity?.finishDate,
          endCandidates
        );

        if (Array.isArray(activity?.rooms)) {
          activity.rooms.forEach((room: any) => {
            pushCandidate(room?.startDate ?? room?.date, startCandidates);
            pushCandidate(room?.endDate ?? room?.finishDate, endCandidates);
          });
        }
      });
    }

    if (Array.isArray(rawEvent?.eventRooms)) {
      rawEvent.eventRooms.forEach((room: any) => {
        pushCandidate(room?.startDate ?? room?.date, startCandidates);
        pushCandidate(room?.endDate ?? room?.finishDate, endCandidates);
      });
    }

    if (startCandidates.length === 0 && endCandidates.length === 0) {
      return { start: null, end: null };
    }

    const start =
      startCandidates.length > 0
        ? new Date(
            Math.min(...startCandidates.map((candidate) => candidate.getTime()))
          )
        : endCandidates.length > 0
        ? new Date(
            Math.min(...endCandidates.map((candidate) => candidate.getTime()))
          )
        : null;

    const end =
      endCandidates.length > 0
        ? new Date(
            Math.max(...endCandidates.map((candidate) => candidate.getTime()))
          )
        : startCandidates.length > 0
        ? new Date(
            Math.max(...startCandidates.map((candidate) => candidate.getTime()))
          )
        : null;

    return { start, end };
  }, []);

  // Filtros
  const [filterType, setFilterType] = useState<
    "dateRange" | "eventNumber" | "eventName"
  >("dateRange");
  const [eventNumber, setEventNumber] = useState("");
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return startOfMonth.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.toISOString().split("T")[0];
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

      const toISODate = (date: Date) => date.toISOString().split("T")[0];

      if (filterType === "dateRange") {
        const start =
          parseDateLocal(startDate) ?? new Date(`${startDate}T00:00:00`);
        const end = parseDateLocal(endDate) ?? new Date(`${endDate}T00:00:00`);

        // Extender el rango solicitado para incluir eventos que empiecen
        // ligeramente antes o terminen después del intervalo filtrado.
        const bufferedStart = new Date(start);
        bufferedStart.setDate(bufferedStart.getDate() - 7);
        const bufferedEnd = new Date(end);
        bufferedEnd.setDate(bufferedEnd.getDate() + 7);

        data = await apiService.getEvents(
          toISODate(bufferedStart),
          toISODate(bufferedEnd)
        );
      } else if (filterType === "eventNumber") {
        data = await apiService.getEvents(
          undefined,
          undefined,
          eventNumber.trim()
        );
      } else if (filterType === "eventName") {
        data = await apiService.getEvents(
          undefined,
          undefined,
          undefined,
          eventName.trim()
        );
      } else {
        data = await apiService.getEvents();
      }

      const deduped = new Map<string | number, Event>();
      data.forEach((eventItem) => {
        const key =
          (eventItem as any)?.eventNumber ??
          eventItem.idEvent ??
          `${eventItem.title}-${eventItem.startDate}`;

        if (!deduped.has(key)) {
          deduped.set(key, eventItem);
          return;
        }

        const existing = deduped.get(key)!;
        const currentActivities = Array.isArray((existing as any)?.activities)
          ? (existing as any).activities.length
          : 0;
        const incomingActivities = Array.isArray((eventItem as any)?.activities)
          ? (eventItem as any).activities.length
          : 0;

        if (incomingActivities > currentActivities) {
          deduped.set(key, eventItem);
        }
      });

      let normalized = Array.from(deduped.values());

      if (filterType === "eventNumber" && eventNumber.trim()) {
        normalized = normalized.filter((eventItem: Event) =>
          ((eventItem as any)?.eventNumber ?? "")
            .toString()
            .includes(eventNumber.trim())
        );
      }

      setEvents(normalized);
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

  const handleExportExcel = async () => {
    if (filteredEvents.length === 0) {
      alert(
        "No hay eventos visibles para exportar. Ajusta los filtros o realiza una búsqueda."
      );
      return;
    }

    setGeneratingReport(true);
    try {
      await generateEventsExcelReport(filteredEvents);
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      alert("Hubo un error al generar el reporte de Excel.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const clearFilters = () => {
    setEventNumber("");
    setEventName("");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(monthStart.toISOString().split("T")[0]);
    setEndDate(monthEnd.toISOString().split("T")[0]);
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

  const dateRangeBounds = useMemo(() => {
    if (filterType !== "dateRange" || !startDate || !endDate) {
      return null;
    }

    const startBoundary =
      parseDateLocal(startDate) ?? new Date(`${startDate}T00:00:00`);
    const endBoundary =
      parseDateLocal(endDate) ?? new Date(`${endDate}T00:00:00`);
    endBoundary.setHours(23, 59, 59, 999);

    return { startBoundary, endBoundary };
  }, [filterType, startDate, endDate]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (dateRangeBounds) {
          const { startBoundary, endBoundary } = dateRangeBounds;
          const { start: eventStart, end: eventEnd } =
            resolveEventDateRange(event);

          if (eventStart || eventEnd) {
            const startToCompare = eventStart ?? eventEnd!;
            const endToCompare = eventEnd ?? eventStart!;

            if (startToCompare > endBoundary || endToCompare < startBoundary) {
              return false;
            }
          }
        }

        const statusCategory = classifyEventStatus(event);
        const statusActive = statusFilters[statusCategory] !== false;

        const segmentKey = getEventMarketSegmentKey(event);
        const segmentActive = segmentFilters[segmentKey] !== false;

        return statusActive && segmentActive;
      }),
    [
      events,
      statusFilters,
      segmentFilters,
      dateRangeBounds,
      resolveEventDateRange,
    ]
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
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleSearch}
                  className="flex-1 min-w-[140px]"
                  disabled={loading}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar Eventos"}
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
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex-1 min-w-[140px]"
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
                                  {(
                                    parseDateLocal(event.startDate) ??
                                    new Date(event.startDate)
                                  ).toLocaleDateString("es-ES")}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(
                                  parseDateLocal(event.endDate) ??
                                  new Date(event.endDate)
                                ).toLocaleDateString("es-ES")}
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span
                                    className={`inline-flex h-3 w-3 rounded-full ${statusColor}`}
                                  />
                                  <span className="line-clamp-2">
                                    {statusText || "No especificado"}
                                  </span>
                                  {/* Countdown badge (compact) */}
                                  {(() => {
                                    const ms = getCountdownMsForEvent(event);
                                    if (ms === null) return null;
                                    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
                                    const cls =
                                      ms > oneWeekMs
                                        ? "bg-emerald-100 text-emerald-800"
                                        : ms > 0
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800";

                                    return (
                                      <span
                                        className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
                                        title={
                                          ms <= 0
                                            ? `Venció hace ${formatCountdownShort(
                                                ms
                                              )}`
                                            : `Expira en ${formatCountdownShort(
                                                ms
                                              )}`
                                        }
                                      >
                                        ⏳ {formatCountdownShort(ms)}
                                      </span>
                                    );
                                  })()}
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
