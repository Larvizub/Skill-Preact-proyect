import { useState, useEffect } from "preact/hooks";
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
import { getEventStatusText } from "../lib/eventStatus";
import { formatDateLocal } from "../lib/dateUtils";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Clock,
  FileText,
  UserCog,
  Mail,
  Hash,
  Info,
  MessageSquare,
  Package,
  Home,
  ArrowLeft,
  ChevronDown,
} from "lucide-preact";

interface EventoDetalleProps {
  eventNumber?: string;
  id?: string;
}

export function EventoDetalle({ eventNumber, id }: EventoDetalleProps) {
  const eventIdentifier = eventNumber ?? id ?? null;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cotizacionExpanded, setCotizacionExpanded] = useState(false);
  const [actividadesExpanded, setActividadesExpanded] = useState(false);
  const [salonesExpanded, setSalonesExpanded] = useState(false);
  const [serviciosExpanded, setServiciosExpanded] = useState(false);
  const [catalogServices, setCatalogServices] = useState<any[]>([]);

  useEffect(() => {
    console.log("=== EventoDetalle useEffect ===");
    console.log("ID recibido:", eventIdentifier);
    console.log("Tipo de ID:", typeof eventIdentifier);

    // Cargar servicios del catálogo primero
    loadCatalogServices();

    if (eventIdentifier) {
      loadEventDetails(eventIdentifier);
    } else {
      console.error("No se recibió ID");
      setLoading(false);
    }
  }, [eventIdentifier]);

  const loadCatalogServices = async () => {
    try {
      const services = await apiService.getServices();
      setCatalogServices(services);
    } catch (error) {
      console.error("Error cargando servicios del catálogo:", error);
    }
  };

  const loadEventDetails = async (eventIdentifier: string) => {
    try {
      setLoading(true);

      // Primero intentar cargar desde sessionStorage
      const storedEvent = sessionStorage.getItem("currentEvent");
      if (storedEvent) {
        try {
          const parsedEvent = JSON.parse(storedEvent);
          console.log("Evento cargado desde sessionStorage:", parsedEvent);
          const storedMatches =
            parsedEvent?.eventNumber?.toString() === eventIdentifier ||
            parsedEvent?.idEvent?.toString() === eventIdentifier;
          if (storedMatches) {
            setEvent(parsedEvent);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parseando evento de sessionStorage:", e);
        }
      }

      // Si no está en sessionStorage, buscar en el API usando el rango guardado
      const storedRange = sessionStorage.getItem("currentEventSearchRange");
      let startDate, endDate;

      if (storedRange) {
        try {
          const range = JSON.parse(storedRange);
          startDate = range.startDate;
          endDate = range.endDate;
        } catch (e) {
          console.error("Error parseando rango:", e);
        }
      }

      // Si no hay rango guardado, usar uno por defecto
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
      }

      console.log(
        "Buscando evento por identificador:",
        eventIdentifier,
        "en rango:",
        startDate,
        "a",
        endDate
      );
      const events = await apiService.getEvents(
        startDate,
        endDate,
        eventIdentifier
      );
      console.log("Total eventos encontrados:", events.length);

      const foundEvent = events.find((eventItem: Event) => {
        const eventNum = (eventItem as any)?.eventNumber;
        return (
          eventNum?.toString() === eventIdentifier ||
          eventItem.idEvent?.toString() === eventIdentifier
        );
      });
      console.log("Evento encontrado:", foundEvent);

      if (foundEvent) {
        setEvent(foundEvent);
        // Guardar en sessionStorage para futuras recargas
        sessionStorage.setItem("currentEvent", JSON.stringify(foundEvent));
      } else {
        console.error(
          "Evento no encontrado con identificador:",
          eventIdentifier
        );
      }
    } catch (error) {
      console.error("Error cargando detalles del evento:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" label="Cargando evento..." />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-lg text-muted-foreground">Evento no encontrado</p>
          <Button onClick={() => route("/eventos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Eventos
          </Button>
        </div>
      </Layout>
    );
  }

  const rawEvent = event as any;

  // Obtener el estado del evento usando la función centralizada
  const statusLabel = getEventStatusText(event) || "No especificado";
  const marketSegmentName =
    rawEvent?.marketSegmentName ??
    rawEvent?.marketSegment?.marketSegmentName ??
    rawEvent?.eventMarketSegmentName ??
    rawEvent?.eventMarketSegment?.marketSegmentName ??
    rawEvent?.marketSegment?.name ??
    null;
  const marketSubSegmentName =
    rawEvent?.marketSubSegmentName ??
    rawEvent?.marketSubSegment?.marketSubSegmentName ??
    rawEvent?.eventMarketSubSegmentName ??
    rawEvent?.eventMarketSubSegment?.marketSubSegmentName ??
    rawEvent?.marketSubSegment?.name ??
    null;
  const eventSizeName =
    rawEvent?.eventSizeName ??
    rawEvent?.eventSize?.eventSizeName ??
    rawEvent?.eventSize?.name ??
    rawEvent?.size?.eventSizeName ??
    null;

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const origin =
                sessionStorage.getItem("eventDetailOrigin") || "/eventos";
              route(origin);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                ID Evento (Skill): {(event as any)?.eventNumber ?? "-"}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                ID Interno: {event.idEvent}
              </span>
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del evento */}
        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Descripción (full width) */}
              {(event as any)?.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Descripción
                  </p>
                  <p className="text-sm mt-1">{(event as any).description}</p>
                </div>
              )}

              {/* Row 1: Segmento / Subsegmento / Tamaño */}
              {(marketSegmentName || marketSubSegmentName || eventSizeName) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Segmento de Mercado
                    </p>
                    <p className="text-sm mt-1">{marketSegmentName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Subsegmento
                    </p>
                    <p className="text-sm mt-1">
                      {marketSubSegmentName || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tamaño del Evento
                    </p>
                    <p className="text-sm mt-1">{eventSizeName || "-"}</p>
                  </div>
                </div>
              )}

              {/* Row 2: Fechas y Estatus */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha Inicio
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateLocal(event.startDate, "es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha Fin
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateLocal(event.endDate, "es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estatus
                  </p>
                  <div className="text-sm mt-1">
                    <div>{statusLabel}</div>
                  </div>
                </div>
              </div>

              {/* Row 3: PAX / Contrato / Referencia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    PAX Estimado
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Users className="h-4 w-4" />
                    {(event as any)?.estimatedPax || "No especificado"}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    PAX Real
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Users className="h-4 w-4" />
                    {(event as any)?.realPax || "No especificado"}
                  </div>
                </div>

                <div>
                  {(event as any)?.contractNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contrato
                      </p>
                      <p className="text-sm mt-1">
                        {(event as any).contractNumber}
                      </p>
                    </div>
                  )}
                  {(event as any)?.reference && (
                    <div
                      className={`${
                        (event as any).contractNumber ? "pt-2" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        Referencia
                      </p>
                      <p className="text-sm mt-1">{(event as any).reference}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          {((event as any)?.client || (event as any)?.clientEventManager) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCog className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Código y Nombre del Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Código Cliente
                    </p>
                    <p className="text-sm mt-1">
                      {(event as any).client?.clientCode || "-"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Cliente
                    </p>
                    <p className="text-sm mt-1">
                      {(event as any).client?.clientName || "No especificado"}
                    </p>
                  </div>
                </div>

                {/* Event Manager (si existe) */}
                {(event as any).clientEventManager && (
                  <div
                    className={`${
                      (event as any).client?.clientCode ? "pt-4 border-t" : ""
                    }`}
                  >
                    <h4 className="text-sm font-semibold mb-3">
                      Event Manager
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Nombre
                        </p>
                        <p className="text-sm mt-1">
                          {(event as any).clientEventManager
                            .clientEventManagerName || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Contacto
                        </p>
                        <div className="space-y-1 mt-1 text-sm">
                          {(event as any).clientEventManager.Email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${
                                  (event as any).clientEventManager.Email
                                }`}
                                className="text-blue-600 hover:underline"
                              >
                                {(event as any).clientEventManager.Email}
                              </a>
                            </div>
                          )}
                          {(event as any).clientEventManager
                            .clientEventManagerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${
                                  (event as any).clientEventManager
                                    .clientEventManagerEmail
                                }`}
                                className="text-blue-600 hover:underline"
                              >
                                {
                                  (event as any).clientEventManager
                                    .clientEventManagerEmail
                                }
                              </a>
                            </div>
                          )}
                          {(event as any).clientEventManager.Phone && (
                            <div>{(event as any).clientEventManager.Phone}</div>
                          )}
                          {(event as any).clientEventManager
                            .clientEventManagerPhone && (
                            <div>
                              {
                                (event as any).clientEventManager
                                  .clientEventManagerPhone
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Ubicación
                        </p>
                        <div className="text-sm mt-1 space-y-1">
                          {(event as any).clientEventManager.Address && (
                            <div>
                              {(event as any).clientEventManager.Address}
                            </div>
                          )}
                          {(event as any).clientEventManager.City && (
                            <div>{(event as any).clientEventManager.City}</div>
                          )}
                          {(event as any).clientEventManager.State && (
                            <div>{(event as any).clientEventManager.State}</div>
                          )}
                          {(event as any).clientEventManager.PostalCode && (
                            <div>
                              {(event as any).clientEventManager.PostalCode}
                            </div>
                          )}
                          {(event as any).clientEventManager.Country && (
                            <div>
                              {(event as any).clientEventManager.Country}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Extra fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      {(event as any).clientEventManager.JobTitle && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Cargo
                          </p>
                          <p className="text-sm mt-1">
                            {(event as any).clientEventManager.JobTitle}
                          </p>
                        </div>
                      )}
                      {(event as any).clientEventManager.Department && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Departamento
                          </p>
                          <p className="text-sm mt-1">
                            {(event as any).clientEventManager.Department}
                          </p>
                        </div>
                      )}
                      {(event as any).clientEventManager.Mobile && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Móvil
                          </p>
                          <p className="text-sm mt-1">
                            {(event as any).clientEventManager.Mobile}
                          </p>
                        </div>
                      )}
                    </div>

                    {(event as any).clientEventManager.Notes && (
                      <div className="pt-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Notas
                        </p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {(event as any).clientEventManager.Notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Coordinador/Vendedor */}
          {(event as any)?.salesAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCog className="h-5 w-5" />
                  Coordinador de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nombre
                    </p>
                    <p className="text-sm mt-1">
                      {(event as any).salesAgent.salesAgentName ||
                        "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <div className="text-sm mt-1">
                      {(event as any).salesAgent.salesAgentEmail ? (
                        <a
                          href={`mailto:${
                            (event as any).salesAgent.salesAgentEmail
                          }`}
                          className="text-primary hover:underline"
                        >
                          {(event as any).salesAgent.salesAgentEmail}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          No especificado
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Teléfono
                    </p>
                    <p className="text-sm mt-1">
                      {(event as any).salesAgent.salesAgentPhone || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tipo de Evento */}
          {(event as any)?.eventType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Tipo de Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {(event as any).eventType.eventTypeName || "No especificado"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actividades */}
          {(event as any)?.activities &&
            (event as any).activities.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
                  onClick={() => setActividadesExpanded(!actividadesExpanded)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Actividades ({(event as any).activities.length})
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        actividadesExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </CardTitle>
                </CardHeader>
                {actividadesExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      {(event as any).activities.map(
                        (activity: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-muted space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">
                                    {activity.activityType?.activityTypeName ||
                                      "Actividad"}
                                  </p>
                                  {activity.eventStatusDescription && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                      {activity.eventStatusDescription}
                                    </span>
                                  )}
                                </div>
                                {activity.room && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {activity.room.roomName}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                {activity.activityDate && (
                                  <p>
                                    {formatDateLocal(activity.activityDate)}
                                  </p>
                                )}
                                {activity.startTime && activity.endTime && (
                                  <p>
                                    {activity.startTime} - {activity.endTime}
                                  </p>
                                )}
                              </div>
                            </div>
                            {activity.activityComments && (
                              <p className="text-xs text-muted-foreground">
                                {activity.activityComments}
                              </p>
                            )}
                            {activity.estimatedPax && (
                              <div className="flex items-center gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                PAX: {activity.estimatedPax}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

          {/* Salones (de activities.rooms) */}
          {(event as any)?.activities &&
            (event as any).activities.some(
              (a: any) => a.rooms && a.rooms.length > 0
            ) && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
                  onClick={() => setSalonesExpanded(!salonesExpanded)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Salones
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        salonesExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </CardTitle>
                </CardHeader>
                {salonesExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Agrupar salones por scheduleDescription (de la actividad) o por fecha
                        const roomsBySchedule: { [key: string]: any[] } = {};
                        (event as any).activities
                          .filter(
                            (activity: any) =>
                              activity.rooms && activity.rooms.length > 0
                          )
                          .forEach((activity: any) => {
                            activity.rooms.forEach((room: any) => {
                              // Intentar obtener scheduleDescription de la actividad o del room
                              const scheduleKey =
                                activity.scheduleDescription ||
                                room.schedule?.scheduleDescription ||
                                (activity.activityDate
                                  ? formatDateLocal(
                                      activity.activityDate,
                                      "es-ES",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )
                                  : "Sin horario especificado");

                              if (!roomsBySchedule[scheduleKey])
                                roomsBySchedule[scheduleKey] = [];
                              roomsBySchedule[scheduleKey].push({
                                ...room,
                                activity,
                              });
                            });
                          });

                        const sortedSchedules = Object.keys(
                          roomsBySchedule
                        ).sort((a, b) => {
                          if (a === "Sin horario especificado") return 1;
                          if (b === "Sin horario especificado") return -1;
                          return a.localeCompare(b);
                        });

                        return sortedSchedules.map((scheduleKey) => (
                          <div key={scheduleKey} className="space-y-2">
                            {/* Header del grupo con scheduleDescription o fecha */}
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {scheduleKey}
                            </h4>

                            {/* Lista de salones (una columna) */}
                            <div className="space-y-2 ml-6">
                              {roomsBySchedule[scheduleKey].map(
                                (item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-lg bg-muted space-y-2"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          {item.roomName || "Salón sin nombre"}
                                        </p>
                                        {item.roomCode && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Código: {item.roomCode}
                                          </p>
                                        )}

                                        {/* Fecha de la actividad */}
                                        {item.activity?.activityDate && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            📅 Fecha Actividad:{" "}
                                            {formatDateLocal(
                                              item.activity.activityDate,
                                              "es-ES",
                                              {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              }
                                            )}
                                          </p>
                                        )}

                                        {item.activity?.activityType
                                          ?.activityTypeName && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Actividad:{" "}
                                            {
                                              item.activity.activityType
                                                .activityTypeName
                                            }
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-xs text-muted-foreground">
                                        {item.activity?.startTime &&
                                          item.activity?.endTime && (
                                            <p>
                                              {item.activity.startTime} -{" "}
                                              {item.activity.endTime}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {item.roomMt2 && (
                                        <div>
                                          <span className="text-muted-foreground">
                                            Área:{" "}
                                          </span>
                                          <span className="font-medium">
                                            {item.roomMt2} m²
                                          </span>
                                        </div>
                                      )}
                                      {item.roomHeight && (
                                        <div>
                                          <span className="text-muted-foreground">
                                            Altura:{" "}
                                          </span>
                                          <span className="font-medium">
                                            {item.roomHeight} m
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {item.roomComments && (
                                      <p className="text-xs text-muted-foreground pt-2 border-t">
                                        {item.roomComments}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

          {/* Servicios (de activities.services) */}
          {(event as any)?.activities &&
            (event as any).activities.some(
              (a: any) => a.services && a.services.length > 0
            ) && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
                  onClick={() => setServiciosExpanded(!serviciosExpanded)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Servicios
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        serviciosExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </CardTitle>
                </CardHeader>
                {serviciosExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Agrupar servicios por scheduleDescription del objeto schedule
                        const servicesBySchedule: { [key: string]: any[] } = {};
                        (event as any).activities
                          .filter(
                            (activity: any) =>
                              activity.services && activity.services.length > 0
                          )
                          .forEach((activity: any) => {
                            activity.services.forEach((service: any) => {
                              // Usar schedule.scheduleDescription del servicio
                              const scheduleKey =
                                service.schedule?.scheduleDescription ||
                                "Sin horario especificado";
                              if (!servicesBySchedule[scheduleKey])
                                servicesBySchedule[scheduleKey] = [];
                              servicesBySchedule[scheduleKey].push({
                                ...service,
                                activity, // Incluir la actividad completa para acceder a su fecha
                              });
                            });
                          });

                        const sortedSchedules = Object.keys(
                          servicesBySchedule
                        ).sort((a, b) => {
                          if (a === "Sin horario especificado") return 1;
                          if (b === "Sin horario especificado") return -1;
                          return a.localeCompare(b);
                        });

                        return sortedSchedules.map((scheduleKey) => (
                          <div key={scheduleKey} className="space-y-2">
                            {/* Header del grupo con scheduleDescription */}
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {scheduleKey}
                            </h4>

                            {/* Lista de servicios (una columna) */}
                            <div className="space-y-2 ml-6">
                              {servicesBySchedule[scheduleKey].map(
                                (item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-lg bg-muted space-y-2"
                                  >
                                    {/* Header del servicio con nombre y cantidad */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-medium text-sm">
                                            {item.serviceName ||
                                              "Servicio sin nombre"}
                                          </p>
                                          {item.quantity && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                              ×{item.quantity}
                                            </span>
                                          )}
                                        </div>

                                        {/* Información del servicio en líneas separadas */}
                                        {item.serviceNameAlternative && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {item.serviceNameAlternative}
                                          </p>
                                        )}
                                        {item.serviceCode && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Código: {item.serviceCode}
                                          </p>
                                        )}

                                        {/* Fecha de la actividad */}
                                        {item.activity?.activityDate && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            📅 Fecha Actividad:{" "}
                                            {formatDateLocal(
                                              item.activity.activityDate,
                                              "es-ES",
                                              {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              }
                                            )}
                                          </p>
                                        )}

                                        {/* Tipo de actividad */}
                                        {item.activity?.activityType
                                          ?.activityTypeName && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Actividad:{" "}
                                            {
                                              item.activity.activityType
                                                .activityTypeName
                                            }
                                          </p>
                                        )}

                                        {/* Horario del schedule */}
                                        {item.schedule?.startDate && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            📅{" "}
                                            {formatDateLocal(
                                              item.schedule.startDate
                                            )}
                                            {item.schedule.startTime &&
                                              item.schedule.endTime && (
                                                <span>
                                                  {" "}
                                                  • {
                                                    item.schedule.startTime
                                                  } - {item.schedule.endTime}
                                                </span>
                                              )}
                                          </p>
                                        )}

                                        {/* Precios del servicio */}
                                        {(item.priceTI !== undefined ||
                                          item.priceTNI !== undefined) && (
                                          <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                                            {item.priceTI !== undefined && (
                                              <p className="text-xs text-muted-foreground">
                                                Precio TI (Con Impuestos): $
                                                {item.priceTI.toFixed(2)}
                                              </p>
                                            )}
                                            {item.priceTNI !== undefined && (
                                              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                Precio TNI (Sin Impuestos): $
                                                {item.priceTNI.toFixed(2)}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right text-xs text-muted-foreground">
                                        {item.creationDate && (
                                          <p>
                                            Creado:{" "}
                                            {formatDateLocal(
                                              item.creationDate,
                                              "es-ES",
                                              {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                              }
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Categoría y subcategoría */}
                                    {item.serviceCategory && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">
                                          Categoría:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {
                                            item.serviceCategory
                                              .serviceCategoryName
                                          }
                                        </span>
                                        {item.serviceSubCategory && (
                                          <span className="text-muted-foreground">
                                            {" / "}
                                            {
                                              item.serviceSubCategory
                                                .serviceSubCategoryName
                                            }
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Comentarios */}
                                    {item.serviceComments && (
                                      <p className="text-xs text-muted-foreground pt-2 border-t">
                                        {item.serviceComments}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

          {/* Comentarios */}
          {((event as any)?.comments || (event as any)?.internalComments) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(event as any)?.comments && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Comentarios Generales
                    </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {(event as any).comments}
                    </p>
                  </div>
                )}
                {(event as any)?.internalComments && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Comentarios Internos
                    </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {(event as any).internalComments}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cotización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Cotización del Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calcular totales por área desde los datos reales del evento
                const totalesPorArea: {
                  area: string;
                  items: Array<{
                    descripcion: string;
                    precio: number;
                    cantidad: number;
                  }>;
                  total: number;
                }[] = [];

                let totalGeneral = 0;

                // 1. Salones (de activities.rooms)
                const totalSalones = {
                  area: "Salones",
                  items: [] as Array<{
                    descripcion: string;
                    precio: number;
                    cantidad: number;
                  }>,
                  total: 0,
                };

                if ((event as any)?.activities) {
                  (event as any).activities.forEach((activity: any) => {
                    if (activity.rooms && Array.isArray(activity.rooms)) {
                      activity.rooms.forEach((room: any) => {
                        const precio = room.priceTNI || room.priceTI || 0;
                        if (precio > 0) {
                          totalSalones.items.push({
                            descripcion:
                              room.roomName || room.name || "Salón sin nombre",
                            precio,
                            cantidad: 1,
                          });
                          totalSalones.total += precio;
                        }
                      });
                    }
                  });
                }

                if (totalSalones.items.length > 0) {
                  totalesPorArea.push(totalSalones);
                  totalGeneral += totalSalones.total;
                }

                // 2. Servicios agrupados por Grupo de Ingresos (revenueGroup)
                const serviciosPorGrupo: {
                  [grupo: string]: {
                    items: Array<{
                      descripcion: string;
                      precio: number;
                      cantidad: number;
                    }>;
                    total: number;
                  };
                } = {};

                if ((event as any)?.activities) {
                  (event as any).activities.forEach((activity: any) => {
                    if (activity.services && Array.isArray(activity.services)) {
                      activity.services.forEach((service: any) => {
                        const precio = service.priceTNI || service.priceTI || 0;
                        const cantidad =
                          service.quantity || service.serviceQuantity || 1;

                        if (precio > 0) {
                          // Buscar el servicio en el catálogo usando idService
                          const catalogService = catalogServices.find(
                            (cs: any) => cs.idService === service.idService
                          );

                          // Obtener el grupo de ingresos del catálogo
                          const grupoIngresos =
                            catalogService?.revenueGroup?.revenueGroupName ||
                            "Otros Servicios";

                          // Inicializar el grupo si no existe
                          if (!serviciosPorGrupo[grupoIngresos]) {
                            serviciosPorGrupo[grupoIngresos] = {
                              items: [],
                              total: 0,
                            };
                          }

                          // Agregar el item al grupo
                          serviciosPorGrupo[grupoIngresos].items.push({
                            descripcion:
                              service.serviceName ||
                              service.name ||
                              "Servicio sin nombre",
                            precio,
                            cantidad,
                          });
                          serviciosPorGrupo[grupoIngresos].total +=
                            precio * cantidad;
                        }
                      });
                    }
                  });
                }

                // Agregar cada grupo de servicios como un área separada
                Object.keys(serviciosPorGrupo)
                  .sort()
                  .forEach((grupoNombre) => {
                    const grupoData = serviciosPorGrupo[grupoNombre];
                    if (grupoData.items.length > 0) {
                      totalesPorArea.push({
                        area: grupoNombre,
                        items: grupoData.items,
                        total: grupoData.total,
                      });
                      totalGeneral += grupoData.total;
                    }
                  });

                const amountSources = [
                  rawEvent,
                  rawEvent?.totals,
                  rawEvent?.Totals,
                  rawEvent?.eventTotals,
                  rawEvent?.financialSummary,
                  rawEvent?.financial,
                  rawEvent?.quoteTotals,
                  rawEvent?.quote,
                  rawEvent?.summary,
                  rawEvent?.pricing,
                  rawEvent?.eventSummary,
                ];

                const parseNumericValue = (value: unknown): number | null => {
                  if (value === null || value === undefined) return null;
                  if (typeof value === "number") {
                    return Number.isFinite(value) ? value : null;
                  }
                  if (typeof value === "string") {
                    const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
                    return Number.isNaN(normalized) ? null : normalized;
                  }
                  return null;
                };

                const pickAmount = (keys: string[]): number | null => {
                  for (const source of amountSources) {
                    if (!source || typeof source !== "object") continue;
                    for (const key of keys) {
                      if (!(key in source)) continue;
                      const candidate = parseNumericValue(
                        (source as Record<string, unknown>)[key]
                      );
                      if (candidate !== null) {
                        return candidate;
                      }
                    }
                  }
                  return null;
                };

                const ensurePositive = (value: number | null): number => {
                  if (value === null || Number.isNaN(value)) return 0;
                  return Math.abs(value);
                };

                const subtotal = totalGeneral;
                const discountAmount = ensurePositive(
                  pickAmount([
                    "totalDiscount",
                    "totalDiscountAmount",
                    "discountAmount",
                    "eventDiscount",
                    "discount",
                    "discountValue",
                    "eventDiscountAmount",
                  ])
                );
                const taxesAmount = ensurePositive(
                  pickAmount([
                    "totalTax",
                    "totalTaxes",
                    "totalTaxAmount",
                    "taxAmount",
                    "eventTax",
                    "taxes",
                    "taxValue",
                    "eventTaxes",
                  ])
                );
                const providedGrandTotalValue = pickAmount([
                  "totalAmount",
                  "grandTotal",
                  "eventTotal",
                  "totalWithTax",
                  "eventAmount",
                  "totalQuotation",
                ]);

                const computedGrandTotal =
                  subtotal - discountAmount + taxesAmount;

                const normalizedFinalTotal = (() => {
                  if (
                    providedGrandTotalValue !== null &&
                    Number.isFinite(providedGrandTotalValue)
                  ) {
                    return providedGrandTotalValue;
                  }
                  if (Number.isFinite(computedGrandTotal)) {
                    return computedGrandTotal;
                  }
                  return subtotal;
                })();

                const usesProvidedTotal =
                  providedGrandTotalValue !== null &&
                  Number.isFinite(providedGrandTotalValue);

                const formatCurrency = (value: number) =>
                  value.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                const subtotalDisplay = `$${formatCurrency(subtotal)}`;
                const discountDisplay = `$${formatCurrency(discountAmount)}`;
                const taxesDisplay = `$${formatCurrency(taxesAmount)}`;
                const finalTotalDisplay = `$${formatCurrency(
                  normalizedFinalTotal
                )}`;

                // 3. Mostrar la cotización con acordeón
                return totalesPorArea.length > 0 ? (
                  <div className="space-y-4">
                    {/* Resumen Total (siempre visible) */}
                    <div className="flex flex-col gap-4 rounded-lg bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold">Total Cotizado</p>
                        <p className="text-xs text-muted-foreground">
                          {totalesPorArea.reduce(
                            (sum, area) => sum + area.items.length,
                            0
                          )}{" "}
                          ítems en {totalesPorArea.length}{" "}
                          {totalesPorArea.length === 1 ? "área" : "áreas"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {usesProvidedTotal
                            ? "Total final del sistema"
                            : "Subtotal - descuento + impuestos"}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {finalTotalDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-border/70 bg-background/50 p-4 text-sm shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">
                          {subtotalDisplay}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-destructive">
                        <span>Descuento del sistema</span>
                        <span className="font-medium">-{discountDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Impuestos del sistema</span>
                        <span className="font-medium">+{taxesDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/60 pt-2 font-semibold text-primary">
                        <span>Total con ajustes</span>
                        <span>{finalTotalDisplay}</span>
                      </div>
                    </div>

                    {/* Botón de Acordeón */}
                    <button
                      onClick={() => setCotizacionExpanded(!cotizacionExpanded)}
                      className="flex w-full items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <span className="text-sm font-medium">
                        {cotizacionExpanded ? "Ocultar" : "Ver"} Detalle por
                        Área
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${
                          cotizacionExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Desglose por Área (expandible) */}
                    {cotizacionExpanded && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {totalesPorArea.map((areaData) => (
                          <div
                            key={areaData.area}
                            className="space-y-3 rounded-lg bg-muted/50 p-4"
                          >
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="text-sm font-semibold">
                                {areaData.area}
                              </h4>
                              <p className="text-sm font-bold text-primary">
                                $
                                {areaData.total.toLocaleString("es-ES", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>

                            <div className="space-y-2 pl-4">
                              {areaData.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between text-sm"
                                >
                                  <div className="flex-1">
                                    <p className="text-muted-foreground">
                                      {item.descripcion}
                                    </p>
                                    {item.cantidad > 1 && (
                                      <p className="text-xs text-muted-foreground/70">
                                        Cantidad: {item.cantidad} × $
                                        {item.precio.toLocaleString("es-ES", {
                                          minimumFractionDigits: 2,
                                        })}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p className="font-medium">
                                      $
                                      {(
                                        item.precio * item.cantidad
                                      ).toLocaleString("es-ES", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Nota sobre precios */}
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          <p>
                            <strong>Nota:</strong> El subtotal se calcula a
                            partir de los salones y servicios listados. El total
                            final incluye el descuento y los impuestos
                            proporcionados por el sistema y se priorizan precios
                            sin impuestos (TNI) cuando están disponibles.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No hay información de precios disponible para este evento
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* Fechas del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-xs">
              {(event as any)?.creationDate && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Fecha Creación
                  </p>
                  <p className="mt-1">
                    {new Date((event as any).creationDate).toLocaleString(
                      "es-ES"
                    )}
                  </p>
                </div>
              )}
              {(event as any)?.modificationDate && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Última Modificación
                  </p>
                  <p className="mt-1">
                    {new Date((event as any).modificationDate).toLocaleString(
                      "es-ES"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
