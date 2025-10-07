import { useEffect, useState, useMemo } from "preact/hooks";
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
  isWithinInterval,
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

export function Dashboard() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filtros de cotizaciones - por defecto solo confirmado y por confirmar
  const [quotationStatusFilters, setQuotationStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >({
    confirmado: true,
    porConfirmar: true,
    opcion1: false,
    opcion2: false,
    opcion3: false,
    reunionInterna: false,
    eventoInterno: false,
    cancelado: false,
    otros: false,
  });

  const toggleQuotationStatusFilter = (status: StatusCategory) => {
    setQuotationStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const now = new Date();

      // Cargar eventos de los últimos 6 meses para análisis de tendencias
      const sixMonthsAgo = subMonths(now, 6);
      const startDate = format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd");
      const endDate = format(endOfMonth(now), "yyyy-MM-dd");

      const [eventsData, roomsData] = await Promise.all([
        apiService.getEvents(startDate, endDate),
        apiService.getRooms(),
      ]);

      setAllEvents(eventsData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mes seleccionado para mostrar las estadísticas (por defecto mes actual)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

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

  // Eventos del mes seleccionado (derivado de allEvents)
  const eventsInMonth = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return allEvents.filter((e: Event) => {
      const eventStart = new Date(e.startDate);
      return isWithinInterval(eventStart, { start, end });
    });
  }, [allEvents, selectedMonth]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    // Filtrar eventos según los filtros de estatus seleccionados
    const filteredEvents = eventsInMonth.filter((event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory];
    });

    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    const lastMonthEvents = allEvents
      .filter((e) => {
        const eventStart = new Date(e.startDate);
        return isWithinInterval(eventStart, {
          start: lastMonthStart,
          end: lastMonthEnd,
        });
      })
      .filter((event) => {
        const statusCategory = classifyEventStatus(event);
        return statsStatusFilters[statusCategory];
      }).length;

    const growthNum =
      lastMonthEvents > 0
        ? ((filteredEvents.length - lastMonthEvents) / lastMonthEvents) * 100
        : 0;

    // Eventos próximos (futuros)
    const upcomingEvents = filteredEvents.filter((e) =>
      isFuture(startOfDay(new Date(e.startDate)))
    ).length;

    // Eventos pasados este mes
    const pastEvents = filteredEvents.filter((e) =>
      isPast(startOfDay(new Date(e.endDate)))
    ).length;

    // PAX total estimado
    const totalPax = filteredEvents.reduce(
      (sum, e) => sum + (e.estimatedPax || 0),
      0
    );

    return {
      totalEvents: filteredEvents.length,
      rooms: rooms.length,
      growth: growthNum.toFixed(1),
      growthNum,
      upcomingEvents,
      pastEvents,
      totalPax,
      lastMonthEvents,
    };
  }, [eventsInMonth, allEvents, rooms, statsStatusFilters]);

  // Distribución por estado (muestra todos pero se puede filtrar visualmente)
  const statusDistribution = useMemo(() => {
    const filteredEvents = eventsInMonth.filter((event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory];
    });

    const distribution: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      const status = classifyEventStatus(event);
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }, [eventsInMonth, statsStatusFilters]);

  // Tendencia mensual (últimos 6 meses)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const count = allEvents
        .filter((e) => {
          const eventStart = new Date(e.startDate);
          return isWithinInterval(eventStart, {
            start: monthStart,
            end: monthEnd,
          });
        })
        .filter((event) => {
          const statusCategory = classifyEventStatus(event);
          return statsStatusFilters[statusCategory];
        }).length;

      months.push({
        label: format(monthDate, "MMM", { locale: es }),
        count,
      });
    }

    return months;
  }, [allEvents, statsStatusFilters]);

  // Eventos próximos ordenados
  const upcomingEventsList = useMemo(() => {
    return eventsInMonth
      .filter((event) => {
        const statusCategory = classifyEventStatus(event);
        return statsStatusFilters[statusCategory];
      })
      .filter((e) => isFuture(startOfDay(new Date(e.startDate))))
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, 5);
  }, [eventsInMonth, statsStatusFilters]);

  // Salones más utilizados
  const roomUsage = useMemo(() => {
    const filteredEvents = eventsInMonth.filter((event) => {
      const statusCategory = classifyEventStatus(event);
      return statsStatusFilters[statusCategory];
    });

    const usage: Record<string, number> = {};
    filteredEvents.forEach((event) => {
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

  // Cotizaciones por Segmento de Mercado
  const quotationsBySegment = useMemo(() => {
    const segmentTotals: Record<string, number> = {};

    eventsInMonth.forEach((event) => {
      const rawEvent = event as any;

      // Filtrar por estatus seleccionado
      const statusCategory = classifyEventStatus(event);
      if (!quotationStatusFilters[statusCategory]) {
        return; // Saltar eventos cuyo estatus no está seleccionado
      }

      // Obtener el segmento de mercado
      const segmentName =
        rawEvent?.marketSegmentName ??
        rawEvent?.marketSegment?.marketSegmentName ??
        rawEvent?.eventMarketSegmentName ??
        rawEvent?.eventMarketSegment?.marketSegmentName ??
        rawEvent?.marketSegment?.name ??
        "Sin segmento";

      // Calcular total del evento (salones + servicios)
      let eventTotal = 0;

      // Sumar salones
      if (rawEvent?.activities && Array.isArray(rawEvent.activities)) {
        rawEvent.activities.forEach((activity: any) => {
          if (activity.rooms && Array.isArray(activity.rooms)) {
            activity.rooms.forEach((room: any) => {
              const precio = room.priceTNI || room.priceTI || 0;
              eventTotal += precio;
            });
          }

          // Sumar servicios
          if (activity.services && Array.isArray(activity.services)) {
            activity.services.forEach((service: any) => {
              const precio = service.priceTNI || service.priceTI || 0;
              const cantidad = service.quantity || service.serviceQuantity || 1;
              eventTotal += precio * cantidad;
            });
          }
        });
      }

      // Agregar al total del segmento
      if (eventTotal > 0) {
        segmentTotals[segmentName] =
          (segmentTotals[segmentName] || 0) + eventTotal;
      }
    });

    return Object.entries(segmentTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [eventsInMonth, quotationStatusFilters]);

  const maxTrendValue = Math.max(...monthlyTrend.map((m) => m.count), 1);
  const maxStatusValue = Math.max(...Object.values(statusDistribution), 1);
  const maxQuotationValue = Math.max(
    ...quotationsBySegment.map((s) => s.total),
    1
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" label="Cargando dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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
                {stats.growthNum > 0 ? "+" : ""}
                {stats.growth}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs mes anterior ({stats.lastMonthEvents} eventos)
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
                Disponibles en el sistema
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
                  <div key={month.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {month.label}
                      </span>
                      <span className="text-muted-foreground">
                        {month.count} eventos
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(month.count / maxTrendValue) * 100}%`,
                        }}
                      />
                    </div>
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
          <CardContent>
            {/* Filtros de Estatus */}
            <div className={quotationsBySegment.length > 0 ? "mb-4 space-y-2" : "space-y-2"}>
              <span className="text-xs font-medium text-muted-foreground">
                Filtrar por estatus:
              </span>
              <div className="flex flex-wrap gap-2">
                {STATUS_DEFINITIONS.map((definition) => (
                  <FilterPill
                    key={definition.id}
                    checked={quotationStatusFilters[definition.id]}
                    onChange={() =>
                      toggleQuotationStatusFilter(definition.id) as any
                    }
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

            {quotationsBySegment.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center py-8 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  No hay cotizaciones con los filtros seleccionados
                </p>
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
