import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "preact/hooks";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import { apiService } from "../services/api.service";
import type { Event, Room } from "../services/api.service";
import {
  Calendar,
  Building,
  ClipboardList,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-preact";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isFuture,
  isPast,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  classifyEventStatus,
  getEventStatusColor,
  STATUS_DEFINITIONS,
  type StatusCategory,
} from "../lib/eventStatus";
import FilterPill from "../components/ui/FilterPill";
import { Check } from "lucide-preact";
import { calculateEventQuoteTotals } from "../lib/quoteUtils";

export function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const roomsPromiseRef = useRef<Promise<void> | null>(null);

  const [eventsByMonth, setEventsByMonth] = useState<Record<string, Event[]>>(
    {}
  );
  const eventsCacheRef = useRef<Record<string, Event[]>>({});
  const pendingFetchesRef = useRef<
    Record<string, Promise<Event[]> | undefined>
  >({});
  const [loadingMonths, setLoadingMonths] = useState<Record<string, boolean>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de estadísticas generales - por defecto todos activos excepto cancelado
  const [statsStatusFilters, setStatsStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >({
    confirmado: true,
    porConfirmar: true,
    opcion1: true,
    opcion2: true,
    opcion3: true,
    reunionInterna: true,
    eventoInterno: true,
    cancelado: false,
    otros: true,
  });

  const toggleStatsStatusFilter = (status: StatusCategory) => {
    setStatsStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const ensureRooms = useCallback(async () => {
    if (roomsLoaded) {
      return;
    }

    if (roomsPromiseRef.current) {
      await roomsPromiseRef.current;
      return;
    }

    const promise = apiService
      .getRooms()
      .then((data) => {
        setRooms(data);
        setRoomsLoaded(true);
      })
      .catch((err) => {
        console.error("Error loading rooms:", err);
        throw err;
      })
      .finally(() => {
        roomsPromiseRef.current = null;
      });

    roomsPromiseRef.current = promise;
    await promise;
  }, [roomsLoaded]);

  const loadEventsForMonth = useCallback(
    (monthDate: Date, options: { force?: boolean } = {}) => {
      const { force = false } = options;
      const monthKey = format(monthDate, "yyyy-MM");

      if (!force && eventsCacheRef.current[monthKey]) {
        return Promise.resolve(eventsCacheRef.current[monthKey]);
      }

      if (!force && pendingFetchesRef.current[monthKey]) {
        return pendingFetchesRef.current[monthKey];
      }

      setLoadingMonths((prev) => ({ ...prev, [monthKey]: true }));

      const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

      const fetchPromise = apiService
        .getEvents(startDate, endDate)
        .then((data) => {
          eventsCacheRef.current = {
            ...eventsCacheRef.current,
            [monthKey]: data,
          };
          setEventsByMonth((prev) => {
            if (prev[monthKey] === data) {
              return prev;
            }
            return {
              ...prev,
              [monthKey]: data,
            };
          });
          return data;
        })
        .catch((err) => {
          console.error(`Error loading events for ${monthKey}:`, err);
          eventsCacheRef.current = {
            ...eventsCacheRef.current,
          };
          delete eventsCacheRef.current[monthKey];
          throw err;
        })
        .finally(() => {
          setLoadingMonths((prev) => {
            const { [monthKey]: _removed, ...rest } = prev;
            return rest;
          });
          delete pendingFetchesRef.current[monthKey];
        });

      pendingFetchesRef.current[monthKey] = fetchPromise;
      return fetchPromise;
    },
    []
  );

  const handleLoadMonth = useCallback(
    (monthDate: Date) => {
      loadEventsForMonth(monthDate).catch((err) => {
        console.error("Error loading month on demand:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar los eventos del mes solicitado."
        );
      });
    },
    [loadEventsForMonth]
  );

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const selectedMonthKey = format(selectedMonth, "yyyy-MM");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const hasCachedMonth = !!eventsCacheRef.current[selectedMonthKey];

      if (!hasCachedMonth) {
        setLoading(true);
      }

      setError(null);

      try {
        await ensureRooms();
        await loadEventsForMonth(selectedMonth, { force: false });

        if (!eventsCacheRef.current[selectedMonthKey]) {
          // Si por alguna razón no se cargó, no continúes
          return;
        }

        if (isMounted) {
          setInitialLoading(false);
        }

        // Prefetch del mes anterior para estadísticas de crecimiento
        const previousMonth = subMonths(selectedMonth, 1);
        const previousKey = format(previousMonth, "yyyy-MM");
        if (!eventsCacheRef.current[previousKey]) {
          loadEventsForMonth(previousMonth).catch((err) => {
            console.warn("No se pudo precargar el mes anterior:", err);
          });
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al cargar datos del dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedMonthKey, ensureRooms, loadEventsForMonth]);
  const goPrevMonth = () =>
    setSelectedMonth((d) => startOfMonth(addMonths(d, -1)));
  const goNextMonth = () =>
    setSelectedMonth((d) => startOfMonth(addMonths(d, 1)));

  const handleMonthChange = (value: string) => {
    // value expected as 'YYYY-MM'
    const parts = value.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months 0-based
      setSelectedMonth(startOfMonth(new Date(year, month, 1)));
    }
  };

  const eventsInMonth = eventsByMonth[selectedMonthKey] ?? [];
  const previousMonthDate = subMonths(selectedMonth, 1);
  const previousMonthKey = format(previousMonthDate, "yyyy-MM");
  const previousMonthEvents = eventsByMonth[previousMonthKey] ?? [];
  const previousMonthLoaded = !!eventsByMonth[previousMonthKey];
  const isMonthLoading = loading || !!loadingMonths[selectedMonthKey];

  const stats = useMemo(() => {
    const filteredEvents = eventsInMonth.filter((event: Event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory] !== false;
    });

    const previousFiltered = previousMonthEvents.filter((event: Event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory] !== false;
    });

    const growthPercent =
      previousFiltered.length > 0
        ? ((filteredEvents.length - previousFiltered.length) /
            previousFiltered.length) *
          100
        : null;

    const upcomingEvents = filteredEvents.filter((event: Event) =>
      isFuture(startOfDay(new Date(event.startDate)))
    ).length;

    const pastEvents = filteredEvents.filter((event: Event) =>
      isPast(startOfDay(new Date(event.endDate)))
    ).length;

    const totalPax = filteredEvents.reduce((sum: number, event: Event) => {
      return sum + (event.estimatedPax || 0);
    }, 0);

    return {
      totalEvents: filteredEvents.length,
      rooms: rooms.length,
      growthPercent,
      upcomingEvents,
      pastEvents,
      totalPax,
      lastMonthEvents: previousFiltered.length,
      lastMonthLoaded: previousMonthLoaded,
    };
  }, [
    eventsInMonth,
    previousMonthEvents,
    previousMonthLoaded,
    rooms,
    statsStatusFilters,
  ]);

  const statusDistribution = useMemo(() => {
    const filteredEvents = eventsInMonth.filter((event: Event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory] !== false;
    });

    const distribution: Record<string, number> = {};
    filteredEvents.forEach((event: Event) => {
      const status = classifyEventStatus(event);
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }, [eventsInMonth, statsStatusFilters]);

  const monthlyTrend = useMemo(() => {
    const months: Array<{
      label: string;
      key: string;
      count: number | null;
      loading: boolean;
      date: Date;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(selectedMonth, i);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthEvents = eventsByMonth[monthKey];
      const filteredCount = monthEvents
        ? monthEvents.filter((event: Event) => {
            const statusCategory = classifyEventStatus(event);
            return statsStatusFilters[statusCategory] !== false;
          }).length
        : null;

      months.push({
        label: format(monthDate, "MMM", { locale: es }),
        key: monthKey,
        count: filteredCount,
        loading: !!loadingMonths[monthKey],
        date: monthDate,
      });
    }

    return months;
  }, [selectedMonth, eventsByMonth, statsStatusFilters, loadingMonths]);

  const upcomingEventsList = useMemo(() => {
    return eventsInMonth
      .filter((event: Event) => {
        const statusCategory = classifyEventStatus(event);
        return statsStatusFilters[statusCategory] !== false;
      })
      .filter((event: Event) => isFuture(startOfDay(new Date(event.startDate))))
      .sort(
        (a: Event, b: Event) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, 5);
  }, [eventsInMonth, statsStatusFilters]);

  const roomUsage = useMemo(() => {
    const filteredEvents = eventsInMonth.filter((event: Event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory] !== false;
    });

    const usage: Record<string, number> = {};
    filteredEvents.forEach((event: Event) => {
      if (event.eventRooms && Array.isArray(event.eventRooms)) {
        event.eventRooms.forEach((room: any) => {
          const roomName = room.roomName || room.name || "Sin nombre";
          usage[roomName] = (usage[roomName] || 0) + 1;
        });
      }
    });

    return Object.entries(usage)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [eventsInMonth, statsStatusFilters]);

  const quotationsBySegment = useMemo(() => {
    const segmentTotals: Record<string, number> = {};

    eventsInMonth.forEach((event: Event) => {
      const rawEvent = event as any;

      const statusCategory = classifyEventStatus(event);
      if (!statsStatusFilters[statusCategory]) {
        return;
      }

      const segmentName =
        rawEvent?.marketSegmentName ??
        rawEvent?.marketSegment?.marketSegmentName ??
        rawEvent?.eventMarketSegmentName ??
        rawEvent?.eventMarketSegment?.marketSegmentName ??
        rawEvent?.marketSegment?.name ??
        "Sin segmento";

      const { grandTotal } = calculateEventQuoteTotals(rawEvent);

      if (grandTotal > 0) {
        segmentTotals[segmentName] =
          (segmentTotals[segmentName] || 0) + grandTotal;
      }
    });

    return Object.entries(segmentTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [eventsInMonth, statsStatusFilters]);

  const maxTrendValue = Math.max(
    1,
    ...monthlyTrend
      .filter((month) => month.count !== null)
      .map((month) => month.count as number)
  );
  const maxStatusValue = Math.max(...Object.values(statusDistribution), 1);
  const maxQuotationValue = Math.max(
    ...quotationsBySegment.map((s) => s.total),
    1
  );

  const hasDataForSelectedMonth = eventsInMonth.length > 0;
  const shouldShowInitialSpinner =
    initialLoading && loading && !hasDataForSelectedMonth;
  const showOverlay = !initialLoading && isMonthLoading;

  if (shouldShowInitialSpinner) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" label="Preparando dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative space-y-6">
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
            <div className="rounded-md border border-muted bg-background/90 px-6 py-4 shadow-lg">
              <Spinner size="md" label="Actualizando información del mes..." />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Resumen ejecutivo de eventos -{" "}
              {format(selectedMonth, "MMMM yyyy", { locale: es })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-w-0">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                aria-label="Seleccionar mes"
                type="month"
                className="flex-1 min-w-0 bg-transparent outline-none cursor-pointer placeholder:text-muted-foreground truncate text-base sm:text-sm"
                value={format(selectedMonth, "yyyy-MM")}
                onInput={(e: any) => handleMonthChange(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filtros de Estatus para Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Filtrar Estadísticas por Estatus
            </CardTitle>
            <CardDescription>
              Selecciona los estatus que deseas incluir en las estadísticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STATUS_DEFINITIONS.map((definition) => (
                <FilterPill
                  key={definition.id}
                  checked={statsStatusFilters[definition.id]}
                  onChange={() => toggleStatsStatusFilter(definition.id) as any}
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
          </CardContent>
        </Card>

        {/* Stats Grid Principal */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos del Mes
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.upcomingEvents} próximos, {stats.pastEvents} finalizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.growthPercent !== null ? (
                  <>
                    {stats.growthPercent > 0 ? "+" : ""}
                    {stats.growthPercent.toFixed(1)}%
                  </>
                ) : (
                  "—"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastMonthLoaded
                  ? `vs mes anterior (${stats.lastMonthEvents} eventos)`
                  : "Cargando datos del mes anterior…"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Asistentes (PAX)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalPax.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimado total del mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salones</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rooms}</div>
              <p className="text-xs text-muted-foreground">
                Salones totales en el recinto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tendencia Mensual */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Eventos</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyTrend.map((month) => (
                  <div key={month.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {month.label}
                      </span>
                      <span className="text-muted-foreground">
                        {month.count !== null
                          ? `${month.count} evento${
                              month.count === 1 ? "" : "s"
                            }`
                          : month.loading
                          ? "Cargando…"
                          : "Sin datos"}
                      </span>
                    </div>
                    {month.count !== null ? (
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${
                              month.count === 0
                                ? 0
                                : (month.count / maxTrendValue) * 100
                            }%`,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        {month.loading ? (
                          <>
                            <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-primary border-t-transparent" />
                            <span className="text-xs text-muted-foreground">
                              Cargando datos…
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLoadMonth(month.date)}
                            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary">
                              +
                            </span>
                            Cargar datos de este mes
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribución por Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Estado</CardTitle>
              <CardDescription>Distribución del mes actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusDistribution).map(([status, count]) => {
                  const statusIcons: Record<string, any> = {
                    confirmado: CheckCircle,
                    tentativo: Clock,
                    cancelado: XCircle,
                    desconocido: AlertCircle,
                  };
                  const Icon = statusIcons[status] || ClipboardList;
                  const statusLabels: Record<string, string> = {
                    confirmado: "Confirmados",
                    tentativo: "Tentativos",
                    cancelado: "Cancelados",
                    desconocido: "Sin estado",
                  };

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {statusLabels[status] || status}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {count} eventos
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            status === "confirmado"
                              ? "bg-green-500"
                              : status === "tentativo"
                              ? "bg-yellow-500"
                              : status === "cancelado"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                          style={{
                            width: `${(count / maxStatusValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(statusDistribution).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay datos de eventos este mes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salones más utilizados */}
        {roomUsage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Salones Más Utilizados</CardTitle>
              <CardDescription>Top 5 del mes actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roomUsage.map((room, index) => (
                  <div key={room.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{room.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {room.count} eventos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${
                              (room.count / (roomUsage[0]?.count || 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cotizaciones por Segmento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Cotizaciones por Segmento</CardTitle>
              <CardDescription>
                Montos cotizados -{" "}
                {format(selectedMonth, "MMMM yyyy", { locale: es })}
              </CardDescription>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent
            className={`flex flex-col gap-4${
              quotationsBySegment.length === 0 ? " pb-6" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground">
              Los montos reflejan únicamente los estatus activos en la sección
              “Filtrar Estadísticas por Estatus”.
            </p>

            {quotationsBySegment.length > 0 && (
              <div className="space-y-3">
                {quotationsBySegment.map((segment, index) => (
                  <div key={segment.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold">
                        $
                        {segment.total.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{
                            width: `${
                              (segment.total / maxQuotationValue) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {quotationsBySegment.length === 0 && (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted/40 bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">
                No hay cotizaciones con los filtros seleccionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eventos Próximos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Eventos programados para los próximos días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEventsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay eventos próximos programados
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingEventsList.map((event) => {
                  const colorClass = getEventStatusColor(event);
                  const statusCategory = classifyEventStatus(event);

                  return (
                    <div
                      key={event.idEvent}
                      className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="text-2xl font-bold">
                          {format(new Date(event.startDate), "d")}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(new Date(event.startDate), "MMM", {
                            locale: es,
                          })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-1 h-full ${colorClass} rounded-full mt-1`}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium truncate">
                              {event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.description || "Sin descripción"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.estimatedPax || 0} PAX
                              </span>
                              <span className="capitalize">
                                {statusCategory}
                              </span>
                              {event.eventRooms &&
                                event.eventRooms.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {event.eventRooms.length} salón(es)
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
