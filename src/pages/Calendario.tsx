import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { apiService } from "../services/api.service";
import type { Event } from "../services/api.service";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
} from "lucide-preact";
import {
  STATUS_DEFINITIONS,
  DEFAULT_STATUS_FILTERS,
  classifyEventStatus,
  getEventStatusColor,
  getEventStatusText,
  collectMarketSegments,
  getEventMarketSegmentKey,
  getMarketSegmentKeyFromLabel,
  SEGMENT_FILTER_DEFAULTS,
  type SegmentOption,
  type StatusCategory,
} from "../lib/eventStatus";
import FilterPill from "../components/ui/FilterPill";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { parseDateLocal } from "../lib/dateUtils";

// Límite de eventos visibles por día antes de mostrar contador
const MAX_VISIBLE_EVENTS = 3;

export function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(() => ({ ...DEFAULT_STATUS_FILTERS }));
  const [segmentFilters, setSegmentFilters] = useState<Record<string, boolean>>(
    {}
  );
  const [baseSegments, setBaseSegments] = useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      const data = await apiService.getEvents(start, end);

      // Log para debugging - ver estructura de eventos
      if (data.length > 0) {
        console.log("Primer evento recibido:", data[0]);
        console.log("EventStatus del primer evento:", data[0].eventStatus);
      }

      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  const getEventsSpanningDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = startOfDay(parseDateLocal(event.startDate) || new Date());
      const eventEnd = startOfDay(parseDateLocal(event.endDate) || new Date());
      const currentDay = startOfDay(date);

      return isWithinInterval(currentDay, { start: eventStart, end: eventEnd });
    });
  };

  const calculateEventPosition = (event: Event, date: Date) => {
    const eventStart = startOfDay(parseDateLocal(event.startDate) || new Date());
    const eventEnd = startOfDay(parseDateLocal(event.endDate) || new Date());
    const currentDay = startOfDay(date);
    const monthStart = startOfDay(startOfMonth(currentDate));
    const monthEnd = startOfDay(endOfMonth(currentDate));

    const visibleStart = isBefore(eventStart, monthStart)
      ? monthStart
      : eventStart;
    const visibleEnd = isAfter(eventEnd, monthEnd) ? monthEnd : eventEnd;

    const isStartSegment = isSameDay(currentDay, visibleStart);
    const isEndSegment = isSameDay(currentDay, visibleEnd);

    const spanFromCurrent = differenceInDays(visibleEnd, currentDay) + 1;
    const totalVisibleDays = differenceInDays(visibleEnd, visibleStart) + 1;
    const daysSinceVisibleStart = differenceInDays(currentDay, visibleStart);

    return {
      isStartSegment,
      isEndSegment,
      spanFromCurrent,
      totalVisibleDays,
      daysSinceVisibleStart,
    };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: Event) => {
    // Guardar el evento en sessionStorage para carga instantánea
    sessionStorage.setItem("currentEvent", JSON.stringify(event));

    // Guardar el rango de fechas actual para posibles búsquedas futuras
    const searchRange = {
      startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    };
    sessionStorage.setItem(
      "currentEventSearchRange",
      JSON.stringify(searchRange)
    );

    // Guardar la página de origen para el botón "Volver"
    sessionStorage.setItem("eventDetailOrigin", "/calendario");

    // Navegar a la página de detalle
    route(`/eventos/${event.idEvent}`);
  };

  const selectedDateEvents: Event[] = selectedDate
    ? getEventsSpanningDate(selectedDate)
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Eventos</h1>
          <p className="text-muted-foreground">
            Vista mensual de eventos programados
          </p>
        </div>

        {/* Calendar Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 text-xs">
              <span className="mb-2 block font-medium text-foreground">
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

            {/* Status Legend */}
            <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t text-xs">
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Spinner size="md" label="Cargando calendario..." />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                  <div>Dom</div>
                  <div>Lun</div>
                  <div>Mar</div>
                  <div>Mié</div>
                  <div>Jue</div>
                  <div>Vie</div>
                  <div>Sáb</div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 overflow-hidden">
                  {/* Empty cells for padding */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days */}
                  {days.map((day) => {
                    const spanningEvents = getEventsSpanningDate(day);
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className="relative min-h-[84px] sm:min-h-[120px]"
                      >
                        {/* Day Cell */}
                        <button
                          onClick={() => handleDateClick(day)}
                          className={`absolute inset-0 p-2 rounded-md border transition-all hover:border-primary z-10 ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex flex-col items-start h-full">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-primary" : ""
                              }`}
                            >
                              {format(day, "d")}
                            </span>

                            {/* Mobile-only: mostrar número de eventos en el día */}
                            <span className="sm:hidden mt-1 text-xs text-muted-foreground">
                              {spanningEvents.length} Evento
                              {spanningEvents.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </button>

                        {/* Event Bars (oculto en móvil) */}
                        <div className="hidden sm:block absolute top-8 left-1 right-1 space-y-1 z-20 pointer-events-none overflow-visible">
                          {(() => {
                            const dayOfWeek = day.getDay();
                            const isStartOfWeek = dayOfWeek === 0;

                            const segments = spanningEvents
                              .map((event) => {
                                const position = calculateEventPosition(
                                  event,
                                  day
                                );

                                const shouldStartSegment =
                                  position.isStartSegment ||
                                  (isStartOfWeek &&
                                    position.daysSinceVisibleStart > 0);

                                if (!shouldStartSegment) {
                                  return null;
                                }

                                const daysAvailableInWeek = 7 - dayOfWeek;
                                const segmentSpan = Math.max(
                                  1,
                                  Math.min(
                                    position.spanFromCurrent,
                                    daysAvailableInWeek
                                  )
                                );

                                const segmentContinuesAfter =
                                  position.spanFromCurrent > segmentSpan;
                                const segmentContinuesBefore =
                                  !position.isStartSegment;

                                return {
                                  event,
                                  segmentSpan,
                                  segmentContinuesAfter,
                                  segmentContinuesBefore,
                                };
                              })
                              .filter(Boolean) as Array<{
                              event: Event;
                              segmentSpan: number;
                              segmentContinuesAfter: boolean;
                              segmentContinuesBefore: boolean;
                            }>;

                            const visibleSegments = segments.slice(
                              0,
                              MAX_VISIBLE_EVENTS
                            );
                            const hiddenCount =
                              segments.length - visibleSegments.length;

                            return (
                              <>
                                {visibleSegments.map(
                                  ({
                                    event,
                                    segmentSpan,
                                    segmentContinuesAfter,
                                    segmentContinuesBefore,
                                  }) => {
                                    const colorClass =
                                      getEventStatusColor(event);
                                    const statusCategory =
                                      classifyEventStatus(event);
                                    const textColorClass =
                                      statusCategory === "confirmado"
                                        ? "text-gray-900"
                                        : "text-white";
                                    const widthValue =
                                      segmentSpan === 1
                                        ? "100%"
                                        : `calc(${segmentSpan * 100}% + ${
                                            (segmentSpan - 1) * 10
                                          }px)`;

                                    const radiusClasses = [
                                      segmentContinuesBefore
                                        ? "rounded-l-none"
                                        : "",
                                      segmentContinuesAfter
                                        ? "rounded-r-none"
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ");

                                    return (
                                      <div
                                        key={`${
                                          event.idEvent
                                        }-${day.toISOString()}`}
                                        className={`${colorClass} ${textColorClass} text-[10px] px-1 py-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-transform duration-200 transform will-change-transform flex items-center gap-1 ${radiusClasses}`}
                                        style={{
                                          position: "relative",
                                          width: widthValue,
                                          transitionProperty:
                                            "transform, box-shadow, z-index",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEventClick(event);
                                        }}
                                        title={`${event.title} (${format(
                                          parseDateLocal(event.startDate) || new Date(),
                                          "d MMM"
                                        )} - ${format(
                                          parseDateLocal(event.endDate) || new Date(),
                                          "d MMM"
                                        )})`}
                                        onMouseEnter={(e) => {
                                          const el =
                                            e.currentTarget as HTMLElement;
                                          el.style.transform =
                                            "translateY(-6px) scale(1.03)";
                                          el.style.boxShadow =
                                            "0 10px 25px rgba(0,0,0,0.25)";
                                          el.style.zIndex = "60";
                                        }}
                                        onMouseLeave={(e) => {
                                          const el =
                                            e.currentTarget as HTMLElement;
                                          el.style.transform = "";
                                          el.style.boxShadow = "";
                                          el.style.zIndex = "";
                                        }}
                                      >
                                        {segmentContinuesBefore && (
                                          <span className="text-[8px]">…</span>
                                        )}
                                        <span className="truncate font-medium">
                                          {event.title}
                                        </span>
                                        {segmentContinuesAfter && (
                                          <span className="text-[8px]">…</span>
                                        )}
                                      </div>
                                    );
                                  }
                                )}

                                {/* Contador de eventos adicionales */}
                                {hiddenCount > 0 && (
                                  <div
                                    className="text-[10px] text-muted-foreground font-medium px-1 py-0.5 bg-secondary/50 rounded cursor-pointer hover:bg-secondary transition-colors pointer-events-auto"
                                    onClick={() => handleDateClick(day)}
                                  >
                                    + {hiddenCount} Evento
                                    {hiddenCount > 1 ? "s" : ""}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Eventos del{" "}
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay eventos programados para este día
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => {
                    const colorClass = getEventStatusColor(event);
                    const statusText = getEventStatusText(event);
                    return (
                      <div
                        key={event.idEvent}
                        className="p-4 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-1 h-full ${colorClass} rounded-full`}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description || "Sin descripción"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                {format(
                                  parseDateLocal(event.startDate) || new Date(),
                                  "d 'de' MMMM",
                                  {
                                    locale: es,
                                  }
                                )}{" "}
                                -{" "}
                                {format(
                                  parseDateLocal(event.endDate) || new Date(),
                                  "d 'de' MMMM",
                                  {
                                    locale: es,
                                  }
                                )}
                              </span>
                              {statusText && (
                                <span className="flex items-center gap-1">
                                  <div
                                    className={`w-2 h-2 ${colorClass} rounded-full`}
                                  />
                                  {statusText}
                                </span>
                              )}
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
        )}
      </div>
    </Layout>
  );
}
