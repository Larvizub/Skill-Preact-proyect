import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { route } from "preact-router";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DatePicker } from "../components/ui/datepicker";
import { Spinner } from "../components/ui/spinner";
import { Select } from "../components/ui/select";
import { apiService } from "../services/api.service";
import type { Event, Room, Schedule } from "../services/api.service";
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
const GANTT_DAY_WIDTH = 44;
const GANTT_ROOM_COL_WIDTH = 220;
const DAY_HOUR_WIDTH = 56;
const DAY_EVENT_COL_WIDTH = 280;
const MINUTES_IN_DAY = 24 * 60;
const DAY_SCHEDULE_TIMEOUT_MS = 3000;
const DAY_SCHEDULE_MAX_CONCURRENCY = 8;

type CalendarView = "month" | "rooms" | "day";

interface RoomLane {
  key: string;
  label: string;
  sortOrder: number;
}

interface LaneSegment {
  event: Event;
  startIndex: number;
  endIndex: number;
  track: number;
}

interface DayTimeSegment {
  startMinutes: number;
  endMinutes: number;
  label: string;
}

interface DayRoomSegment extends DayTimeSegment {
  event: Event;
  statusText: string;
  track: number;
}

interface DayRoomRow {
  lane: RoomLane;
  segments: DayRoomSegment[];
}

interface CalendarReturnCache {
  savedAt: number;
  currentDate: string;
  selectedDayValue: string;
  selectedDate: string | null;
  calendarView: CalendarView;
  statusFilters: Record<StatusCategory, boolean>;
  segmentFilters: Record<string, boolean>;
  selectedRoomLaneKey: string;
  events: Event[];
  rooms: Room[];
}

interface HoverTooltipState {
  event: Event;
  timeLabel?: string;
  left: number;
  top: number;
  placement: "top" | "bottom";
}

const CALENDAR_RETURN_CACHE_KEY = "calendar:return-cache";
let inMemoryCalendarReturnCache: CalendarReturnCache | null = null;

export function Calendario() {
  const skipEventsFetchCountRef = useRef(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  // monthPickerValue eliminado: usamos el DatePicker directamente para navegar
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [statusFilters, setStatusFilters] = useState<
    Record<StatusCategory, boolean>
  >(() => ({ ...DEFAULT_STATUS_FILTERS }));
  const [segmentFilters, setSegmentFilters] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedRoomLaneKey, setSelectedRoomLaneKey] = useState("");
  const [daySchedulesByEventId, setDaySchedulesByEventId] = useState<
    Record<number, Schedule[]>
  >({});
  const [daySchedulesLoading, setDaySchedulesLoading] = useState(false);
  const [selectedDayValue, setSelectedDayValue] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const daySchedulesCacheRef = useRef<Record<number, Schedule[]>>({});
  const [baseSegments, setBaseSegments] = useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipState | null>(
    null
  );
  const selectedDay = useMemo(() => {
    const parsed = parseDateLocal(selectedDayValue) || new Date(selectedDayValue);
    if (Number.isNaN(parsed.getTime())) return startOfDay(new Date());
    return startOfDay(parsed);
  }, [selectedDayValue]);
  const selectedDayKey = useMemo(
    () => format(selectedDay, "yyyy-MM-dd"),
    [selectedDay]
  );
  const dayHours = useMemo(
    () => Array.from({ length: 24 }, (_, index) => index),
    []
  );

  useEffect(() => {
    try {
      const cached =
        inMemoryCalendarReturnCache ??
        (() => {
          const raw = sessionStorage.getItem(CALENDAR_RETURN_CACHE_KEY);
          if (!raw) return null;
          return JSON.parse(raw) as CalendarReturnCache;
        })();

      if (!cached) return;

      const cachedDate = parseDateLocal(cached.currentDate) || new Date(cached.currentDate);
      const cachedDay =
        parseDateLocal(cached.selectedDayValue) || new Date(cached.selectedDayValue);
      const cachedSelectedDate = cached.selectedDate
        ? parseDateLocal(cached.selectedDate) || new Date(cached.selectedDate)
        : null;

      if (Number.isNaN(cachedDate.getTime()) || Number.isNaN(cachedDay.getTime())) {
        sessionStorage.removeItem(CALENDAR_RETURN_CACHE_KEY);
        return;
      }

      skipEventsFetchCountRef.current = 2;
      setCurrentDate(startOfDay(cachedDate));
      setSelectedDayValue(format(cachedDay, "yyyy-MM-dd"));
      setSelectedDate(
        cachedSelectedDate && !Number.isNaN(cachedSelectedDate.getTime())
          ? startOfDay(cachedSelectedDate)
          : null
      );
      setCalendarView(cached.calendarView || "month");
      setStatusFilters(
        cached.statusFilters
          ? { ...DEFAULT_STATUS_FILTERS, ...cached.statusFilters }
          : { ...DEFAULT_STATUS_FILTERS }
      );
      setSegmentFilters(cached.segmentFilters || {});
      setSelectedRoomLaneKey(cached.selectedRoomLaneKey || "");
      setEvents(Array.isArray(cached.events) ? cached.events : []);
      setRooms(Array.isArray(cached.rooms) ? cached.rooms : []);
      setLoading(false);

      inMemoryCalendarReturnCache = null;
      sessionStorage.removeItem(CALENDAR_RETURN_CACHE_KEY);
    } catch (error) {
      inMemoryCalendarReturnCache = null;
      sessionStorage.removeItem(CALENDAR_RETURN_CACHE_KEY);
    }
  }, []);

  // Helper: countdown for events in opcion1/2/3
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

  useEffect(() => {
    if (skipEventsFetchCountRef.current > 0) {
      skipEventsFetchCountRef.current -= 1;
      return;
    }

    loadEvents();
  }, [currentDate]);

  // Antes había un input tipo month con handlers; ahora usamos el DatePicker

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      const [eventsData, roomsData] = await Promise.all([
        apiService.getEvents(start, end),
        apiService.getRooms().catch(() => []),
      ]);

      setEvents(eventsData);
      const activeRooms = (roomsData as Room[])
        .filter((room) => room.roomActive)
        .sort((a, b) => {
          const orderA = Number(a.roomVisualOrder ?? 0);
          const orderB = Number(b.roomVisualOrder ?? 0);
          if (orderA !== orderB) return orderA - orderB;
          return (a.roomName || "").localeCompare(b.roomName || "", "es");
        });
      setRooms(activeRooms);
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

  const dayEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const eventStart = startOfDay(
          parseDateLocal(event.startDate) || new Date(event.startDate)
        );
        const eventEnd = startOfDay(
          parseDateLocal(event.endDate) || new Date(event.endDate)
        );

        return isWithinInterval(selectedDay, { start: eventStart, end: eventEnd });
      }),
    [filteredEvents, selectedDay]
  );

  const parseTimeToMinutes = (value?: string | null) => {
    if (!value || typeof value !== "string") return null;

    const trimmed = value.trim();

    const parseDateTimeString = (input: string) => {
      const normalized = input.includes("T") ? input : input.replace(" ", "T");
      const parsed = new Date(normalized);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.getHours() * 60 + parsed.getMinutes();
    };

    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return parseDateTimeString(trimmed);
    }

    const match24h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (match24h) {
      const hours = Number(match24h[1]);
      const minutes = Number(match24h[2]);

      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

      return hours * 60 + minutes;
    }

    const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match12h) return null;

    let hours = Number(match12h[1]);
    const minutes = Number(match12h[2]);
    const meridiem = match12h[3].toUpperCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;

    return hours * 60 + minutes;
  };

  const getDateKey = (value: unknown) => {
    if (!value) return null;

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      return format(startOfDay(value), "yyyy-MM-dd");
    }

    if (typeof value === "string") {
      const ddmmyyyy = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
      if (ddmmyyyy) {
        const normalized = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00`;
        const parsedLocal = new Date(normalized);
        if (!Number.isNaN(parsedLocal.getTime())) {
          return format(startOfDay(parsedLocal), "yyyy-MM-dd");
        }
      }

      const normalized = value.includes("T") ? value : value.replace(" ", "T");
      const parsed = parseDateLocal(value) || new Date(normalized);
      if (Number.isNaN(parsed.getTime())) return null;
      return format(startOfDay(parsed), "yyyy-MM-dd");
    }

    return null;
  };

  const getActivitySegments = (event: Event): DayTimeSegment[] => {
    const rawActivities = (event as any)?.activities;
    if (!Array.isArray(rawActivities) || rawActivities.length === 0) return [];

    const segments: DayTimeSegment[] = [];
    const visited = new WeakSet<object>();

    const dateKeyHints = [
      "date",
      "activityDate",
      "eventActivityStartDate",
      "eventActivityEndDate",
      "startDate",
      "endDate",
      "scheduledDate",
    ];
    const startHints = [
      "eventActivityStartDate",
      "roomReservationFromDate",
      "startTime",
      "activityStartTime",
      "startHour",
      "hourFrom",
      "fromTime",
      "timeFrom",
    ];
    const endHints = [
      "eventActivityEndDate",
      "roomReservationToDate",
      "endTime",
      "activityEndTime",
      "endHour",
      "hourTo",
      "toTime",
      "timeTo",
      "finishTime",
    ];

    const pickValueByHints = (source: any, hints: string[]) => {
      for (const hint of hints) {
        if (source?.[hint] != null) {
          return source[hint];
        }
      }
      return null;
    };

    const collectDateKeys = (value: any, keys: Set<string>) => {
      if (value == null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => collectDateKeys(item, keys));
        return;
      }

      if (typeof value === "object") {
        if (visited.has(value)) return;
        visited.add(value);

        Object.entries(value).forEach(([key, nested]) => {
          const normalizedKey = key.toLowerCase();
          if (dateKeyHints.some((hint) => normalizedKey.includes(hint.toLowerCase()))) {
            const keyValue = getDateKey(nested);
            if (keyValue) keys.add(keyValue);
          }

          collectDateKeys(nested, keys);
        });
      }
    };

    rawActivities.forEach((activity: any) => {
      const explicitActivityDate = getDateKey(activity?.activityDate);
      const explicitStartRaw =
        activity?.startTime ?? activity?.eventActivityStartDate ?? null;
      const explicitEndRaw =
        activity?.endTime ?? activity?.eventActivityEndDate ?? null;

      const startFromExplicit = parseTimeToMinutes(
        typeof explicitStartRaw === "string"
          ? explicitStartRaw
          : String(explicitStartRaw ?? "")
      );
      const endFromExplicit = parseTimeToMinutes(
        typeof explicitEndRaw === "string"
          ? explicitEndRaw
          : String(explicitEndRaw ?? "")
      );

      const startDateFromExplicit = getDateKey(explicitStartRaw);
      const endDateFromExplicit = getDateKey(explicitEndRaw);
      const explicitDateMatchesToday =
        explicitActivityDate === selectedDayKey ||
        startDateFromExplicit === selectedDayKey ||
        endDateFromExplicit === selectedDayKey;

      if (
        explicitDateMatchesToday &&
        startFromExplicit != null &&
        endFromExplicit != null
      ) {
        const normalizedStart = Math.max(
          0,
          Math.min(startFromExplicit, MINUTES_IN_DAY - 1)
        );
        const normalizedEnd = Math.max(
          normalizedStart + 15,
          Math.min(endFromExplicit, MINUTES_IN_DAY)
        );

        const formatLabelTime = (raw: unknown) => {
          if (typeof raw !== "string") return "--:--";
          const text = raw.trim();
          const timeMatch = text.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
          if (timeMatch) return timeMatch[1].padStart(5, "0");
          return text.length >= 5 ? text.slice(0, 5) : "--:--";
        };

        segments.push({
          startMinutes: normalizedStart,
          endMinutes: normalizedEnd,
          label: `${formatLabelTime(explicitStartRaw)} - ${formatLabelTime(
            explicitEndRaw
          )}`,
        });
        return;
      }

      const activityDateKeys = new Set<string>();
      collectDateKeys(activity, activityDateKeys);

      const hasDateInfo = activityDateKeys.size > 0;
      if (hasDateInfo && !activityDateKeys.has(selectedDayKey)) {
        return;
      }

      const directStart = pickValueByHints(activity, startHints);
      const directEnd = pickValueByHints(activity, endHints);

      const nestedContainers = [
        activity?.schedule,
        activity?.schedules,
        activity?.activitySchedule,
      ].flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));

      const pairs: Array<{ startRaw: unknown; endRaw: unknown }> = [];

      if (directStart != null || directEnd != null) {
        pairs.push({ startRaw: directStart, endRaw: directEnd });
      }

      nestedContainers.forEach((container) => {
        if (!container || typeof container !== "object") return;

        const startRaw = pickValueByHints(container, startHints);
        const endRaw = pickValueByHints(container, endHints);
        if (startRaw != null || endRaw != null) {
          pairs.push({ startRaw, endRaw });
        }
      });

      pairs.forEach(({ startRaw, endRaw }) => {
        const start = parseTimeToMinutes(
          typeof startRaw === "string" ? startRaw : String(startRaw || "")
        );
        const end = parseTimeToMinutes(
          typeof endRaw === "string" ? endRaw : String(endRaw || "")
        );

        if (start == null && end == null) return;

        const normalizedStart = Math.max(
          0,
          Math.min(start ?? end ?? 0, MINUTES_IN_DAY - 1)
        );
        const normalizedEnd = Math.max(
          normalizedStart + 15,
          Math.min(end ?? start ?? MINUTES_IN_DAY, MINUTES_IN_DAY)
        );

        const formatLabelTime = (raw: unknown) => {
          if (typeof raw !== "string") return "--:--";
          const text = raw.trim();
          const timeMatch = text.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
          if (timeMatch) return timeMatch[1].padStart(5, "0");
          return text.length >= 5 ? text.slice(0, 5) : "--:--";
        };

        const startLabel = formatLabelTime(startRaw);
        const endLabel = formatLabelTime(endRaw);

        segments.push({
          startMinutes: normalizedStart,
          endMinutes: normalizedEnd,
          label: `${startLabel} - ${endLabel}`,
        });
      });
    });

    return segments.sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const activitySegmentsByEventId = useMemo(() => {
    const map: Record<number, DayTimeSegment[]> = {};

    dayEvents.forEach((event) => {
      map[event.idEvent] = getActivitySegments(event);
    });

    return map;
  }, [dayEvents, selectedDayKey]);

  const dayEventsNeedingScheduleLookup = useMemo(
    () => dayEvents.filter((event) => (activitySegmentsByEventId[event.idEvent] || []).length === 0),
    [dayEvents, activitySegmentsByEventId]
  );

  const hasAnyActivityScheduleForDay = useMemo(
    () => dayEventsNeedingScheduleLookup.length < dayEvents.length,
    [dayEvents.length, dayEventsNeedingScheduleLookup.length]
  );

  useEffect(() => {
    if (calendarView !== "day") return;
    if (dayEvents.length === 0) {
      setDaySchedulesByEventId({});
      setDaySchedulesLoading(false);
      return;
    }

    if (hasAnyActivityScheduleForDay) {
      setDaySchedulesByEventId({});
      setDaySchedulesLoading(false);
      return;
    }

    let active = true;

    const cachedMap: Record<number, Schedule[]> = {};
    const pendingEvents = dayEventsNeedingScheduleLookup.filter((event) => {
      const cached = daySchedulesCacheRef.current[event.idEvent];
      if (cached) {
        cachedMap[event.idEvent] = cached;
        return false;
      }
      return true;
    });

    setDaySchedulesByEventId(cachedMap);

    if (pendingEvents.length === 0) {
      setDaySchedulesLoading(false);
      return () => {
        active = false;
      };
    }

    setDaySchedulesLoading(!hasAnyActivityScheduleForDay);

    const fetchWithTimeout = async (eventNumber: number) => {
      const timeoutPromise = new Promise<Schedule[]>((resolve) => {
        setTimeout(() => resolve([]), DAY_SCHEDULE_TIMEOUT_MS);
      });

      const schedulesPromise = apiService
        .getSchedules(undefined, undefined, eventNumber)
        .catch(() => [] as Schedule[]);

      return Promise.race([schedulesPromise, timeoutPromise]);
    };

    const loadSchedules = async () => {
      const entries: Array<readonly [number, Schedule[]]> = [];

      for (
        let offset = 0;
        offset < pendingEvents.length;
        offset += DAY_SCHEDULE_MAX_CONCURRENCY
      ) {
        const chunk = pendingEvents.slice(
          offset,
          offset + DAY_SCHEDULE_MAX_CONCURRENCY
        );

        const chunkEntries = await Promise.all(
          chunk.map(async (event) => {
            const eventNumber = Number(
              (event as any)?.eventNumber ?? event.eventNumber
            );

            if (!eventNumber || Number.isNaN(eventNumber)) {
              return [event.idEvent, [] as Schedule[]] as const;
            }

            const schedules = await fetchWithTimeout(eventNumber);

            const todaySchedules = (schedules || []).filter((schedule) => {
              const scheduleDate =
                parseDateLocal(schedule.date) || new Date(schedule.date);
              if (Number.isNaN(scheduleDate.getTime())) return false;

              return (
                format(startOfDay(scheduleDate), "yyyy-MM-dd") ===
                selectedDayKey
              );
            });

            return [event.idEvent, todaySchedules] as const;
          })
        );

        entries.push(...chunkEntries);
      }

      if (!active) return;

      const fetchedMap: Record<number, Schedule[]> = {};
      entries.forEach(([eventId, schedules]) => {
        fetchedMap[eventId] = schedules;
      });

      daySchedulesCacheRef.current = {
        ...daySchedulesCacheRef.current,
        ...fetchedMap,
      };

      setDaySchedulesByEventId({
        ...cachedMap,
        ...fetchedMap,
      });
      setDaySchedulesLoading(false);
    };

    loadSchedules().catch(() => {
      if (!active) return;
      setDaySchedulesLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    calendarView,
    dayEvents,
    dayEventsNeedingScheduleLookup,
    hasAnyActivityScheduleForDay,
    selectedDayKey,
  ]);

  const dayEventSegmentsByEventId = useMemo(() => {
    const map: Record<number, DayTimeSegment[]> = {};

    dayEvents.forEach((event) => {
      const activitySegments = activitySegmentsByEventId[event.idEvent] || [];
      if (activitySegments.length > 0) {
        map[event.idEvent] = activitySegments;
        return;
      }

      const schedules = daySchedulesByEventId[event.idEvent] || [];

      const scheduleSegments: DayTimeSegment[] = schedules
        .map((schedule) => {
          const start = parseTimeToMinutes(schedule.startTime);
          const end = parseTimeToMinutes(schedule.endTime);

          if (start == null || end == null) return null;

          const normalizedStart = Math.max(0, Math.min(start, MINUTES_IN_DAY - 1));
          const normalizedEnd = Math.max(
            normalizedStart + 15,
            Math.min(end, MINUTES_IN_DAY)
          );

          return {
            startMinutes: normalizedStart,
            endMinutes: normalizedEnd,
            label: `${schedule.startTime?.slice(0, 5) || "--:--"} - ${
              schedule.endTime?.slice(0, 5) || "--:--"
            }`,
          };
        })
        .filter(Boolean) as DayTimeSegment[];

      if (scheduleSegments.length > 0) {
        map[event.idEvent] = scheduleSegments;
        return;
      }

      map[event.idEvent] = [
        {
          startMinutes: 0,
          endMinutes: MINUTES_IN_DAY,
          label: "Sin horario",
        },
      ];
    });

    return map;
  }, [dayEvents, daySchedulesByEventId, activitySegmentsByEventId]);

  const monthStartDay = startOfDay(monthStart);
  const monthEndDay = startOfDay(monthEnd);

  const roomLanes = useMemo(() => {
    const normalizedNameToKey = new Map<string, string>();
    const laneByKey = new Map<string, RoomLane>();

    rooms.forEach((room, index) => {
      const key = `id:${room.idRoom}`;
      const label = room.roomName || room.roomCode || `Salón ${room.idRoom}`;
      laneByKey.set(key, {
        key,
        label,
        sortOrder: Number(room.roomVisualOrder ?? index),
      });

      const normalizedName = label
        .trim()
        .normalize("NFD")
        .replace(/[\u0000-\u036f]/g, "")
        .toLowerCase();
      if (normalizedName) {
        normalizedNameToKey.set(normalizedName, key);
      }
    });

    const extractLaneKeys = (event: Event): string[] => {
      const keys = new Set<string>();
      const roomNames = new Set<string>();
      const visited = new WeakSet<object>();

      const keySuggestsRoom = (key?: string) => {
        if (!key) return false;
        const normalized = key
          .trim()
          .normalize("NFD")
          .replace(/[\u0000-\u036f]/g, "")
          .toLowerCase();

        return (
          normalized.includes("room") ||
          normalized.includes("salon") ||
          normalized.includes("space")
        );
      };

      const tryPushId = (value: any) => {
        const id = Number(value);
        if (Number.isNaN(id) || id <= 0) return;
        keys.add(`id:${id}`);
      };

      const tryPushName = (value: any) => {
        if (!value) return;
        const text = String(value);
        const tokens = [text, ...text.split(/[;,/|]+/g)];

        tokens.forEach((token) => {
          const normalized = token
            .trim()
            .normalize("NFD")
            .replace(/[\u0000-\u036f]/g, "")
            .toLowerCase();
          if (!normalized) return;

          const existingLaneKey = normalizedNameToKey.get(normalized);
          if (existingLaneKey) {
            keys.add(existingLaneKey);
            return;
          }

          roomNames.add(token.trim());
        });
      };

      const scan = (value: any, keyHint?: string) => {
        if (value == null) return;

        if (Array.isArray(value)) {
          value.forEach((item) => scan(item, keyHint));
          return;
        }

        if (typeof value === "number") {
          if (keySuggestsRoom(keyHint)) {
            tryPushId(value);
          }
          return;
        }

        if (typeof value === "string") {
          if (keySuggestsRoom(keyHint)) {
            const match = value.match(/\d+/);
            if (match) {
              tryPushId(match[0]);
            }
            tryPushName(value);
          }
          return;
        }

        if (typeof value !== "object") return;
        if (visited.has(value)) return;
        visited.add(value);

        tryPushId((value as any).idRoom);
        tryPushId((value as any).roomId);
        tryPushId((value as any).idSalon);
        tryPushId((value as any).salonId);
        tryPushId((value as any).idSpace);
        tryPushId((value as any).spaceId);

        tryPushName((value as any).roomName);
        tryPushName((value as any).salonName);
        tryPushName((value as any).spaceName);
        tryPushName((value as any).roomCode);
        tryPushName((value as any).salon);

        Object.entries(value).forEach(([key, nested]) => {
          scan(nested, key);
        });
      };

      scan(event);

      if (keys.size === 0 && roomNames.size > 0) {
        roomNames.forEach((roomName) => {
          const laneKey = `name:${roomName}`;
          if (!laneByKey.has(laneKey)) {
            laneByKey.set(laneKey, {
              key: laneKey,
              label: roomName,
              sortOrder: Number.MAX_SAFE_INTEGER - 2,
            });
          }
          keys.add(laneKey);
        });
      }

      if (keys.size === 0) {
        const fallbackKey = "unassigned";
        if (!laneByKey.has(fallbackKey)) {
          laneByKey.set(fallbackKey, {
            key: fallbackKey,
            label: "Sin salón asignado",
            sortOrder: Number.MAX_SAFE_INTEGER,
          });
        }
        keys.add(fallbackKey);
      }

      return Array.from(keys);
    };

    const lanesUsed = new Set<string>();

    filteredEvents.forEach((event) => {
      const eventStart = startOfDay(
        parseDateLocal(event.startDate) || new Date(event.startDate)
      );
      const eventEnd = startOfDay(
        parseDateLocal(event.endDate) || new Date(event.endDate)
      );

      if (isAfter(eventStart, monthEndDay) || isBefore(eventEnd, monthStartDay)) {
        return;
      }

      const eventLaneKeys = extractLaneKeys(event);
      eventLaneKeys.forEach((laneKey) => lanesUsed.add(laneKey));
    });

    const lanes = Array.from(laneByKey.values())
      .filter((lane) => lanesUsed.has(lane.key))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.label.localeCompare(b.label, "es");
      });

    return { lanes, extractLaneKeys };
  }, [filteredEvents, rooms, monthStartDay, monthEndDay]);

  const dayRoomRows = useMemo<DayRoomRow[]>(() => {
    const usedLaneKeys = new Set<string>();
    const rawSegmentsByLane = new Map<string, DayRoomSegment[]>();

    dayEvents.forEach((event) => {
      const laneKeys = roomLanes.extractLaneKeys(event);
      const eventSegments = dayEventSegmentsByEventId[event.idEvent] || [];
      const statusText = getEventStatusText(event) || "No especificado";

      laneKeys.forEach((laneKey) => {
        usedLaneKeys.add(laneKey);
        if (!rawSegmentsByLane.has(laneKey)) {
          rawSegmentsByLane.set(laneKey, []);
        }

        eventSegments.forEach((segment) => {
          rawSegmentsByLane.get(laneKey)!.push({
            ...segment,
            event,
            statusText,
            track: 0,
          });
        });
      });
    });

    const lanes = roomLanes.lanes.filter((lane) => usedLaneKeys.has(lane.key));

    return lanes.map((lane) => {
      const segments = rawSegmentsByLane.get(lane.key) || [];
      const sorted = [...segments].sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) {
          return a.startMinutes - b.startMinutes;
        }
        return a.endMinutes - b.endMinutes;
      });

      const trackEndByIndex: number[] = [];
      const packed = sorted.map((segment) => {
        let track = 0;
        while (
          track < trackEndByIndex.length &&
          trackEndByIndex[track] > segment.startMinutes
        ) {
          track += 1;
        }
        trackEndByIndex[track] = segment.endMinutes;

        return {
          ...segment,
          track,
        };
      });

      return {
        lane,
        segments: packed,
      };
    });
  }, [dayEvents, dayEventSegmentsByEventId, roomLanes]);

  const laneSegmentsByKey = useMemo(() => {
    const map = new Map<string, LaneSegment[]>();

    roomLanes.lanes.forEach((lane) => {
      map.set(lane.key, []);
    });

    filteredEvents.forEach((event) => {
      const eventStart = startOfDay(parseDateLocal(event.startDate) || new Date());
      const eventEnd = startOfDay(parseDateLocal(event.endDate) || new Date());

      if (isAfter(eventStart, monthEndDay) || isBefore(eventEnd, monthStartDay)) {
        return;
      }

      const visibleStart = isBefore(eventStart, monthStartDay)
        ? monthStartDay
        : eventStart;
      const visibleEnd = isAfter(eventEnd, monthEndDay) ? monthEndDay : eventEnd;

      const startIndex = Math.max(0, differenceInDays(visibleStart, monthStartDay));
      const endIndex = Math.min(
        days.length - 1,
        differenceInDays(visibleEnd, monthStartDay)
      );

      const laneKeys = roomLanes.extractLaneKeys(event);

      laneKeys.forEach((laneKey) => {
        if (!map.has(laneKey)) {
          map.set(laneKey, []);
        }
        map.get(laneKey)!.push({ event, startIndex, endIndex, track: 0 });
      });
    });

    map.forEach((segments, laneKey) => {
      const sorted = [...segments].sort((a, b) => {
        if (a.startIndex !== b.startIndex) {
          return a.startIndex - b.startIndex;
        }
        return a.endIndex - b.endIndex;
      });

      const trackEndByIndex: number[] = [];
      const packed: LaneSegment[] = sorted.map((segment) => {
        let track = 0;
        while (
          track < trackEndByIndex.length &&
          trackEndByIndex[track] >= segment.startIndex
        ) {
          track += 1;
        }
        trackEndByIndex[track] = segment.endIndex;

        return {
          ...segment,
          track,
        };
      });

      map.set(laneKey, packed);
    });

    return map;
  }, [days.length, filteredEvents, roomLanes, monthStartDay, monthEndDay]);

  useEffect(() => {
    if (!selectedRoomLaneKey) return;

    const exists = roomLanes.lanes.some((lane) => lane.key === selectedRoomLaneKey);
    if (!exists) {
      setSelectedRoomLaneKey("");
    }
  }, [roomLanes.lanes, selectedRoomLaneKey]);

  const visibleRoomLanes = useMemo(() => {
    if (!selectedRoomLaneKey) {
      return roomLanes.lanes;
    }

    return roomLanes.lanes.filter((lane) => lane.key === selectedRoomLaneKey);
  }, [roomLanes.lanes, selectedRoomLaneKey]);

  const getEventsSpanningDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = startOfDay(
        parseDateLocal(event.startDate) || new Date()
      );
      const eventEnd = startOfDay(parseDateLocal(event.endDate) || new Date());
      const currentDay = startOfDay(date);

      return isWithinInterval(currentDay, { start: eventStart, end: eventEnd });
    });
  };

  const calculateEventPosition = (event: Event, date: Date) => {
    const eventStart = startOfDay(
      parseDateLocal(event.startDate) || new Date()
    );
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
    const calendarCache: CalendarReturnCache = {
      savedAt: Date.now(),
      currentDate: format(currentDate, "yyyy-MM-dd"),
      selectedDayValue,
      selectedDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
      calendarView,
      statusFilters,
      segmentFilters,
      selectedRoomLaneKey,
      events,
      rooms,
    };

    inMemoryCalendarReturnCache = calendarCache;

    try {
      sessionStorage.setItem(
        CALENDAR_RETURN_CACHE_KEY,
        JSON.stringify(calendarCache)
      );
    } catch {
      // Ignorar límites de storage y confiar en cache en memoria para el retorno inmediato
    }

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
    route(`/eventos/${(event as any)?.eventNumber ?? event.idEvent}`);
  };

  const selectedDateEvents: Event[] = selectedDate
    ? getEventsSpanningDate(selectedDate)
    : [];

  const showEventTooltip = (
    event: Event,
    timeLabel: string | undefined,
    target: HTMLElement,
    placement: "top" | "bottom" = "top"
  ) => {
    const rect = target.getBoundingClientRect();
    const horizontalPadding = 20;
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      horizontalPadding,
      Math.min(window.innerWidth - horizontalPadding, centerX)
    );

    setHoverTooltip({
      event,
      timeLabel,
      left: clampedLeft,
      top: placement === "bottom" ? rect.bottom + 8 : rect.top - 8,
      placement,
    });
  };

  const hideEventTooltip = () => setHoverTooltip(null);

  const renderEventTooltipContent = (event: Event, timeLabel?: string) => {
    const statusText = getEventStatusText(event) || "No especificado";
    const rangeLabel = `${format(
      parseDateLocal(event.startDate) || new Date(),
      "d MMM yyyy",
      { locale: es }
    )} - ${format(parseDateLocal(event.endDate) || new Date(), "d MMM yyyy", {
      locale: es,
    })}`;

    return (
      <>
        <p className="text-xs font-semibold text-foreground whitespace-normal break-words">
          {event.title}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground whitespace-normal break-words">
          Horario: {timeLabel || "Sin horario definido"}
        </p>
        <p className="text-[11px] text-muted-foreground whitespace-normal break-words">
          Estado: {statusText}
        </p>
        <p className="text-[11px] text-muted-foreground whitespace-normal break-words">
          Fechas: {rangeLabel}
        </p>
      </>
    );
  };

  const formatMinutesToTime = (minutes: number) => {
    const safeMinutes = Math.max(0, Math.min(minutes, MINUTES_IN_DAY - 1));
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const getEventTooltipTimeLabel = (event: Event) => {
    const ranges: Array<{ start: number; end: number }> = [];

    const pushRange = (startRaw: unknown, endRaw: unknown) => {
      const start = parseTimeToMinutes(
        typeof startRaw === "string" ? startRaw : String(startRaw ?? "")
      );
      const end = parseTimeToMinutes(
        typeof endRaw === "string" ? endRaw : String(endRaw ?? "")
      );

      if (start == null && end == null) return;

      const normalizedStart = Math.max(
        0,
        Math.min(start ?? end ?? 0, MINUTES_IN_DAY - 1)
      );
      const normalizedEnd = Math.max(
        normalizedStart + 15,
        Math.min(end ?? start ?? MINUTES_IN_DAY, MINUTES_IN_DAY)
      );

      ranges.push({
        start: normalizedStart,
        end: normalizedEnd,
      });
    };

    const activities = (event as any)?.activities;
    if (Array.isArray(activities)) {
      activities.forEach((activity: any) => {
        pushRange(
          activity?.startTime ?? activity?.eventActivityStartDate,
          activity?.endTime ?? activity?.eventActivityEndDate
        );

        const nestedContainers = [
          activity?.schedule,
          activity?.schedules,
          activity?.activitySchedule,
          activity?.roomReservation,
        ].flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));

        nestedContainers.forEach((container) => {
          if (!container || typeof container !== "object") return;

          pushRange(
            (container as any)?.startTime ??
              (container as any)?.eventActivityStartDate ??
              (container as any)?.roomReservationFromDate,
            (container as any)?.endTime ??
              (container as any)?.eventActivityEndDate ??
              (container as any)?.roomReservationToDate
          );
        });
      });
    }

    if (ranges.length === 0) {
      pushRange(event.startDate, event.endDate);
    }

    if (ranges.length === 0) return undefined;

    const minStart = Math.min(...ranges.map((range) => range.start));
    const maxEnd = Math.max(...ranges.map((range) => range.end));

    return `${formatMinutesToTime(minStart)} - ${formatMinutesToTime(maxEnd)}`;
  };

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

            {/* Selector de mes: usa DatePicker consistente con módulo Eventos */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-[220px]">
                <DatePicker
                  value={format(currentDate, "yyyy-MM-dd")}
                  onChange={(dateStr: string) => {
                    const d = new Date(dateStr + "T00:00:00");
                    if (Number.isNaN(d.getTime())) return;
                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                />
              </div>

              <div className="inline-flex items-center rounded-md border p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={calendarView === "month" ? "default" : "ghost"}
                  className="h-8"
                  onClick={() => setCalendarView("month")}
                >
                  Mes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={calendarView === "rooms" ? "default" : "ghost"}
                  className="h-8"
                  onClick={() => setCalendarView("rooms")}
                >
                  Salones
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={calendarView === "day" ? "default" : "ghost"}
                  className="h-8"
                  onClick={() => setCalendarView("day")}
                >
                  Día
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs">
              <span className="mb-2 block font-medium text-foreground">
                Segmento de Mercado
              </span>
              {segmentsLoading && availableSegments.length === 0 ? (
                <div className="flex items-center gap-2 py-1">
                  <Spinner size="sm" />
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

            {calendarView === "rooms" && (
              <div className="mt-4 max-w-sm border-t pt-4">
                <span className="mb-2 block text-xs font-medium text-foreground">
                  Filtrar por salón
                </span>
                <Select
                  value={selectedRoomLaneKey}
                  onChange={(e) =>
                    setSelectedRoomLaneKey((e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="">Todos los salones</option>
                  {roomLanes.lanes.map((lane) => (
                    <option key={lane.key} value={lane.key}>
                      {lane.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {calendarView === "day" && (
              <div className="mt-4 max-w-sm border-t pt-4">
                <span className="mb-2 block text-xs font-medium text-foreground">
                  Seleccionar día
                </span>
                <DatePicker
                  value={selectedDayValue}
                  onChange={(dateStr: string) => {
                    const parsed = parseDateLocal(dateStr) || new Date(dateStr);
                    if (Number.isNaN(parsed.getTime())) return;
                    setSelectedDayValue(format(parsed, "yyyy-MM-dd"));
                  }}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Spinner size="md" />
              </div>
            ) : calendarView === "rooms" ? (
              visibleRoomLanes.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No hay eventos para el salón seleccionado en este mes.
                </div>
              ) : (
                <div className="overflow-auto rounded-md border">
                  <div
                    className="min-w-max"
                    style={{
                      width:
                        GANTT_ROOM_COL_WIDTH + days.length * GANTT_DAY_WIDTH,
                    }}
                  >
                    <div
                      className="sticky top-0 z-30 border-b bg-background"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `${GANTT_ROOM_COL_WIDTH}px repeat(${days.length}, ${GANTT_DAY_WIDTH}px)`,
                      }}
                    >
                      <div className="sticky left-0 z-40 border-r bg-background px-3 py-2 text-sm font-medium">
                        Salón
                      </div>
                      {days.map((day) => (
                        <div
                          key={`header-${day.toISOString()}`}
                          className="border-r px-1 py-2 text-center"
                        >
                          <div className="text-sm font-medium">
                            {format(day, "d")}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {format(day, "EEE", { locale: es })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {visibleRoomLanes.map((lane, laneIndex) => {
                      const segments = laneSegmentsByKey.get(lane.key) || [];
                      const totalTracks =
                        segments.length > 0
                          ? Math.max(...segments.map((segment) => segment.track)) +
                            1
                          : 1;
                      const laneHeight = Math.max(52, totalTracks * 24 + 8);

                      return (
                        <div
                          key={lane.key}
                          className="border-b"
                          style={{
                            display: "grid",
                            gridTemplateColumns: `${GANTT_ROOM_COL_WIDTH}px 1fr`,
                          }}
                        >
                          <div className="sticky left-0 z-20 border-r bg-background px-3 py-2 text-sm font-medium">
                            {lane.label}
                          </div>

                          <div
                            className="relative"
                            style={{
                              height: laneHeight,
                              width: days.length * GANTT_DAY_WIDTH,
                            }}
                          >
                            {days.map((day) => (
                              <div
                                key={`${lane.key}-grid-${day.toISOString()}`}
                                className="absolute top-0 h-full border-r"
                                style={{
                                  left:
                                    differenceInDays(day, monthStartDay) *
                                    GANTT_DAY_WIDTH,
                                  width: GANTT_DAY_WIDTH,
                                }}
                              />
                            ))}

                            {segments.map((segment) => {
                              const colorClass = getEventStatusColor(
                                segment.event
                              );
                              const statusCategory = classifyEventStatus(
                                segment.event
                              );
                              const textColorClass =
                                statusCategory === "confirmado"
                                  ? "text-gray-900"
                                  : "text-white";
                              const left = segment.startIndex * GANTT_DAY_WIDTH + 2;
                              const width =
                                (segment.endIndex - segment.startIndex + 1) *
                                  GANTT_DAY_WIDTH -
                                4;

                              return (
                                <button
                                  key={`${lane.key}-${segment.event.idEvent}-${segment.startIndex}-${segment.track}`}
                                  type="button"
                                  className={`${colorClass} ${textColorClass} group absolute flex h-5 items-center rounded px-2 text-[10px] font-medium shadow-sm transition-transform hover:-translate-y-0.5`}
                                  style={{
                                    left,
                                    top: 4 + segment.track * 22,
                                    width,
                                  }}
                                  onClick={() => handleEventClick(segment.event)}
                                  onMouseEnter={(e) =>
                                    showEventTooltip(
                                      segment.event,
                                      getEventTooltipTimeLabel(segment.event),
                                      e.currentTarget as HTMLElement,
                                      laneIndex < 2 ? "bottom" : "top"
                                    )
                                  }
                                  onMouseLeave={hideEventTooltip}
                                >
                                  <span className="truncate">
                                    {segment.event.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : calendarView === "day" ? (
              dayRoomRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No hay eventos para el día actual.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Eventos del día seleccionado: {format(selectedDay, "d 'de' MMMM yyyy", { locale: es })}
                  </p>

                  {daySchedulesLoading && !hasAnyActivityScheduleForDay && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Spinner size="sm" />
                      Cargando horarios del día...
                    </div>
                  )}

                  <div className="overflow-auto rounded-md border">
                    <div
                      className="min-w-max"
                      style={{
                        width:
                          DAY_EVENT_COL_WIDTH + dayHours.length * DAY_HOUR_WIDTH,
                      }}
                    >
                      <div
                        className="sticky top-0 z-30 border-b bg-background"
                        style={{
                          display: "grid",
                          gridTemplateColumns: `${DAY_EVENT_COL_WIDTH}px repeat(${dayHours.length}, ${DAY_HOUR_WIDTH}px)`,
                        }}
                      >
                        <div className="sticky left-0 z-40 border-r bg-background px-3 py-2 text-sm font-medium">
                          Salón
                        </div>
                        {dayHours.map((hour) => (
                          <div
                            key={`hour-${hour}`}
                            className="border-r px-1 py-2 text-center text-[10px] font-medium"
                          >
                            {String(hour).padStart(2, "0")}:00
                          </div>
                        ))}
                      </div>

                      {dayRoomRows.map((row, rowIndex) => {
                        const totalTracks =
                          row.segments.length > 0
                            ? Math.max(
                                ...row.segments.map((segment) => segment.track)
                              ) + 1
                            : 1;
                        const laneHeight = Math.max(52, totalTracks * 24 + 8);

                        return (
                          <div
                            key={`day-row-${row.lane.key}`}
                            className="border-b"
                            style={{
                              display: "grid",
                              gridTemplateColumns: `${DAY_EVENT_COL_WIDTH}px 1fr`,
                            }}
                          >
                            <div className="sticky left-0 z-20 border-r bg-background px-3 py-2 text-sm">
                              <div className="font-medium truncate">{row.lane.label}</div>
                            </div>

                            <div
                              className="relative"
                              style={{
                                height: laneHeight,
                                width: dayHours.length * DAY_HOUR_WIDTH,
                              }}
                            >
                              {dayHours.map((hour) => (
                                <div
                                  key={`day-grid-${row.lane.key}-${hour}`}
                                  className="absolute top-0 h-full border-r"
                                  style={{
                                    left: hour * DAY_HOUR_WIDTH,
                                    width: DAY_HOUR_WIDTH,
                                  }}
                                />
                              ))}

                              {row.segments.map((segment, index) => {
                                const colorClass = getEventStatusColor(segment.event);
                                const statusCategory = classifyEventStatus(segment.event);
                                const textColorClass =
                                  statusCategory === "confirmado"
                                    ? "text-gray-900"
                                    : "text-white";
                                const left =
                                  (segment.startMinutes / 60) * DAY_HOUR_WIDTH + 2;
                                const width = Math.max(
                                  20,
                                  ((segment.endMinutes - segment.startMinutes) / 60) *
                                    DAY_HOUR_WIDTH -
                                    4
                                );

                                return (
                                  <button
                                    key={`day-segment-${row.lane.key}-${segment.event.idEvent}-${index}`}
                                    type="button"
                                    className={`${colorClass} ${textColorClass} group absolute flex h-5 items-center rounded px-2 text-[10px] font-medium shadow-sm transition-transform hover:-translate-y-0.5`}
                                    style={{
                                      left,
                                      top: 4 + segment.track * 22,
                                      width,
                                    }}
                                    onClick={() => handleEventClick(segment.event)}
                                    onMouseEnter={(e) =>
                                      showEventTooltip(
                                        segment.event,
                                        segment.label,
                                        e.currentTarget as HTMLElement,
                                        rowIndex < 2 ? "bottom" : "top"
                                      )
                                    }
                                    onMouseLeave={hideEventTooltip}
                                  >
                                    <span className="truncate">
                                      {segment.label} · {segment.event.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )
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
                <div className="grid grid-cols-7 gap-2 overflow-visible">
                  {/* Empty cells for padding */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days */}
                  {days.map((day, dayIndex) => {
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
                                          (event as any)?.eventNumber ??
                                          event.idEvent
                                        }-${day.toISOString()}`}
                                        className={`${colorClass} ${textColorClass} group text-[10px] px-1 py-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-transform duration-200 transform will-change-transform flex items-center gap-1 ${radiusClasses}`}
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
                                        onMouseEnter={(e) => {
                                          const el =
                                            e.currentTarget as HTMLElement;
                                          showEventTooltip(
                                            event,
                                            getEventTooltipTimeLabel(event),
                                            el,
                                            Math.floor((monthStart.getDay() + dayIndex) / 7) ===
                                              0
                                              ? "bottom"
                                              : "top"
                                          );
                                          el.style.transform =
                                            "translateY(-6px) scale(1.03)";
                                          el.style.boxShadow =
                                            "0 10px 25px rgba(0,0,0,0.25)";
                                          el.style.zIndex = "60";
                                        }}
                                        onMouseLeave={(e) => {
                                          const el =
                                            e.currentTarget as HTMLElement;
                                          hideEventTooltip();
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
                                        {/* no countdown in month grid */}
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

        {hoverTooltip && (
          <div
            className="pointer-events-none fixed z-[9999] w-72 max-w-[calc(100vw-2rem)] rounded-md border bg-popover/95 p-2 shadow-2xl"
            style={{
              left: hoverTooltip.left,
              top: hoverTooltip.top,
              transform:
                hoverTooltip.placement === "bottom"
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -100%)",
            }}
          >
            {renderEventTooltipContent(
              hoverTooltip.event,
              hoverTooltip.timeLabel
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
