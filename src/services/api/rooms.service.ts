import type { Room, RoomAvailability, RoomRate, Schedule } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type GetEvents = (
  startDate?: string,
  endDate?: string,
  eventNumber?: string,
  eventName?: string
) => Promise<any[]>;

type GetSchedules = (
  startDate?: string,
  endDate?: string,
  eventNumber?: number,
  idEventActivity?: number
) => Promise<Schedule[]>;

type CreateRoomsServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
  getEvents: GetEvents;
  getSchedules: GetSchedules;
};

export function createRoomsService({
  apiRequest,
  buildPayload,
  withFallback,
  getEvents,
  getSchedules,
}: CreateRoomsServiceDeps) {
  const getRooms = () =>
    withFallback(
      () =>
        apiRequest<
          | { success: boolean; result?: { rooms?: Room[] } }
          | { rooms?: Room[] }
          | Room[]
        >("/events/getrooms", {
          method: "GET",
        }),
      () =>
        apiRequest<{
          success: boolean;
          errorCode: number;
          result: { rooms: Room[] };
        }>("/GetRooms", {
          method: "POST",
          body: buildPayload(),
        })
    ).then(async (payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.rooms)) return (payload as any).rooms;
      if (Array.isArray((payload as any)?.result?.rooms))
        return (payload as any).result.rooms;
      return [];
    });

  const getRoomRates = () => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = buildPayload({
      roomRates: {
        idEventActivity: 0,
        priceDate: today,
      },
    });

    const parseRates = (result: any): RoomRate[] => {
      if (Array.isArray(result)) return result;
      if (Array.isArray((result as any)?.roomRates)) {
        return (result as any).roomRates;
      }
      if (Array.isArray((result as any)?.result?.roomRates)) {
        return (result as any).result.roomRates;
      }
      return [] as RoomRate[];
    };

    return withFallback(
      async () => {
        const primary = await apiRequest<
          RoomRate[]
          | { roomRates?: RoomRate[] }
          | { result?: { roomRates?: RoomRate[] } }
        >("/events/getroomrates", {
          method: "POST",
          body: payload,
        });

        const primaryRates = parseRates(primary);
        if (primaryRates.length > 0) return primaryRates;

        try {
          const legacy = await apiRequest<
            RoomRate[]
            | { roomRates?: RoomRate[] }
            | { result?: { roomRates?: RoomRate[] } }
          >("/GetRoomRates", {
            method: "POST",
            body: payload,
          });

          const legacyRates = parseRates(legacy);
          return legacyRates.length > 0 ? legacyRates : primaryRates;
        } catch {
          return primaryRates;
        }
      },
      () =>
        apiRequest<
          RoomRate[]
          | { roomRates?: RoomRate[] }
          | { result?: { roomRates?: RoomRate[] } }
        >("/GetRoomRates", {
          method: "POST",
          body: payload,
        })
    ).then((result) => parseRates(result));
  };

  const getRoomsAvailability = (startDate: string, endDate: string) =>
    apiRequest<RoomAvailability[]>("/events/getroomsavailability", {
      method: "POST",
      body: buildPayload({
        roomsAvailability: {
          fromDate: startDate,
          toDate: endDate,
          eventStatusList: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includesPreparationTime: true,
          includesCleaningTime: true,
          roomList: [],
          roomPaxCapacity: 0,
          roomTypeList: [],
          locationList: [],
          availabilityType: 0,
        },
      }),
    });

  const getAvailableRooms = async (startDate: string, endDate: string) => {
    // Intentaremos usar la API de disponibilidad; si falla o no entrega datos útiles,
    // caemos a un fallback que infiere ocupación desde los eventos en el rango.
    const allRooms = await getRooms();

    try {
      const availability = await getRoomsAvailability(startDate, endDate);

      // Si la API devolvió algo razonable, procesarlo
      if (Array.isArray(availability) && availability.length > 0) {
        // Generar la lista de fechas en el rango (yyyy-MM-dd)
        const dates: string[] = [];
        let d = new Date(startDate + "T00:00:00");
        const dEnd = new Date(endDate + "T00:00:00");
        while (d <= dEnd) {
          dates.push(d.toISOString().split("T")[0]);
          d.setDate(d.getDate() + 1);
        }

        console.log("RoomsAvailability entries:", availability.length);
        if (availability.length > 0)
          console.log("Sample availability:", availability.slice(0, 3));

        const availMap = new Map<number, Set<string>>();
        availability.forEach((entry: any) => {
          // Diferentes formas en que puede venir el id de sala
          const rid = Number(
            entry.roomId ??
              entry.room?.idRoom ??
              entry.room?.id ??
              entry.idRoom ??
              entry.id
          );
          if (Number.isNaN(rid)) return;
          const rawDate =
            entry.date ??
            entry.availabilityDate ??
            entry.day ??
            entry.fecha ??
            entry.Date;
          if (!rawDate) return;
          const parsed = new Date(rawDate + "");
          if (isNaN(parsed.getTime())) return;
          const date = parsed.toISOString().split("T")[0];
          const availableFlag =
            entry.available === true ||
            entry.available === "true" ||
            entry.available === 1 ||
            entry.available === "1";
          if (!availableFlag) return;
          if (!availMap.has(rid)) availMap.set(rid, new Set<string>());
          availMap.get(rid)!.add(date);
        });

        const availableRooms = allRooms.filter((room: Room) => {
          if (!room.roomActive) return false;
          const rid = Number(room.idRoom);
          const set = availMap.get(rid);
          if (!set) return false;
          for (const date of dates) {
            if (!set.has(date)) return false;
          }
          return true;
        });

        return availableRooms;
      }

      // Si la API devolvió array vacío, continuar a fallback
      console.warn(
        "GetRoomsAvailability devolvió arreglo vacío, usando fallback por eventos"
      );
    } catch (err) {
      console.warn("GetRoomsAvailability falló, usando fallback por eventos:", err);
    }

    // --- Fallback: inferir ocupación desde eventos/schedules en el rango ---
    try {
      const [events, schedulesPayload] = await Promise.all([
        getEvents(startDate, endDate),
        getSchedules(startDate, endDate).catch((scheduleError) => {
          console.warn(
            "No se pudo obtener schedules, se continúa solo con eventos:",
            scheduleError
          );
          return [] as Schedule[];
        }),
      ]);

      const normalizeForCompare = (s: string) =>
        s && typeof s === "string" && (s as any).normalize
          ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
          : s;

      const blockingStatuses = new Set<string>([
        "confirmado",
        "por confirmar",
        "reunion interna",
        "evento interno",
      ]);

      // Helpers para normalizar fechas y gestionar intervalos
      const extractDateToken = (value: any): string | null => {
        if (value == null) return null;
        const str = String(value).trim();
        if (!str) return null;
        const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        return null;
      };

      const startRange = startDate;
      const endRange = endDate;

      const rangeOverlaps = (startA: string | null, endA: string | null) => {
        if (!startA || !endA) return true; // si no tenemos fechas precisas, asumir overlap por seguridad
        const aStart = startA < endRange ? startA : endRange;
        const aEnd = endA > startRange ? endA : startRange;
        if (aEnd < startRange) return false;
        if (aStart > endRange) return false;
        return !(aEnd < startRange || aStart > endRange);
      };

      const validRoomIds = new Set<number>(
        allRooms.map((r: Room) => Number(r.idRoom))
      );
      const roomNameMap = new Map<string, number[]>();
      allRooms.forEach((room: Room) => {
        const key = String(room.roomName || "")
          .trim()
          .toLowerCase();
        if (!roomNameMap.has(key)) roomNameMap.set(key, []);
        roomNameMap.get(key)!.push(Number(room.idRoom));
      });

      const resolveRoomIds = (rawIds: Set<number>, rawNames: Set<string>) => {
        const resolved = new Set<number>();
        const unmatchedIds: number[] = [];
        rawIds.forEach((id) => {
          if (validRoomIds.has(id)) {
            resolved.add(id);
          } else {
            unmatchedIds.push(id);
          }
        });

        const unmatchedNames: string[] = [];
        rawNames.forEach((name) => {
          if (!name) return;
          const normalized = name.trim().toLowerCase();
          if (!normalized) return;
          const exact = roomNameMap.get(normalized);
          if (exact && exact.length > 0) {
            exact.forEach((id) => resolved.add(id));
            return;
          }
          let matched = false;
          for (const [key, ids] of roomNameMap.entries()) {
            if (key.includes(normalized) || normalized.includes(key)) {
              ids.forEach((id) => resolved.add(id));
              matched = true;
            }
          }
          if (!matched) unmatchedNames.push(normalized);
        });

        return { resolved, unmatchedIds, unmatchedNames };
      };

      const extractRoomRefs = (
        source: any,
        outIds: Set<number>,
        outNames: Set<string>,
        depth = 0
      ) => {
        if (source == null || depth > 6) return;
        if (typeof source === "number") {
          outIds.add(source);
          return;
        }
        if (typeof source === "string") {
          const trimmed = source.trim();
          if (trimmed) outNames.add(trimmed.toLowerCase());
          return;
        }
        if (Array.isArray(source)) {
          source.forEach((item) =>
            extractRoomRefs(item, outIds, outNames, depth + 1)
          );
          return;
        }
        if (typeof source === "object") {
          const maybeId =
            source.idRoom ??
            source.roomId ??
            source.id ??
            source.room?.idRoom ??
            source.room?.id ??
            source.idSalon ??
            source.salonId;
          if (maybeId !== undefined && maybeId !== null) {
            const parsed = Number(maybeId);
            if (!Number.isNaN(parsed)) outIds.add(parsed);
          }

          const maybeName =
            source.roomName ??
            source.name ??
            source.room?.roomName ??
            source.room?.name ??
            source.salonName ??
            source.salon ??
            source.descripcionSalon;
          if (maybeName) {
            const nm = String(maybeName).trim().toLowerCase();
            if (nm) outNames.add(nm);
          }

          for (const key of Object.keys(source)) {
            try {
              const val = source[key];
              if (
                key.toLowerCase().includes("room") ||
                key.toLowerCase().includes("salon") ||
                Array.isArray(val) ||
                typeof val === "object"
              ) {
                extractRoomRefs(val, outIds, outNames, depth + 1);
              }
            } catch {
              // ignore
            }
          }
        }
      };

      const schedulesList = (() => {
        if (Array.isArray(schedulesPayload)) return schedulesPayload as any[];
        if (Array.isArray((schedulesPayload as any)?.schedules))
          return (schedulesPayload as any).schedules;
        if (Array.isArray((schedulesPayload as any)?.result?.schedules))
          return (schedulesPayload as any).result.schedules;
        return [] as any[];
      })();

      const schedulesByEvent = new Map<number, any[]>();
      schedulesList.forEach((scheduleEntry: any) => {
        const eventIdCandidate = Number(
          scheduleEntry.eventId ??
            scheduleEntry.idEvent ??
            scheduleEntry.idEvento ??
            scheduleEntry.id ??
            scheduleEntry.event?.idEvent
        );
        if (Number.isNaN(eventIdCandidate)) return;
        if (!schedulesByEvent.has(eventIdCandidate)) {
          schedulesByEvent.set(eventIdCandidate, []);
        }
        schedulesByEvent.get(eventIdCandidate)!.push(scheduleEntry);
      });

      const occupiedRooms = new Set<number>();

      events.forEach((ev: any, idx: number) => {
        const eventId = Number(ev.idEvent ?? ev.eventId ?? ev.id);
        if (Number.isNaN(eventId)) {
          console.debug(`Evento[${idx}] sin idEvent válido`, ev);
          return;
        }

        const statusCandidates: string[] = [];
        try {
          if (ev.eventStatus) {
            statusCandidates.push(
              String(
                ev.eventStatus.name ??
                  ev.eventStatus.eventStatusName ??
                  ev.eventStatus.statusName ??
                  ev.eventStatus.eventStatus ??
                  ""
              )
            );
          }
        } catch {}
        try {
          if (ev.status) statusCandidates.push(String(ev.status));
        } catch {}
        try {
          if (ev.statusName) statusCandidates.push(String(ev.statusName));
        } catch {}
        try {
          if (ev.eventStatusName)
            statusCandidates.push(String(ev.eventStatusName));
        } catch {}

        const statusRaw =
          statusCandidates
            .map((s) => s.trim())
            .find((s) => s && s.length > 0) || "";
        const statusNormalized = normalizeForCompare(
          statusRaw.toLowerCase()
        ).toLowerCase();

        if (!blockingStatuses.has(statusNormalized)) {
          console.debug(
            `Evento[${idx}] #${eventId} con estatus '${statusRaw}' (norm: '${statusNormalized}') no bloquea salas`
          );
          return;
        }

        const eventStartStr = extractDateToken(
          ev.startDate ?? ev.eventStartDate ?? ev.start ?? ev.fechaInicio
        );
        const eventEndStr =
          extractDateToken(
            ev.endDate ?? ev.eventEndDate ?? ev.end ?? ev.fechaFin
          ) || eventStartStr;

        if (!rangeOverlaps(eventStartStr, eventEndStr)) {
          console.debug(
            `Evento[${idx}] #${eventId} con estatus bloqueante no se solapa con el rango solicitado`
          );
          return;
        }

        const collectedIds = new Set<number>();
        const collectedNames = new Set<string>();

        extractRoomRefs(
          ev.eventRooms ?? ev.rooms ?? ev.Rooms ?? ev.eventRoomsList,
          collectedIds,
          collectedNames
        );
        extractRoomRefs(ev, collectedIds, collectedNames);

        const relatedSchedules = schedulesByEvent.get(eventId) ?? [];
        relatedSchedules.forEach((scheduleEntry) => {
          extractRoomRefs(scheduleEntry, collectedIds, collectedNames);
        });

        const { resolved, unmatchedIds, unmatchedNames } = resolveRoomIds(
          collectedIds,
          collectedNames
        );

        if (resolved.size === 0) {
          console.debug(
            `Evento[${idx}] #${eventId} (${statusRaw}) sin salones detectables. ids detectados: ${Array.from(
              collectedIds
            )}, nombres detectados: ${Array.from(
              collectedNames
            )}, ids descartados: ${unmatchedIds}, nombres no encontrados: ${unmatchedNames}`
          );
          console.debug(`Evento[${idx}] sample:`, ev);
          return;
        }

        resolved.forEach((roomId) => occupiedRooms.add(roomId));
        console.debug(
          `Evento[${idx}] #${eventId} (${statusRaw}) -> salones ocupados:`,
          Array.from(resolved)
        );
      });

      console.log(
        `Inferencia por eventos: ${events.length} eventos, ${occupiedRooms.size} salones ocupados detectados`
      );

      const availableRooms = allRooms.filter((room: Room) => {
        if (!room.roomActive) return false;
        const roomId = Number(room.idRoom);
        return !occupiedRooms.has(roomId);
      });

      return availableRooms;
    } catch (err) {
      console.error("Fallback por eventos falló:", err);
      return [] as Room[];
    }
  };

  return {
    getRooms,
    getRoomRates,
    getRoomsAvailability,
    getAvailableRooms,
  };
}
