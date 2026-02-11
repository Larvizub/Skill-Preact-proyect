import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { DatePicker } from "../components/ui/datepicker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ChevronDown, Search } from "lucide-preact";
import {
  apiService,
  type ActivityPackage,
  type Client,
  type ClientEventManager,
  type Contingency,
  type EventCoordinator,
  type EventMarketSubSegment,
  type EventPaymentForm,
  type EventSector,
  type EventSize,
  type EventStatus,
  type EventSubType,
  type ExtraTip,
  type MarketSegment,
  type ReservationType,
  type ReservationUse,
  type Resource,
  type Room,
  type RoomRate,
  type SalesAgent,
  type Service,
  type TaxExemption,
} from "../services/api.service";

interface EventFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  idClient: string;
  idCurrency: string;
  discountPercentage: string;
  idSalesAgent: string;
  idEventSubsegment: string;
  idEventSegment: string;
  idEventSubtype: string;
  idEventCharacter: string;
  idEventSector: string;
  idEventSize: string;
  idEventPaymentForm: string;
  idClientEventManager: string;
  idEventCoordinator: string;
  repetitiveEvent: boolean;
  estimatedPax: string;
  realPax: string;
  contractNumber: string;
  reference: string;
  comments: string;
  internalComments: string;
  idExemption: string;
  idExtraTip: string;
  extraTipAmount: string;
  idContingency: string;
  contingenciesAmount: string;
  personalContract: boolean;
  contractAlreadySigned: boolean;
  signatureDate: string;
  billingName: string;
  quoteExpirationDate: string;
  standsQuantity: string;
  idCreationOper: string;
  idEventStage: string;
  sustainable: boolean;
  icca: boolean;
}

interface ActivityRoomForm {
  idRoom: string;
  idRoomSetup: string;
  idReservationType: string;
  idReservationUse: string;
  idCreationOper: string;
  idSchedule: string;
  hourFrom: string;
  hourTo: string;
  scheduleDescription: string;
  preparationMinutes: string;
  cleaningMinutes: string;
  estimatedPax: string;
  realPax: string;
  discountPercentage: string;
  idRate: string;
  priceTNI: string;
  priceTI: string;
  roomComments: string;
  idExemption: string;
}

interface ActivityServiceForm {
  idService: string;
  idActivityRoomIndex: string;
  quantity: string;
  idReservationType: string;
  idReservationUse: string;
  idCreationOper: string;
  idSchedule: string;
  hourFrom: string;
  hourTo: string;
  scheduleDescription: string;
  discountPercentage: string;
  priceTNI: string;
  priceTI: string;
  costPrice: string;
  serviceComments: string;
  idActivityPackage: string;
}

interface ActivityForm {
  activityTitle: string;
  activityDescription: string;
  idEventStatus: string;
  checkInTime: string;
  startTime: string;
  endTime: string;
  checkOutTime: string;
  discountPercentage: string;
  dueDate: string;
  activityComments: string;
  idResource: string;
  idClient: string;
  idCreationOper: string;
  idActivityType: string;
  rooms: ActivityRoomForm[];
  services: ActivityServiceForm[];
}

const createEmptyRoom = (): ActivityRoomForm => ({
  idRoom: "",
  idRoomSetup: "",
  idReservationType: "",
  idReservationUse: "",
  idCreationOper: "",
  idSchedule: "",
  hourFrom: "",
  hourTo: "",
  scheduleDescription: "",
  preparationMinutes: "0",
  cleaningMinutes: "0",
  estimatedPax: "0",
  realPax: "0",
  discountPercentage: "",
  idRate: "",
  priceTNI: "",
  priceTI: "",
  roomComments: "",
  idExemption: "",
});

const createEmptyService = (): ActivityServiceForm => ({
  idService: "",
  idActivityRoomIndex: "",
  quantity: "1",
  idReservationType: "",
  idReservationUse: "",
  idCreationOper: "",
  idSchedule: "",
  hourFrom: "",
  hourTo: "",
  scheduleDescription: "",
  discountPercentage: "",
  priceTNI: "",
  priceTI: "",
  costPrice: "",
  serviceComments: "",
  idActivityPackage: "",
});

const createEmptyActivity = (): ActivityForm => ({
  activityTitle: "",
  activityDescription: "",
  idEventStatus: "",
  checkInTime: "",
  startTime: "",
  endTime: "",
  checkOutTime: "",
  discountPercentage: "",
  dueDate: "",
  activityComments: "",
  idResource: "",
  idClient: "",
  idCreationOper: "",
  idActivityType: "",
  rooms: [],
  services: [],
});

const initialEventState: EventFormState = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  idClient: "",
  idCurrency: "",
  discountPercentage: "",
  idSalesAgent: "",
  idEventSubsegment: "",
  idEventSegment: "",
  idEventSubtype: "",
  idEventCharacter: "",
  idEventSector: "",
  idEventSize: "",
  idEventPaymentForm: "",
  idClientEventManager: "",
  idEventCoordinator: "",
  repetitiveEvent: false,
  estimatedPax: "0",
  realPax: "0",
  contractNumber: "",
  reference: "",
  comments: "",
  internalComments: "",
  idExemption: "",
  idExtraTip: "",
  extraTipAmount: "",
  idContingency: "",
  contingenciesAmount: "",
  personalContract: false,
  contractAlreadySigned: false,
  signatureDate: "",
  billingName: "",
  quoteExpirationDate: "",
  standsQuantity: "",
  idCreationOper: "",
  idEventStage: "",
  sustainable: false,
  icca: false,
};

const toNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const toStringOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toDateTimeString = (value: string) => {
  if (!value) return null;
  if (value.includes("T")) {
    const [datePart, timePart] = value.split("T");
    if (!datePart || !timePart) return null;
    const time = timePart.length === 5 ? `${timePart}:00` : timePart;
    return `${datePart} ${time}`;
  }
  return value;
};

export function CrearEventoDetalle() {
  const [eventState, setEventState] = useState<EventFormState>(
    initialEventState
  );
  const [activities, setActivities] = useState<ActivityForm[]>([
    createEmptyActivity(),
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    general: true,
    billing: false,
    activities: false,
  });
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [subsegments, setSubsegments] = useState<EventMarketSubSegment[]>([]);
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [subtypes, setSubtypes] = useState<EventSubType[]>([]);
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>(
    []
  );
  const [sectors, setSectors] = useState<EventSector[]>([]);
  const [sizes, setSizes] = useState<EventSize[]>([]);
  const [paymentForms, setPaymentForms] = useState<EventPaymentForm[]>([]);
  const [eventStages, setEventStages] = useState<{ id: string; name: string }[]>(
    []
  );
  const [taxExemptions, setTaxExemptions] = useState<TaxExemption[]>([]);
  const [extraTips, setExtraTips] = useState<ExtraTip[]>([]);
  const [contingencies, setContingencies] = useState<Contingency[]>([]);
  const [eventCoordinators, setEventCoordinators] = useState<
    EventCoordinator[]
  >([]);
  const [clientManagers, setClientManagers] = useState<ClientEventManager[]>(
    []
  );
  const [activityTypes, setActivityTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [eventStatuses, setEventStatuses] = useState<EventStatus[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservationTypes, setReservationTypes] = useState<ReservationType[]>(
    []
  );
  const [reservationUses, setReservationUses] = useState<ReservationUse[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomRates, setRoomRates] = useState<RoomRate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activityPackages, setActivityPackages] = useState<ActivityPackage[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const safeLoad = async <T,>(
          label: string,
          loader: () => Promise<T>,
          fallback: T
        ): Promise<T> => {
          try {
            return await loader();
          } catch (err) {
            console.warn(`loadOptions: ${label} fallo`, err);
            return fallback;
          }
        };

        const [
          clientData,
          salesData,
          segmentData,
          subsegmentData,
          subtypeData,
          characterData,
          sectorData,
          sizeData,
          paymentData,
          stageData,
          taxData,
          extraTipData,
          contingencyData,
          coordinatorData,
          activityTypeData,
          statusData,
          resourceData,
          reservationTypeData,
          reservationUseData,
          roomData,
          roomRateData,
          serviceData,
          activityPackageData,
        ] = await Promise.all([
          safeLoad("clients", () => apiService.getClients(), []),
          safeLoad("salesAgents", () => apiService.getSalesAgents(), []),
          safeLoad("eventMarketSegments", () => apiService.getEventMarketSegments(), []),
          safeLoad(
            "eventMarketSubSegments",
            () => apiService.getEventMarketSubSegments(),
            []
          ),
          safeLoad("eventSubTypes", () => apiService.getEventSubTypes(), []),
          safeLoad("eventCharacters", () => apiService.getEventCharacters(), []),
          safeLoad("eventSectors", () => apiService.getEventSectors(), []),
          safeLoad("eventSizes", () => apiService.getEventSizes(), []),
          safeLoad("eventPaymentForms", () => apiService.getEventPaymentForms(), []),
          safeLoad("eventStages", () => apiService.getEventStages(), []),
          safeLoad("taxExemptions", () => apiService.getTaxExemptions(), []),
          safeLoad("extraTips", () => apiService.getExtraTips(), []),
          safeLoad("contingencies", () => apiService.getContingencies(), []),
          safeLoad("eventCoordinators", () => apiService.getEventCoordinators(), []),
          safeLoad("activityTypes", () => apiService.getActivityTypes(), []),
          safeLoad("eventStatuses", () => apiService.getEventStatuses(), []),
          safeLoad("resources", () => apiService.getResources(), []),
          safeLoad("reservationTypes", () => apiService.getReservationTypes(), []),
          safeLoad("reservationUses", () => apiService.getReservationUses(), []),
          safeLoad("rooms", () => apiService.getRooms(), []),
          safeLoad("roomRates", () => apiService.getRoomRates(), []),
          safeLoad("services", () => apiService.getServices(), []),
          safeLoad("activityPackages", () => apiService.getActivityPackages(), []),
        ]);

        if (!isMounted) return;

        setClients(clientData || []);
        setSalesAgents(salesData || []);
        setSegments(segmentData || []);
        setSubsegments(subsegmentData || []);
        setSubtypes(subtypeData || []);
        setCharacters(
          (characterData || []).map((item: any) => ({
            id: String(item.id ?? item.idEventCharacter ?? ""),
            name: item.name ?? item.eventCharacterName ?? "",
          }))
        );
        setSectors(sectorData || []);
        setSizes(sizeData || []);
        setPaymentForms(paymentData || []);
        setEventStages(
          (stageData || []).map((item: any) => ({
            id: String(item.id ?? item.idEventStage ?? ""),
            name: item.name ?? item.eventStageName ?? "",
          }))
        );
        setTaxExemptions(taxData || []);
        setExtraTips(extraTipData || []);
        setContingencies(contingencyData || []);
        setEventCoordinators(coordinatorData || []);
        setActivityTypes(
          (activityTypeData || []).map((item: any) => ({
            id: String(item.id ?? item.idActivityType ?? ""),
            name: item.name ?? item.activityTypeName ?? "",
          }))
        );
        setEventStatuses(
          (statusData || []).map((item: any) => ({
            id: String(item.id ?? item.idEventStatus ?? ""),
            name: item.name ?? item.eventStatusName ?? "",
          }))
        );
        setResources(resourceData || []);
        setReservationTypes(reservationTypeData || []);
        setReservationUses(reservationUseData || []);
        setRooms(roomData || []);
        setRoomRates(roomRateData || []);
        setServices(serviceData || []);
        setActivityPackages(activityPackageData || []);

        if (
          clientData.length === 0 ||
          salesData.length === 0
        ) {
          setError(
            "Algunos parametros clave no se pudieron cargar. Revisa la conexion o el API."
          );
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Error cargando opciones del formulario:", err);
        if (isMounted) {
          setError(
            "No se pudieron cargar los datos de referencia. Verifica la conexion e intenta nuevamente."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const idClientNumber = toNumberOrNull(eventState.idClient);
    if (!idClientNumber) {
      setClientManagers([]);
      return;
    }

    apiService
      .getClientEventManagers(idClientNumber)
      .then((data) => {
        if (isMounted) setClientManagers(data || []);
      })
      .catch((err) => {
        console.warn("Error cargando responsables del cliente:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [eventState.idClient]);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: String(room.idRoom),
        label: `${room.roomName} (${room.roomCode || room.idRoom})`,
      })),
    [rooms]
  );

  const roomSetupOptions = useMemo(() => {
    const setups = new Map<string, string>();
    rooms.forEach((room) => {
      room.roomSetups?.forEach((setup) => {
        setups.set(String(setup.idRoomSetup), setup.roomSetupName);
      });
    });
    return Array.from(setups.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [rooms]);

  const roomRateOptions = useMemo(
    () =>
      roomRates.map((rate: any) => ({
        value: String(rate.idRate ?? rate.id ?? ""),
        label: `${rate.rate ?? rate.roomPriceTaxesIncluded ?? ""} ${
          rate.currency || ""
        }`,
      })),
    [roomRates]
  );

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        value: String(service.idService),
        label: `${service.serviceName} (${service.serviceCode || ""})`,
      })),
    [services]
  );


  const segmentOptions = useMemo(() => {
    const normalized = segments
      .map((segment: any) => ({
        id: String(
          segment.id ?? segment.idMarketSegment ?? segment.idEventMarketSegment ?? ""
        ),
        name:
          segment.name ??
          segment.marketSegmentName ??
          segment.eventMarketSegmentName ??
          "",
      }))
      .filter((segment) => segment.id && segment.name.trim().length > 0);

    if (normalized.length > 0) return normalized;

    const derived = new Map<string, string>();
    subsegments.forEach((sub: any) => {
      const id = String(
        sub.idMarketSegment ?? sub.idEventMarketSegment ?? sub.segmentId ?? ""
      );
      const name =
        sub.marketSegmentName ??
        sub.eventMarketSegmentName ??
        sub.segmentName ??
        "";
      if (id && name && !derived.has(id)) {
        derived.set(id, name);
      }
    });

    return Array.from(derived.entries()).map(([id, name]) => ({ id, name }));
  }, [segments, subsegments]);

  const subsegmentOptions = useMemo(() => {
    const normalized = subsegments
      .map((sub: any) => ({
        id: String(sub.idMarketSubSegment ?? sub.id ?? ""),
        name:
          sub.marketSubSegmentName ??
          sub.eventMarketSubSegmentName ??
          sub.subSegmentName ??
          "",
        segmentId: String(
          sub.idMarketSegment ?? sub.idEventMarketSegment ?? sub.segmentId ?? ""
        ),
      }))
      .filter((sub) => sub.id && sub.name.trim().length > 0);

    if (normalized.length > 0) return normalized;

    return segmentOptions.map((segment) => ({
      id: segment.id,
      name: segment.name,
      segmentId: segment.id,
    }));
  }, [subsegments, segmentOptions]);

  const filteredSubsegments = useMemo(() => {
    if (!eventState.idEventSegment) return [];
    return subsegmentOptions.filter(
      (sub) => sub.segmentId === eventState.idEventSegment
    );
  }, [eventState.idEventSegment, subsegmentOptions]);
  useEffect(() => {
    if (!eventState.idEventSegment) {
      if (eventState.idEventSubsegment) {
        updateEventField("idEventSubsegment", "");
      }
      return;
    }

    const stillValid = filteredSubsegments.some(
      (sub) => sub.id === eventState.idEventSubsegment
    );
    if (!stillValid && eventState.idEventSubsegment) {
      updateEventField("idEventSubsegment", "");
    }
  }, [eventState.idEventSegment, eventState.idEventSubsegment, filteredSubsegments]);
  const updateEventField = (
    field: keyof EventFormState,
    value: string | boolean
  ) => {
    setEventState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateActivity = (
    index: number,
    field: keyof ActivityForm,
    value: string
  ) => {
    setActivities((prev) =>
      prev.map((activity, idx) =>
        idx === index
          ? {
              ...activity,
              [field]: value,
            }
          : activity
      )
    );
  };

  const updateRoom = (
    activityIndex: number,
    roomIndex: number,
    field: keyof ActivityRoomForm,
    value: string
  ) => {
    setActivities((prev) =>
      prev.map((activity, idx) => {
        if (idx !== activityIndex) return activity;
        const roomsCopy = activity.rooms.map((room, rIdx) =>
          rIdx === roomIndex
            ? {
                ...room,
                [field]: value,
              }
            : room
        );
        return {
          ...activity,
          rooms: roomsCopy,
        };
      })
    );
  };

  const updateService = (
    activityIndex: number,
    serviceIndex: number,
    field: keyof ActivityServiceForm,
    value: string
  ) => {
    setActivities((prev) =>
      prev.map((activity, idx) => {
        if (idx !== activityIndex) return activity;
        const servicesCopy = activity.services.map((service, sIdx) =>
          sIdx === serviceIndex
            ? {
                ...service,
                [field]: value,
              }
            : service
        );
        return {
          ...activity,
          services: servicesCopy,
        };
      })
    );
  };

  const addActivity = () => {
    setActivities((prev) => [...prev, createEmptyActivity()]);
  };

  const removeActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addRoom = (activityIndex: number) => {
    setActivities((prev) =>
      prev.map((activity, idx) =>
        idx === activityIndex
          ? { ...activity, rooms: [...activity.rooms, createEmptyRoom()] }
          : activity
      )
    );
  };

  const removeRoom = (activityIndex: number, roomIndex: number) => {
    setActivities((prev) =>
      prev.map((activity, idx) => {
        if (idx !== activityIndex) return activity;
        return {
          ...activity,
          rooms: activity.rooms.filter((_, rIdx) => rIdx !== roomIndex),
        };
      })
    );
  };

  const addService = (activityIndex: number) => {
    setActivities((prev) =>
      prev.map((activity, idx) =>
        idx === activityIndex
          ? {
              ...activity,
              services: [...activity.services, createEmptyService()],
            }
          : activity
      )
    );
  };

  const removeService = (activityIndex: number, serviceIndex: number) => {
    setActivities((prev) =>
      prev.map((activity, idx) => {
        if (idx !== activityIndex) return activity;
        return {
          ...activity,
          services: activity.services.filter((_, sIdx) => sIdx !== serviceIndex),
        };
      })
    );
  };

  const validateRequired = () => {
    if (!eventState.title.trim()) return "El titulo del evento es requerido.";
    if (!eventState.startDate) return "La fecha de inicio es requerida.";
    if (!eventState.endDate) return "La fecha de fin es requerida.";
    if (!eventState.idClient) return "Selecciona un cliente.";
    if (!eventState.idSalesAgent)
      return "Selecciona el coordinador de cuenta.";
    if (segmentOptions.length > 0 && !eventState.idEventSegment)
      return "Selecciona el segmento del evento.";
    if (!eventState.idEventSubsegment)
      return "Selecciona el subsegmento del evento.";
    if (!eventState.idEventSubtype) return "Selecciona el subtipo del evento.";
    if (!eventState.idEventCharacter)
      return "Selecciona el caracter del evento.";
    if (!eventState.idEventSector)
      return "Selecciona el sector del evento.";
    if (!eventState.idEventSize) return "Selecciona el tamano del evento.";

    for (const [idx, activity] of activities.entries()) {
      if (!activity.activityTitle.trim())
        return `Actividad ${idx + 1}: titulo requerido.`;
      if (!activity.idEventStatus)
        return `Actividad ${idx + 1}: estado requerido.`;
      if (!activity.checkInTime)
        return `Actividad ${idx + 1}: check-in requerido.`;
      if (!activity.startTime)
        return `Actividad ${idx + 1}: hora inicio requerida.`;
      if (!activity.endTime)
        return `Actividad ${idx + 1}: hora fin requerida.`;
      if (!activity.checkOutTime)
        return `Actividad ${idx + 1}: check-out requerido.`;
    }

    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    const validationError = validateRequired();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const eventPayload = {
        title: eventState.title.trim(),
        description: toStringOrNull(eventState.description),
        startDate: eventState.startDate,
        endDate: eventState.endDate,
        idClient: toNumberOrNull(eventState.idClient),
        discountPercentage: toNumberOrNull(eventState.discountPercentage),
        idSalesAgent: toNumberOrNull(eventState.idSalesAgent),
        idEventSubsegment: toNumberOrNull(eventState.idEventSubsegment),
        idEventSubtype: toNumberOrNull(eventState.idEventSubtype),
        idEventCharacter: toNumberOrNull(eventState.idEventCharacter),
        idEventSector: toNumberOrNull(eventState.idEventSector),
        idEventSize: toNumberOrNull(eventState.idEventSize),
        idEventPaymentForm: toNumberOrNull(eventState.idEventPaymentForm),
        idClientEventManager: toNumberOrNull(eventState.idClientEventManager),
        idEventCoordinator: toNumberOrNull(eventState.idEventCoordinator),
        repetitiveEvent: eventState.repetitiveEvent,
        estimatedPax: toNumberOrNull(eventState.estimatedPax) ?? 0,
        realPax: toNumberOrNull(eventState.realPax) ?? 0,
        contractNumber: toStringOrNull(eventState.contractNumber),
        reference: toStringOrNull(eventState.reference),
        comments: toStringOrNull(eventState.comments),
        internalComments: toStringOrNull(eventState.internalComments),
        idExemption: toNumberOrNull(eventState.idExemption),
        idExtraTip: toNumberOrNull(eventState.idExtraTip),
        extraTipAmount: toNumberOrNull(eventState.extraTipAmount),
        idContingency: toNumberOrNull(eventState.idContingency),
        contingenciesAmount: toNumberOrNull(eventState.contingenciesAmount),
        personalContract: eventState.personalContract,
        contractAlreadySigned: eventState.contractAlreadySigned,
        signatureDate: toStringOrNull(eventState.signatureDate),
        billingName: toStringOrNull(eventState.billingName),
        quoteExpirationDate: toStringOrNull(eventState.quoteExpirationDate),
        standsQuantity: toNumberOrNull(eventState.standsQuantity),
        idCreationOper: toNumberOrNull(eventState.idCreationOper),
        idEventStage: toNumberOrNull(eventState.idEventStage),
        sustainable: eventState.sustainable,
        icca: eventState.icca,
      };

      const createEventResponse = await apiService.createEvent(eventPayload);
      const eventNumber = createEventResponse?.result?.eventNumber;

      if (!eventNumber) {
        throw new Error("No se recibio el numero de evento creado.");
      }

      for (const activity of activities) {
        const activityPayload = {
          activityTitle: activity.activityTitle.trim(),
          activityDescription: toStringOrNull(activity.activityDescription),
          idEventStatus: toNumberOrNull(activity.idEventStatus),
          checkInTime: toDateTimeString(activity.checkInTime),
          startTime: toDateTimeString(activity.startTime),
          endTime: toDateTimeString(activity.endTime),
          checkOutTime: toDateTimeString(activity.checkOutTime),
          discountPercentage: toNumberOrNull(activity.discountPercentage),
          dueDate: toStringOrNull(activity.dueDate),
          activityComments: toStringOrNull(activity.activityComments),
          idResource: toNumberOrNull(activity.idResource),
          idClient: toNumberOrNull(activity.idClient),
          idCreationOper: toNumberOrNull(activity.idCreationOper),
          idActivityType: toNumberOrNull(activity.idActivityType),
        };

        const activityResponse = await apiService.addEventActivity(
          eventNumber,
          activityPayload
        );
        const idEventActivity = activityResponse?.result?.idEventActivity;

        if (!idEventActivity) {
          throw new Error("No se recibio el id de actividad creada.");
        }

        const roomIds: number[] = [];
        for (const room of activity.rooms) {
          const roomPayload = {
            idRoom: toNumberOrNull(room.idRoom),
            idRoomSetup: toNumberOrNull(room.idRoomSetup),
            idReservationType: toNumberOrNull(room.idReservationType),
            idReservationUse: toNumberOrNull(room.idReservationUse),
            idCreationOper: toNumberOrNull(room.idCreationOper),
            idSchedule: toNumberOrNull(room.idSchedule),
            hourFrom: toStringOrNull(room.hourFrom),
            hourTo: toStringOrNull(room.hourTo),
            scheduleDescription: toStringOrNull(room.scheduleDescription),
            preparationMinutes: toNumberOrNull(room.preparationMinutes) ?? 0,
            cleaningMinutes: toNumberOrNull(room.cleaningMinutes) ?? 0,
            estimatedPax: toNumberOrNull(room.estimatedPax) ?? 0,
            realPax: toNumberOrNull(room.realPax) ?? 0,
            discountPercentage: toNumberOrNull(room.discountPercentage),
            idRate: toNumberOrNull(room.idRate),
            priceTNI: toNumberOrNull(room.priceTNI),
            priceTI: toNumberOrNull(room.priceTI),
            roomComments: toStringOrNull(room.roomComments),
            idExemption: toNumberOrNull(room.idExemption),
          };

          const roomResponse = await apiService.addActivityRoom(
            idEventActivity,
            roomPayload
          );
          const idActivityRoom = roomResponse?.result?.idActivityRoom;
          if (idActivityRoom) {
            roomIds.push(idActivityRoom);
          }
        }

        for (const service of activity.services) {
          const roomIndex = toNumberOrNull(service.idActivityRoomIndex);
          const linkedRoomId =
            roomIndex != null && roomIndex >= 0 && roomIndex < roomIds.length
              ? roomIds[roomIndex]
              : null;

          const servicePayload = {
            idService: toNumberOrNull(service.idService),
            idActivityRoom: linkedRoomId,
            quantity: toNumberOrNull(service.quantity) ?? 0,
            idReservationType: toNumberOrNull(service.idReservationType),
            idReservationUse: toNumberOrNull(service.idReservationUse),
            idCreationOper: toNumberOrNull(service.idCreationOper),
            idSchedule: toNumberOrNull(service.idSchedule),
            hourFrom: toStringOrNull(service.hourFrom),
            hourTo: toStringOrNull(service.hourTo),
            scheduleDescription: toStringOrNull(service.scheduleDescription),
            discountPercentage: toNumberOrNull(service.discountPercentage),
            priceTNI: toNumberOrNull(service.priceTNI),
            priceTI: toNumberOrNull(service.priceTI),
            costPrice: toNumberOrNull(service.costPrice),
            serviceComments: toStringOrNull(service.serviceComments),
            idActivityPackage: toNumberOrNull(service.idActivityPackage),
          };

          await apiService.addActivityService(idEventActivity, servicePayload);
        }
      }

      setSuccessMessage(
        `Evento creado correctamente. Numero de evento: ${eventNumber}`
      );
      route(`/eventos/${eventNumber}`);
    } catch (err) {
      console.error("Error creando evento:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el evento."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Crear Evento</h1>
            <p className="text-muted-foreground">
              Completa la informacion del evento, actividades, salones y
              servicios antes de guardar.
            </p>
          </div>
          <Button variant="outline" onClick={() => route("/eventos")}>
            Volver
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
            {successMessage}
          </div>
        )}

        <Dialog open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
          <DialogContent>
            <DialogHeader onClose={() => setClientSearchOpen(false)}>
              <div>
                <DialogTitle>Buscar cliente</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Selecciona el cliente de Skill para el evento.
                </p>
              </div>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={clientSearchQuery}
                  onInput={(e) =>
                    setClientSearchQuery(
                      (e.target as HTMLInputElement).value
                    )
                  }
                  placeholder="Buscar por nombre, codigo o ID"
                />
                <Button variant="outline" size="icon" aria-label="Buscar">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-2">
                {clients
                  .filter((client) => {
                    const query = clientSearchQuery.trim().toLowerCase();
                    if (!query) return true;
                    const name =
                      client.clientName || client.tradeName || client.legalName || "";
                    const code = client.clientCode || "";
                    const id = client.idClient ? String(client.idClient) : "";
                    return (
                      name.toLowerCase().includes(query) ||
                      code.toLowerCase().includes(query) ||
                      id.includes(query)
                    );
                  })
                  .slice(0, 100)
                  .map((client) => (
                    <button
                      key={client.idClient ?? client.clientCode ?? client.clientName}
                      className="w-full rounded-md border border-border p-3 text-left hover:bg-accent transition-colors"
                      onClick={() => {
                        updateEventField(
                          "idClient",
                          String(client.idClient ?? "")
                        );
                        setClientSearchOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {client.clientName || client.tradeName || "Cliente"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.clientCode || ""} {client.idClient ? `#${client.idClient}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-primary">Seleccionar</span>
                      </div>
                    </button>
                  ))}

                {clients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay clientes disponibles.
                  </p>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClientSearchOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loadingOptions ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">
              Cargando parametros del formulario...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    general: !prev.general,
                  }))
                }
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Informacion General</CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      openSections.general ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
              {openSections.general && (
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titulo</label>
                    <Input
                      value={eventState.title}
                      onInput={(e) =>
                        updateEventField(
                          "title",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Titulo del evento"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cliente</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        className="flex-1"
                        value={eventState.idClient}
                        onChange={(e) =>
                          updateEventField(
                            "idClient",
                            (e.target as HTMLSelectElement).value
                          )
                        }
                      >
                        <option value="">Selecciona un cliente</option>
                        {clients.map((client) => (
                          <option
                            key={client.idClient}
                            value={String(client.idClient ?? "")}
                          >
                            {client.clientName || client.tradeName || "Cliente"}
                          </option>
                        ))}
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => setClientSearchOpen(true)}
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripcion</label>
                  <Textarea
                    value={eventState.description}
                    onInput={(e) =>
                      updateEventField(
                        "description",
                        (e.target as HTMLTextAreaElement).value
                      )
                    }
                    placeholder="Descripcion del evento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha inicio</label>
                    <DatePicker
                      value={eventState.startDate}
                      onInput={(e) =>
                        updateEventField(
                          "startDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha fin</label>
                    <DatePicker
                      value={eventState.endDate}
                      onInput={(e) =>
                        updateEventField(
                          "endDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Coordinador de cuenta
                    </label>
                    <Select
                      value={eventState.idSalesAgent}
                      onChange={(e) =>
                        updateEventField(
                          "idSalesAgent",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona coordinador</option>
                      {salesAgents.map((agent) => (
                        <option
                          key={agent.idSalesAgent}
                          value={String(agent.idSalesAgent)}
                        >
                          {agent.salesAgentName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Segmento</label>
                    <Select
                      value={eventState.idEventSegment}
                      onChange={(e) => {
                        const value = (e.target as HTMLSelectElement).value;
                        updateEventField("idEventSegment", value);
                        updateEventField("idEventSubsegment", "");
                      }}
                    >
                      <option value="">Selecciona segmento</option>
                      {segmentOptions.map((segment) => (
                        <option key={segment.id} value={segment.id}>
                          {segment.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subsegmento</label>
                    <Select
                      value={eventState.idEventSubsegment}
                      onChange={(e) =>
                        updateEventField(
                          "idEventSubsegment",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                      disabled={!eventState.idEventSegment}
                    >
                      <option value="">
                        {eventState.idEventSegment
                          ? "Selecciona subsegmento"
                          : "Selecciona segmento primero"}
                      </option>
                      {filteredSubsegments.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subtipo</label>
                    <Select
                      value={eventState.idEventSubtype}
                      onChange={(e) =>
                        updateEventField(
                          "idEventSubtype",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona subtipo</option>
                      {subtypes.map((subtype) => (
                        <option
                          key={subtype.idEventSubType}
                          value={String(subtype.idEventSubType)}
                        >
                          {subtype.eventSubTypeName || subtype.eventTypeName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caracter</label>
                    <Select
                      value={eventState.idEventCharacter}
                      onChange={(e) =>
                        updateEventField(
                          "idEventCharacter",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona caracter</option>
                      {characters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sector</label>
                    <Select
                      value={eventState.idEventSector}
                      onChange={(e) =>
                        updateEventField(
                          "idEventSector",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona sector</option>
                      {sectors.map((sector: any) => (
                        <option
                          key={sector.id ?? sector.idEventSector}
                          value={String(sector.id ?? sector.idEventSector)}
                        >
                          {sector.name ?? sector.eventSectorName}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamaño</label>
                    <Select
                      value={eventState.idEventSize}
                      onChange={(e) =>
                        updateEventField(
                          "idEventSize",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona tamaño</option>
                      {sizes.map((size: any) => (
                        <option
                          key={size.id ?? size.idEventSize}
                          value={String(size.id ?? size.idEventSize)}
                        >
                          {size.name ?? size.eventSizeName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Etapa</label>
                    <Select
                      value={eventState.idEventStage}
                      onChange={(e) =>
                        updateEventField(
                          "idEventStage",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona etapa</option>
                      {eventStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Atributos</label>
                    <div className="flex h-10 w-full items-center gap-4 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-slate-600"
                          checked={eventState.sustainable}
                          onChange={(e) =>
                            updateEventField(
                              "sustainable",
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        Evento sostenible
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-slate-600"
                          checked={eventState.icca}
                          onChange={(e) =>
                            updateEventField(
                              "icca",
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        Evento ICCA
                      </label>
                    </div>
                  </div>
                </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    billing: !prev.billing,
                  }))
                }
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Cliente, Contrato y Facturacion</CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      openSections.billing ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
              {openSections.billing && (
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Responsable de la Cuenta
                    </label>
                    <Select
                      value={eventState.idClientEventManager}
                      onChange={(e) =>
                        updateEventField(
                          "idClientEventManager",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona responsable</option>
                      {clientManagers.map((manager) => (
                        <option
                          key={manager.idClientEventManager}
                          value={String(manager.idClientEventManager)}
                        >
                          {manager.clientEventManagerName ||
                            manager.clientEventManagerEmail ||
                            "Responsable"}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Coordinador de evento
                    </label>
                    <Select
                      value={eventState.idEventCoordinator}
                      onChange={(e) =>
                        updateEventField(
                          "idEventCoordinator",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona coordinador</option>
                      {eventCoordinators.map((coord) => (
                        <option key={coord.id} value={coord.id}>
                          {coord.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contrato</label>
                    <Input
                      value={eventState.contractNumber}
                      onInput={(e) =>
                        updateEventField(
                          "contractNumber",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Numero de contrato"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referencia</label>
                    <Input
                      value={eventState.reference}
                      onInput={(e) =>
                        updateEventField(
                          "reference",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Referencia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Nombre de facturacion
                    </label>
                    <Input
                      value={eventState.billingName}
                      onInput={(e) =>
                        updateEventField(
                          "billingName",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Nombre para facturar"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Fecha vencimiento cotizacion
                    </label>
                    <DatePicker
                      value={eventState.quoteExpirationDate}
                      onInput={(e) =>
                        updateEventField(
                          "quoteExpirationDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de pago</label>
                    <Select
                      value={eventState.idEventPaymentForm}
                      onChange={(e) =>
                        updateEventField(
                          "idEventPaymentForm",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona forma de pago</option>
                      {paymentForms.map((form) => (
                        <option
                          key={form.idPaymentForm}
                          value={String(form.idPaymentForm)}
                        >
                          {form.paymentFormName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exencion</label>
                    <Select
                      value={eventState.idExemption}
                      onChange={(e) =>
                        updateEventField(
                          "idExemption",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona exencion</option>
                      {taxExemptions.map((ex) => (
                        <option
                          key={ex.idTaxExemption}
                          value={String(ex.idTaxExemption)}
                        >
                          {ex.taxExemptionName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Propina</label>
                    <Select
                      value={eventState.idExtraTip}
                      onChange={(e) =>
                        (() => {
                          const value = (e.target as HTMLSelectElement).value;
                          updateEventField("idExtraTip", value);
                          if (!value) {
                            updateEventField("extraTipAmount", "");
                          }
                        })()
                      }
                    >
                      <option value="">Selecciona propina</option>
                      {extraTips.map((tip) => (
                        <option
                          key={tip.idExtraTip}
                          value={String(tip.idExtraTip)}
                        >
                          {tip.extraTipName}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Imprevisto</label>
                    <Select
                      value={eventState.idContingency}
                      onChange={(e) =>
                        (() => {
                          const value = (e.target as HTMLSelectElement).value;
                          updateEventField("idContingency", value);
                          if (!value) {
                            updateEventField("contingenciesAmount", "");
                          }
                        })()
                      }
                    >
                      <option value="">Selecciona imprevisto</option>
                      {contingencies.map((cont) => (
                        <option
                          key={cont.idContingency}
                          value={String(cont.idContingency)}
                        >
                          {cont.contingencyName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {eventState.idExtraTip && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto propina</label>
                      <Input
                        type="number"
                        value={eventState.extraTipAmount}
                        onInput={(e) =>
                          updateEventField(
                            "extraTipAmount",
                            (e.target as HTMLInputElement).value
                          )
                        }
                        step="0.01"
                      />
                    </div>
                  )}
                  {eventState.idContingency && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monto imprevisto</label>
                      <Input
                        type="number"
                        value={eventState.contingenciesAmount}
                        onInput={(e) =>
                          updateEventField(
                            "contingenciesAmount",
                            (e.target as HTMLInputElement).value
                          )
                        }
                        step="0.01"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Firma contrato</label>
                    <DatePicker
                      value={eventState.signatureDate}
                      onInput={(e) =>
                        updateEventField(
                          "signatureDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Operador creacion
                    </label>
                    <Input
                      type="number"
                      value={eventState.idCreationOper}
                      onInput={(e) =>
                        updateEventField(
                          "idCreationOper",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={eventState.repetitiveEvent}
                      onChange={(e) =>
                        updateEventField(
                          "repetitiveEvent",
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    Evento repetitivo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={eventState.personalContract}
                      onChange={(e) =>
                        updateEventField(
                          "personalContract",
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    Contrato personal
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={eventState.contractAlreadySigned}
                      onChange={(e) =>
                        updateEventField(
                          "contractAlreadySigned",
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    Contrato firmado
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comentarios</label>
                    <Textarea
                      value={eventState.comments}
                      onInput={(e) =>
                        updateEventField(
                          "comments",
                          (e.target as HTMLTextAreaElement).value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Comentarios internos
                    </label>
                    <Textarea
                      value={eventState.internalComments}
                      onInput={(e) =>
                        updateEventField(
                          "internalComments",
                          (e.target as HTMLTextAreaElement).value
                        )
                      }
                    />
                  </div>
                </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    activities: !prev.activities,
                  }))
                }
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Actividades</CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      openSections.activities ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
              {openSections.activities && (
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Agrega actividades, salones y servicios para el evento.
                    </div>
                    <Button variant="outline" onClick={addActivity}>
                      Agregar actividad
                    </Button>
                  </div>
                {activities.map((activity, activityIndex) => (
                  <Card key={activityIndex} className="border-border/60">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Actividad {activityIndex + 1}
                        </CardTitle>
                        {activities.length > 1 && (
                          <Button
                            variant="outline"
                            onClick={() => removeActivity(activityIndex)}
                          >
                            Quitar actividad
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Titulo</label>
                          <Input
                            value={activity.activityTitle}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "activityTitle",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Estado</label>
                          <Select
                            value={activity.idEventStatus}
                            onChange={(e) =>
                              updateActivity(
                                activityIndex,
                                "idEventStatus",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            <option value="">Selecciona estado</option>
                            {eventStatuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Descripcion
                        </label>
                        <Textarea
                          value={activity.activityDescription}
                          onInput={(e) =>
                            updateActivity(
                              activityIndex,
                              "activityDescription",
                              (e.target as HTMLTextAreaElement).value
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Check-in</label>
                          <Input
                            type="datetime-local"
                            value={activity.checkInTime}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "checkInTime",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Inicio</label>
                          <Input
                            type="datetime-local"
                            value={activity.startTime}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "startTime",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Fin</label>
                          <Input
                            type="datetime-local"
                            value={activity.endTime}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "endTime",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Check-out</label>
                          <Input
                            type="datetime-local"
                            value={activity.checkOutTime}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "checkOutTime",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Descuento</label>
                          <Input
                            type="number"
                            value={activity.discountPercentage}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "discountPercentage",
                                (e.target as HTMLInputElement).value
                              )
                            }
                            min={0}
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Fecha vencimiento
                          </label>
                          <DatePicker
                            value={activity.dueDate}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "dueDate",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cliente</label>
                          <Select
                            value={activity.idClient}
                            onChange={(e) =>
                              updateActivity(
                                activityIndex,
                                "idClient",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            <option value="">Selecciona cliente</option>
                            {clients.map((client) => (
                              <option
                                key={client.idClient}
                                value={String(client.idClient ?? "")}
                              >
                                {client.clientName ||
                                  client.tradeName ||
                                  "Cliente"}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tipo</label>
                          <Select
                            value={activity.idActivityType}
                            onChange={(e) =>
                              updateActivity(
                                activityIndex,
                                "idActivityType",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            <option value="">Selecciona tipo</option>
                            {activityTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Recurso</label>
                          <Select
                            value={activity.idResource}
                            onChange={(e) =>
                              updateActivity(
                                activityIndex,
                                "idResource",
                                (e.target as HTMLSelectElement).value
                              )
                            }
                          >
                            <option value="">Selecciona recurso</option>
                            {resources.map((resource) => (
                              <option
                                key={resource.idResource}
                                value={String(resource.idResource)}
                              >
                                {resource.resourceName}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Operador creacion
                          </label>
                          <Input
                            type="number"
                            value={activity.idCreationOper}
                            onInput={(e) =>
                              updateActivity(
                                activityIndex,
                                "idCreationOper",
                                (e.target as HTMLInputElement).value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Comentarios actividad
                        </label>
                        <Textarea
                          value={activity.activityComments}
                          onInput={(e) =>
                            updateActivity(
                              activityIndex,
                              "activityComments",
                              (e.target as HTMLTextAreaElement).value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">Salones</h3>
                          <Button
                            variant="outline"
                            onClick={() => addRoom(activityIndex)}
                          >
                            Agregar salon
                          </Button>
                        </div>

                        {activity.rooms.map((room, roomIndex) => (
                          <Card
                            key={roomIndex}
                            className="border border-dashed border-border"
                          >
                            <CardContent className="space-y-4 pt-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                  Salon {roomIndex + 1}
                                </h4>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    removeRoom(activityIndex, roomIndex)
                                  }
                                >
                                  Quitar salon
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Salon</label>
                                  <Select
                                    value={room.idRoom}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idRoom",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona salon</option>
                                    {roomOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Montaje</label>
                                  <Select
                                    value={room.idRoomSetup}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idRoomSetup",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona montaje</option>
                                    {roomSetupOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tarifa</label>
                                  <Select
                                    value={room.idRate}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idRate",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona tarifa</option>
                                    {roomRateOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tipo reservacion</label>
                                  <Select
                                    value={room.idReservationType}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idReservationType",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona tipo</option>
                                    {reservationTypes.map((type) => (
                                      <option
                                        key={type.id}
                                        value={String(type.id)}
                                      >
                                        {type.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Uso reservacion</label>
                                  <Select
                                    value={room.idReservationUse}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idReservationUse",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona uso</option>
                                    {reservationUses.map((use) => (
                                      <option
                                        key={use.id}
                                        value={String(use.id)}
                                      >
                                        {use.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Exencion</label>
                                  <Select
                                    value={room.idExemption}
                                    onChange={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idExemption",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona exencion</option>
                                    {taxExemptions.map((ex) => (
                                      <option
                                        key={ex.idTaxExemption}
                                        value={String(ex.idTaxExemption)}
                                      >
                                        {ex.taxExemptionName}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Hora desde</label>
                                  <Input
                                    value={room.hourFrom}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "hourFrom",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    placeholder="HH:MM"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Hora hasta</label>
                                  <Input
                                    value={room.hourTo}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "hourTo",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    placeholder="HH:MM"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Preparacion (min)</label>
                                  <Input
                                    type="number"
                                    value={room.preparationMinutes}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "preparationMinutes",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={0}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Limpieza (min)</label>
                                  <Input
                                    type="number"
                                    value={room.cleaningMinutes}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "cleaningMinutes",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={0}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">PAX estimado</label>
                                  <Input
                                    type="number"
                                    value={room.estimatedPax}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "estimatedPax",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={0}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">PAX real</label>
                                  <Input
                                    type="number"
                                    value={room.realPax}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "realPax",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={0}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Descuento %</label>
                                  <Input
                                    type="number"
                                    value={room.discountPercentage}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "discountPercentage",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={0}
                                    step="0.01"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Id horario</label>
                                  <Input
                                    type="number"
                                    value={room.idSchedule}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idSchedule",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Precio sin impuesto</label>
                                  <Input
                                    type="number"
                                    value={room.priceTNI}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "priceTNI",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.0001"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Precio con impuesto</label>
                                  <Input
                                    type="number"
                                    value={room.priceTI}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "priceTI",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.0001"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Operador</label>
                                  <Input
                                    type="number"
                                    value={room.idCreationOper}
                                    onInput={(e) =>
                                      updateRoom(
                                        activityIndex,
                                        roomIndex,
                                        "idCreationOper",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Descripcion horario</label>
                                <Input
                                  value={room.scheduleDescription}
                                  onInput={(e) =>
                                    updateRoom(
                                      activityIndex,
                                      roomIndex,
                                      "scheduleDescription",
                                      (e.target as HTMLInputElement).value
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Comentarios del salon</label>
                                <Textarea
                                  value={room.roomComments}
                                  onInput={(e) =>
                                    updateRoom(
                                      activityIndex,
                                      roomIndex,
                                      "roomComments",
                                      (e.target as HTMLTextAreaElement).value
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">Servicios</h3>
                          <Button
                            variant="outline"
                            onClick={() => addService(activityIndex)}
                          >
                            Agregar servicio
                          </Button>
                        </div>

                        {activity.services.map((service, serviceIndex) => (
                          <Card
                            key={serviceIndex}
                            className="border border-dashed border-border"
                          >
                            <CardContent className="space-y-4 pt-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                  Servicio {serviceIndex + 1}
                                </h4>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    removeService(activityIndex, serviceIndex)
                                  }
                                >
                                  Quitar servicio
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Servicio</label>
                                  <Select
                                    value={service.idService}
                                    onChange={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idService",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona servicio</option>
                                    {serviceOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Cantidad</label>
                                  <Input
                                    type="number"
                                    value={service.quantity}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "quantity",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    min={1}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Salon asociado</label>
                                  <Select
                                    value={service.idActivityRoomIndex}
                                    onChange={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idActivityRoomIndex",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Sin salon</option>
                                    {activity.rooms.map((room, idx) => {
                                      const label = roomOptions.find(
                                        (option) => option.value === room.idRoom
                                      )?.label;
                                      return (
                                        <option key={idx} value={String(idx)}>
                                          {label ? label : `Salon ${idx + 1}`}
                                        </option>
                                      );
                                    })}
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tipo reservacion</label>
                                  <Select
                                    value={service.idReservationType}
                                    onChange={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idReservationType",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona tipo</option>
                                    {reservationTypes.map((type) => (
                                      <option
                                        key={type.id}
                                        value={String(type.id)}
                                      >
                                        {type.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Uso reservacion</label>
                                  <Select
                                    value={service.idReservationUse}
                                    onChange={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idReservationUse",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona uso</option>
                                    {reservationUses.map((use) => (
                                      <option
                                        key={use.id}
                                        value={String(use.id)}
                                      >
                                        {use.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Paquete</label>
                                  <Select
                                    value={service.idActivityPackage}
                                    onChange={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idActivityPackage",
                                        (e.target as HTMLSelectElement).value
                                      )
                                    }
                                  >
                                    <option value="">Selecciona paquete</option>
                                    {activityPackages.map((pkg) => (
                                      <option
                                        key={pkg.idActivityPackage}
                                        value={String(pkg.idActivityPackage)}
                                      >
                                        {pkg.activityPackageName}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Hora desde</label>
                                  <Input
                                    value={service.hourFrom}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "hourFrom",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    placeholder="HH:MM"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Hora hasta</label>
                                  <Input
                                    value={service.hourTo}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "hourTo",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    placeholder="HH:MM"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Precio sin impuesto</label>
                                  <Input
                                    type="number"
                                    value={service.priceTNI}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "priceTNI",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.0001"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Precio con impuesto</label>
                                  <Input
                                    type="number"
                                    value={service.priceTI}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "priceTI",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.0001"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Costo</label>
                                  <Input
                                    type="number"
                                    value={service.costPrice}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "costPrice",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.0001"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Descuento</label>
                                  <Input
                                    type="number"
                                    value={service.discountPercentage}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "discountPercentage",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                    step="0.01"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Id horario</label>
                                  <Input
                                    type="number"
                                    value={service.idSchedule}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idSchedule",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Operador</label>
                                  <Input
                                    type="number"
                                    value={service.idCreationOper}
                                    onInput={(e) =>
                                      updateService(
                                        activityIndex,
                                        serviceIndex,
                                        "idCreationOper",
                                        (e.target as HTMLInputElement).value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Descripcion horario</label>
                                <Input
                                  value={service.scheduleDescription}
                                  onInput={(e) =>
                                    updateService(
                                      activityIndex,
                                      serviceIndex,
                                      "scheduleDescription",
                                      (e.target as HTMLInputElement).value
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Comentarios servicio</label>
                                <Textarea
                                  value={service.serviceComments}
                                  onInput={(e) =>
                                    updateService(
                                      activityIndex,
                                      serviceIndex,
                                      "serviceComments",
                                      (e.target as HTMLTextAreaElement).value
                                    )
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </CardContent>
              )}
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => route("/eventos")}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Spinner size="sm" className="border-t-white border-white/30" />
                ) : (
                  "Crear evento"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
