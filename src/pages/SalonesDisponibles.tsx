import { useState } from "preact/hooks";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { DatePicker } from "../components/ui/datepicker";
import { apiService } from "../services/api.service";
import { classifyEventStatus } from "../lib/eventStatus";
import type { Room } from "../services/api.service";
import {
  Building,
  Users,
  Eye,
  Check,
  X,
  Calendar,
  Search,
} from "lucide-preact";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";

// Implementación limpia que sigue la especificación del usuario:
// - obtener rooms y events(start,end)
// - filtrar eventos que solapan el rango (inclusive)
// - quedarnos sólo con eventos con estatus bloqueante: Confirmado, Por Confirmar, Reunión Interna
// - extraer ids de salones ocupados (varias formas posibles) y restarlos del catálogo
export function SalonesDisponibles() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addLog = (msg: string) => {
    try {
      setDebugMessages((prev) => [...prev, msg]);
    } catch (e) {
      // ignore state errors
    }
    try {
      console.log(msg);
    } catch (e) {
      // ignore
    }
  };

  const normalize = (s?: string) =>
    !s
      ? ""
      : String(s)
          .trim()
          .normalize("NFD")
          .replace(/[\u0000-\u036f]/g, "")
          .toLowerCase();

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      alert("Por favor selecciona un rango de fechas válido");
      return;
    }
    if (startDate > endDate) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      const queryStart = format(subDays(startDate, 30), "yyyy-MM-dd");
      const queryEnd = format(addDays(endDate, 30), "yyyy-MM-dd");
      addLog(
        `SalonesDisponibles: rango consulta extendido ${queryStart} -> ${queryEnd} (rango solicitado ${start} -> ${end})`
      );

      const [rooms, events, schedules] = await Promise.all([
        apiService.getRooms(),
        apiService.getEvents(queryStart, queryEnd),
        apiService.getSchedules(queryStart, queryEnd).catch(() => []),
      ] as any);

      // Intentar usar la API de disponibilidad autoritativa primero
      try {
        const availability = await apiService
          .getRoomsAvailability(start, end)
          .catch(() => []);
        if (Array.isArray(availability) && availability.length > 0) {
          addLog(
            `SalonesDisponibles: getRoomsAvailability entries=${availability.length}`
          );
          // generar lista de fechas en el rango
          const dates: string[] = [];
          let d = new Date(start + "T00:00:00");
          const dEnd = new Date(end + "T00:00:00");
          while (d <= dEnd) {
            dates.push(d.toISOString().split("T")[0]);
            d.setDate(d.getDate() + 1);
          }

          const availMap = new Map<number, Set<string>>();
          availability.forEach((entry: any) => {
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
            const parsed = new Date(String(rawDate));
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

          const availableRoomsFromApi = rooms.filter((r: Room) => {
            if (!r.roomActive) return false;
            const rid = Number(r.idRoom);
            const set = availMap.get(rid);
            if (!set) return false;
            for (const date of dates) {
              if (!set.has(date)) return false;
            }
            return true;
          });

          setAvailableRooms(availableRoomsFromApi);
          setLoading(false);
          return;
        }
      } catch (e) {
        addLog(
          "SalonesDisponibles: getRoomsAvailability falló, continuando con fallback por eventos"
        );
      }

      // Map para búsqueda por nombre
      const nameToIds = new Map<string, number[]>();
      rooms.forEach((r: Room) => {
        const key = normalize(r.roomName || r.roomCode || "");
        if (!key) return;
        if (!nameToIds.has(key)) nameToIds.set(key, []);
        nameToIds.get(key)!.push(Number(r.idRoom));
      });

      const blockingCats = new Set([
        "confirmado",
        "porConfirmar",
        "reunionInterna",
      ]);

      const toDate = (v: any): Date | null => {
        if (v == null) return null;
        const s = String(v);
        if (s.includes("T")) {
          const d = new Date(s);
          return isNaN(d.getTime()) ? null : d;
        }
        const m = s.match(/(\d{4}-\d{2}-\d{2})/);
        if (m) {
          const d = new Date(m[1] + "T00:00:00");
          return isNaN(d.getTime()) ? null : d;
        }
        const df = new Date(s);
        return isNaN(df.getTime()) ? null : df;
      };

      const overlaps = (
        aS: Date | null,
        aE: Date | null,
        bS: Date | null,
        bE: Date | null
      ) => {
        if (!aS || !aE || !bS || !bE) return true;
        return aS.getTime() <= bE.getTime() && bS.getTime() <= aE.getTime();
      };

      // heurística robusta para extraer ids de salones desde la estructura del evento
      const extractRoomIds = (ev: any): number[] => {
        const out = new Set<number>();
        const tryPushId = (value: any) => {
          const n = Number(value);
          if (!Number.isNaN(n) && n > 0) out.add(n);
        };

        const tryResolveName = (raw: any) => {
          if (!raw) return;
          const str = String(raw);
          const candidates = [str, ...str.split(/[;,/|]+/g)];
          candidates.forEach((token) => {
            const key = normalize(token);
            if (!key) return;
            const resolved = nameToIds.get(key);
            resolved?.forEach((id) => out.add(id));
          });
        };

        const keySuggestsRoom = (key?: string) => {
          if (!key) return false;
          const nk = normalize(key);
          return (
            nk.includes("room") ||
            nk.includes("salon") ||
            nk.includes("salones") ||
            nk.includes("space") ||
            nk.includes("espacio")
          );
        };

        const keySuggestsId = (key?: string) => {
          if (!key) return false;
          const nk = normalize(key);
          return (
            nk.includes("idroom") ||
            nk.includes("roomid") ||
            nk.includes("idsalon") ||
            nk.includes("salonid") ||
            nk.endsWith("id")
          );
        };

        const visited = new WeakSet<object>();

        const scan = (value: any, keyHint?: string) => {
          if (value == null) return;

          if (Array.isArray(value)) {
            value.forEach((item) => scan(item, keyHint));
            return;
          }

          const keyIsRoom = keySuggestsRoom(keyHint);
          const keyIsId = keySuggestsId(keyHint);

          if (typeof value === "number") {
            if (keyIsRoom || keyIsId) tryPushId(value);
            return;
          }

          if (typeof value === "string") {
            if (keyIsId || keyIsRoom) {
              const match = value.match(/\d+/);
              if (match) tryPushId(match[0]);
            }
            tryResolveName(value);
            return;
          }

          if (typeof value !== "object") return;
          if (visited.has(value)) return;
          visited.add(value);

          // chequear campos comunes directa y recursivamente
          const directCandidates = [
            value.idRoom,
            value.roomId,
            value.eventRoomId,
            value.IdRoom,
            value.room?.idRoom,
            value.room?.roomId,
            value.room?.id,
            value.salonId,
            value.idSalon,
            value.IdSalon,
            value.spaceId,
            value.idSpace,
            value.space?.id,
            value.space?.idSpace,
          ];
          directCandidates.forEach((candidate) => tryPushId(candidate));

          tryResolveName(
            value.roomName ??
              value.room?.roomName ??
              value.room?.name ??
              value.name ??
              value.salon ??
              value.salonName ??
              value.spaceName ??
              value.space?.name
          );

          for (const [k, v] of Object.entries(value)) {
            const key = String(k);
            const nk = normalize(key);
            if (typeof v === "number") {
              if (keySuggestsRoom(key) || keySuggestsId(key)) tryPushId(v);
            } else if (typeof v === "string") {
              if (keySuggestsRoom(key) || keySuggestsId(key)) {
                const m = v.match(/\d+/);
                if (m) tryPushId(m[0]);
              }
              if (nk.includes("name") || keySuggestsRoom(key)) {
                tryResolveName(v);
              }
            } else {
              scan(v, key);
            }
          }
        };

        scan(ev);
        return Array.from(out);
      };

      const fetchDetailCache = new Map<string, any>();
      const fetchEventDetail = async (evIdKey: string): Promise<any | null> => {
        if (fetchDetailCache.has(evIdKey)) {
          return fetchDetailCache.get(evIdKey);
        }
        try {
          const detailed = await apiService.getEvents(
            undefined,
            undefined,
            evIdKey
          );
          if (Array.isArray(detailed) && detailed.length > 0) {
            const det = detailed[0];
            fetchDetailCache.set(evIdKey, det);
            try {
              const dump = JSON.stringify(det).slice(0, 2000);
              addLog(
                `SalonesDisponibles: detalle cargado evento ${evIdKey} (trunc): ${dump}`
              );
            } catch (e) {
              addLog(
                `SalonesDisponibles: detalle evento ${evIdKey} cargado (no serializable)`
              );
            }
            return det;
          }
        } catch (e) {
          addLog(
            `SalonesDisponibles: fallo al pedir detalle del evento ${evIdKey}: ${String(
              e
            )}`
          );
        }
        fetchDetailCache.set(evIdKey, null);
        return null;
      };

      const occupied = new Set<number>();
      const reqS = toDate(start);
      const reqE = toDate(end);
      addLog(
        `SalonesDisponibles: loaded rooms=${rooms.length} events=${events.length}`
      );

      for (let i = 0; i < events.length; i++) {
        const ev = events[i] as any;
        const cat = classifyEventStatus(ev);

        const evS = toDate(
          ev.startDate ??
            ev.eventStartDate ??
            ev.start ??
            ev.fechaInicio ??
            ev.fecha ??
            null
        );
        const evE =
          toDate(
            ev.endDate ??
              ev.eventEndDate ??
              ev.end ??
              ev.fechaFin ??
              ev.fechaFin ??
              null
          ) || evS;

        const isOverlap = overlaps(evS, evE, reqS, reqE);

        try {
          const evMsg = `SalonesDisponibles:event idx=${i} id=${
            ev.idEvent ?? ev.id ?? null
          } status=${cat} evStart=${
            evS ? evS.toISOString().split("T")[0] : null
          } evEnd=${
            evE ? evE.toISOString().split("T")[0] : null
          } isOverlap=${isOverlap}`;
          addLog(evMsg);
        } catch (e) {
          addLog(
            `SalonesDisponibles:event (debug error) ${i} ${
              ev && (ev.idEvent ?? ev.id ?? "?")
            }`
          );
        }

        // Extraer ids primero; si no hay salones referenciados no podemos marcar ocupación
        const evIdKey = ev.idEvent ?? ev.id ?? i;

        const idsSet = new Set<number>(extractRoomIds(ev));
        let det: any = null;

        if (isOverlap && cat !== "cancelado") {
          det = await fetchEventDetail(String(evIdKey));
          if (det) {
            const idsDet = extractRoomIds(det);
            const newIds = idsDet.filter((id) => !idsSet.has(id));
            newIds.forEach((id) => idsSet.add(id));
            if (idsDet.length > 0) {
              addLog(
                `SalonesDisponibles: extracted ids from detail for event ${evIdKey}: ${idsDet.join(
                  ","
                )}`
              );
              if (newIds.length > 0) {
                addLog(
                  `SalonesDisponibles: nuevos ids añadidos desde detalle para evento ${evIdKey}: ${newIds.join(
                    ","
                  )}`
                );
              }
            }
          }
        }

        const ids = Array.from(idsSet);
        addLog(
          `SalonesDisponibles: extracted ids for event ${evIdKey}: ${ids.join(
            ","
          )}`
        );

        if (!isOverlap) {
          addLog(
            `SalonesDisponibles: skipping event ${evIdKey} because no overlap`
          );
          continue;
        }

        // Si el evento no referencia salones, no lo contamos como ocupante
        if (!ids || ids.length === 0) {
          addLog(
            `SalonesDisponibles: event ${evIdKey} tiene 0 salones referenciados (intentar fetch detalle)`
          );
          if (!det && isOverlap && cat !== "cancelado") {
            det = await fetchEventDetail(String(evIdKey));
          }

          // si no se resolvieron ids con el detalle, aplicar fallback global SOLO si el evento muestra
          // indicadores claros de ser interno/bloqueante (evita marcar todo cuando no corresponde)
          const isTypeInHouse = Boolean(
            (ev.eventType && ev.eventType.eventTypeInHouse) ||
              (det && det.eventType && det.eventType.eventTypeInHouse)
          );
          const subtypeName = (
            det?.eventSubtype?.eventSubTypeName ??
            det?.eventSubtype?.eventSubTypeName ??
            ev?.eventSubtype?.eventSubTypeName ??
            ev?.eventSubtype?.eventSubTypeName ??
            ""
          )
            .toString()
            .toLowerCase();
          const sizeName = (
            det?.eventSize?.eventSizeName ??
            ev?.eventSize?.eventSizeName ??
            ""
          )
            .toString()
            .toLowerCase();
          const hasInternalKeyword =
            subtypeName.includes("intern") ||
            sizeName.includes("intern") ||
            subtypeName.includes("reserva") ||
            sizeName.includes("reserva");
          let activitiesIndicateInternal = false;
          try {
            const acts = (det?.activities ?? ev?.activities) || [];
            for (const a of acts) {
              const s = (
                a?.eventStatus?.eventStatusDescription ??
                a?.eventStatusDescription ??
                ""
              )
                .toString()
                .toLowerCase();
              if (
                s.includes("reserva") ||
                s.includes("interna") ||
                s.includes("intern")
              ) {
                activitiesIndicateInternal = true;
                break;
              }
            }
          } catch (e) {
            activitiesIndicateInternal = false;
          }

          const applyGlobalFallback =
            isTypeInHouse ||
            hasInternalKeyword ||
            activitiesIndicateInternal ||
            blockingCats.has(cat);

          if (applyGlobalFallback) {
            addLog(
              `SalonesDisponibles: evento ${evIdKey} solapante sin ids -> indicadores internos detectados, marcando todos los salones como ocupados (fallback)`
            );
            rooms.forEach((r: Room) => occupied.add(Number(r.idRoom)));
            break;
          } else {
            addLog(
              `SalonesDisponibles: evento ${evIdKey} solapante sin ids -> NO hay indicadores internos suficientes, no se aplica fallback global`
            );
            continue;
          }
        }

        // Considerar bloqueante si su categoría está en blockingCats OR si tiene salones asignados
        // salvo que esté explícitamente 'cancelado'
        if (blockingCats.has(cat) || (cat !== "cancelado" && ids.length > 0)) {
          addLog(
            `SalonesDisponibles: marcando como ocupados por evento ${
              ev.idEvent ?? ev.id ?? i
            } (status=${cat})`
          );
          ids.forEach((id) => occupied.add(id));
        } else {
          addLog(
            `SalonesDisponibles: NO se marca como ocupado el evento ${
              ev.idEvent ?? ev.id ?? i
            } (status=${cat})`
          );
        }
      }

      addLog(`SalonesDisponibles: ocupados detectados = ${occupied.size}`);

      // También revisar schedules por si contienen referencias a salones
      try {
        if (Array.isArray(schedules) && schedules.length > 0) {
          addLog(`SalonesDisponibles: schedules cargados=${schedules.length}`);
          for (const sch of schedules) {
            try {
              const schDate = sch.date ? sch.date.split("T")[0] : sch.date;
              // si la schedule está dentro del rango solicitado
              const inRange =
                reqS && reqE
                  ? new Date(schDate + "T00:00:00") >= reqS &&
                    new Date(schDate + "T00:00:00") <= reqE
                  : true;
              if (!inRange) continue;
              // intentar extraer ids desde la schedule
              const sIds = extractRoomIds(sch);
              if (!sIds || sIds.length === 0) continue;
              // intentar conocer el estado del evento padre
              const parentId = sch.eventId ?? sch.idEvent ?? sch.event;
              const parentEv = events.find(
                (e: any) => (e.idEvent ?? e.id ?? "") + "" === parentId + ""
              );
              const parentCat = parentEv ? classifyEventStatus(parentEv) : null;
              if (parentCat === "cancelado") continue;
              addLog(
                `SalonesDisponibles: extracted ids from schedule for event ${parentId}: ${sIds.join(
                  ","
                )}`
              );
              sIds.forEach((id) => occupied.add(id));
            } catch (e) {
              // ignore per schedule
            }
          }
          addLog(
            `SalonesDisponibles: ocupados después de schedules = ${occupied.size}`
          );
        }
      } catch (e) {
        // ignore
      }

      const available = rooms.filter(
        (r: Room) => r.roomActive && !occupied.has(Number(r.idRoom))
      );

      if (occupied.size === 0) {
        addLog(
          "SalonesDisponibles: ningún evento bloqueante detectado -> devolviendo todos los salones activos"
        );
        setAvailableRooms(rooms.filter((r: Room) => r.roomActive));
      } else {
        setAvailableRooms(available);
      }
    } catch (err) {
      console.error("Error loading available rooms:", err);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setAvailableRooms([]);
    setSearched(false);
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Salones Disponibles</h1>
          <p className="text-muted-foreground">
            Consulta la disponibilidad de salones por rango de fechas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rango de Fechas</CardTitle>
            <CardDescription>
              Selecciona las fechas para consultar disponibilidad
            </CardDescription>
            <div className="mt-2 text-sm text-yellow-600">
              Este módulo se está ajustando para mejorar la precisión de los
              datos. La información mostrada no está 100% verificada todavía —
              Ahí me disculpan estimades.
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Inicio</label>
                  <DatePicker
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={(v) =>
                      setStartDate(v ? new Date(v + "T00:00:00") : null)
                    }
                    placeholder="Selecciona fecha de inicio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Fin</label>
                  <DatePicker
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(v) =>
                      setEndDate(v ? new Date(v + "T00:00:00") : null)
                    }
                    placeholder="Selecciona fecha de fin"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSearch}
                  className="flex-1"
                  disabled={loading || !startDate || !endDate}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar Salones Disponibles"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Limpiar
                </Button>
              </div>

              {searched && !loading && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {availableRooms.length > 0 ? (
                    <>
                      Se encontraron <strong>{availableRooms.length}</strong>{" "}
                      salón(es) disponible(s) del{" "}
                      <strong>
                        {startDate &&
                          format(startDate, "d 'de' MMMM", { locale: es })}
                      </strong>{" "}
                      al{" "}
                      <strong>
                        {endDate &&
                          format(endDate, "d 'de' MMMM", { locale: es })}
                      </strong>
                    </>
                  ) : (
                    <>
                      No se encontraron salones disponibles en el rango
                      seleccionado
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {searched && (
          <Card>
            <CardHeader>
              <CardTitle>Salones Disponibles</CardTitle>
              <CardDescription>
                {availableRooms.length} salones sin ocupación en el rango
                seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Spinner size="md" label="Buscando salones disponibles..." />
                </div>
              ) : availableRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No hay salones disponibles en el rango seleccionado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intenta con otras fechas
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salón</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Altura</TableHead>
                        <TableHead>Capacidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableRooms.map((room) => (
                        <TableRow key={room.idRoom}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{room.roomName}</p>
                                {room.roomComments && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {room.roomComments}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{room.roomMt2}m²</TableCell>
                          <TableCell>{room.roomHeight}m</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {room.roomSetups.length > 0
                                ? Math.max(
                                    ...room.roomSetups.map(
                                      (s) => s.roomSetupPaxsCapacity
                                    )
                                  )
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {room.roomActive ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <Check className="h-3 w-3" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <X className="h-3 w-3" />
                                Inactivo
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoomClick(room)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedRoom?.roomName || "Detalles del Salón"}
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedRoom?.idRoom}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedRoom && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.roomComments || "Sin descripción"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Área</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomMt2}m²
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Altura</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomHeight}m
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Estado</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomActive ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Capacidad Máxima
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomSetups.length > 0
                            ? Math.max(
                                ...selectedRoom.roomSetups.map(
                                  (s) => s.roomSetupPaxsCapacity
                                )
                              )
                            : "N/A"}{" "}
                          personas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">
                      Montajes Disponibles
                    </p>
                    {selectedRoom.roomSetups.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRoom.roomSetups.map((setup, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {setup.roomSetupName || `Montaje ${idx + 1}`}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {setup.roomSetupPaxsCapacity} personas
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay montajes disponibles para este salón
                      </p>
                    )}
                  </div>

                  {startDate && endDate && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        ✓ Disponible
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Este salón está disponible del{" "}
                        {format(startDate, "d 'de' MMMM", { locale: es })} al{" "}
                        {format(endDate, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
        {/* Panel de depuración (visible cuando hay mensajes) */}
        {debugMessages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug - SalonesDisponibles</CardTitle>
              <CardDescription>
                Mensajes de depuración (se muestran aquí además de la consola)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-auto text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded">
                {debugMessages.map((m, idx) => (
                  <div key={idx} className="py-0.5">
                    {m}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
