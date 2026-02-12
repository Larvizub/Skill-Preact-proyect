import { useState, useEffect, useMemo } from "preact/hooks";
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
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { DatePicker } from "../components/ui/datepicker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { apiService } from "../services/api.service";
import type { Event } from "../services/api.service";
import type {
  Client,
  ClientEventManager,
  Contingency,
  EventMarketSubSegment,
  EventPaymentForm,
  EventSector,
  EventSize,
  EventSubType,
  ExtraTip,
  MarketSegment,
  SalesAgent,
  TaxExemption,
} from "../services/api.service";
import {
  getEventStatusText,
  classifyEventStatus,
  isItemCancelled,
  getEventStatusColor,
} from "../lib/eventStatus";
import { formatDateLocal } from "../lib/dateUtils";
import { calculateItemAmounts } from "../lib/quoteUtils";
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
  ShieldCheck,
  Leaf,
  Search,
} from "lucide-preact";

interface EventoDetalleProps {
  eventNumber?: string;
  id?: string;
}

interface EditEventState {
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
  idEventType: string;
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

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  return value;
};

export function EventoDetalle({ eventNumber, id }: EventoDetalleProps) {
  const eventIdentifier = eventNumber ?? id ?? null;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cotizacionExpanded, setCotizacionExpanded] = useState(false);
  const [actividadesExpanded, setActividadesExpanded] = useState(false);
  const [salonesExpanded, setSalonesExpanded] = useState(false);
  const [serviciosExpanded, setServiciosExpanded] = useState(false);
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [quoteData, setQuoteData] = useState<any | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<EditEventState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editOptionsLoaded, setEditOptionsLoaded] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [managerSearchOpen, setManagerSearchOpen] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [subsegments, setSubsegments] = useState<EventMarketSubSegment[]>([]);
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [subtypes, setSubtypes] = useState<EventSubType[]>([]);
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>(
    []
  );
  const [sectors, setSectors] = useState<EventSector[]>([]);
  const [sizes, setSizes] = useState<EventSize[]>([]);
  const [paymentForms, setPaymentForms] = useState<EventPaymentForm[]>([]);
  const [taxExemptions, setTaxExemptions] = useState<TaxExemption[]>([]);
  const [extraTips, setExtraTips] = useState<ExtraTip[]>([]);
  const [contingencies, setContingencies] = useState<Contingency[]>([]);
  const [clientManagers, setClientManagers] = useState<ClientEventManager[]>(
    []
  );
  // Countdown state for quotes older than 1 month
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

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

  // Effect: when event loads, and its status is one of the monitored statuses,
  // start a 1s interval updating the remaining time towards creationDate + 1 month
  useEffect(() => {
    if (!event) {
      setCountdownActive(false);
      setTimeLeftMs(null);
      setDeadlineDate(null);
      return;
    }

    // Use internal classification ids to avoid mismatches on spelling/accents
    const monitoredCategories = ["opcion1", "opcion2", "opcion3"];

    const eventCategory = classifyEventStatus(event);

    // Helper to safely parse creation date
    const creationRaw =
      (event as any)?.creationDate ?? (event as any)?.CreationDate ?? null;
    const creationDate = creationRaw ? new Date(creationRaw) : null;

    if (!creationDate) {
      setCountdownActive(false);
      setTimeLeftMs(null);
      setDeadlineDate(null);
      return;
    }

    if (!monitoredCategories.includes(eventCategory)) {
      setCountdownActive(false);
      setTimeLeftMs(null);
      setDeadlineDate(null);
      return;
    }

    // Add one calendar month to creationDate
    const addOneMonth = (d: Date) => {
      const copy = new Date(d.getTime());
      const targetMonth = copy.getMonth() + 1;
      copy.setMonth(targetMonth);
      // if date rolled over (e.g., Jan 31 -> Mar 3), keep behavior as Date.setMonth does
      return copy;
    };

    const deadline = addOneMonth(creationDate);
    setDeadlineDate(deadline);

    setCountdownActive(true);

    const update = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      setTimeLeftMs(diff);
    };

    update();
    const idInterval = window.setInterval(update, 1000);
    return () => {
      window.clearInterval(idInterval);
      setCountdownActive(false);
      setDeadlineDate(null);
    };
  }, [event]);

  // Cargar la cotización detallada (para descuentos/impuestos) cuando tengamos el evento
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        if (!event) return;
        const id =
          (event as any)?.idEvent ?? (event as any)?.eventId ?? eventIdentifier;
        if (!id) return;

        setQuoteLoading(true);
        const quote = await apiService.getEventQuote(String(id));
        setQuoteData(quote);
      } catch (error) {
        console.error("Error cargando cotización del evento:", error);
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, [event, eventIdentifier]);

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

  const buildEditState = (raw: any): EditEventState => ({
    title: String(raw?.title ?? ""),
    description: String(raw?.description ?? ""),
    startDate: normalizeDateInput(raw?.startDate),
    endDate: normalizeDateInput(raw?.endDate),
    idClient: String(raw?.idClient ?? raw?.client?.idClient ?? ""),
    idCurrency: String(raw?.idCurrency ?? raw?.currency?.idCurrency ?? "3"),
    discountPercentage: String(raw?.discountPercentage ?? ""),
    idSalesAgent: String(raw?.idSalesAgent ?? raw?.salesAgent?.idSalesAgent ?? ""),
    idEventSubsegment: String(
      raw?.idEventSubsegment ??
        raw?.idEventSubSegment ??
        raw?.idEventMarketSubSegment ??
        raw?.marketSubSegment?.idMarketSubSegment ??
        raw?.eventMarketSubSegment?.idMarketSubSegment ??
        raw?.eventMarketSubSegment?.idEventMarketSubSegment ??
        raw?.idMarketSubSegment ??
        ""
    ),
    idEventSegment: String(
      raw?.idEventSegment ??
        raw?.marketSegment?.idMarketSegment ??
        raw?.eventMarketSegment?.idMarketSegment ??
        raw?.idMarketSegment ??
        ""
    ),
    idEventType: String(raw?.idEventType ?? raw?.eventType?.idEventType ?? ""),
    idEventSubtype: String(
      raw?.idEventSubtype ??
        raw?.idEventSubType ??
        raw?.eventSubtype?.idEventSubtype ??
        raw?.eventSubType?.idEventSubType ??
        raw?.eventSubType?.idSubType ??
        ""
    ),
    idEventCharacter: String(
      raw?.idEventCharacter ?? raw?.eventCharacter?.idEventCharacter ?? ""
    ),
    idEventSector: String(raw?.idEventSector ?? raw?.eventSector?.idEventSector ?? ""),
    idEventSize: String(raw?.idEventSize ?? raw?.eventSize?.idEventSize ?? ""),
    idEventPaymentForm: String(
      raw?.idEventPaymentForm ??
        raw?.idPaymentForm ??
        raw?.eventPaymentForm?.idEventPaymentForm ??
        raw?.eventPaymentForm?.idPaymentForm ??
        raw?.paymentForm?.idPaymentForm ??
        ""
    ),
    idClientEventManager: String(
      raw?.idClientEventManager ?? raw?.clientEventManager?.idClientEventManager ?? ""
    ),
    idEventCoordinator: String(
      raw?.idEventCoordinator ?? raw?.eventCoordinator?.idEventCoordinator ?? ""
    ),
    repetitiveEvent: Boolean(raw?.repetitiveEvent),
    estimatedPax: String(raw?.estimatedPax ?? "0"),
    realPax: String(raw?.realPax ?? "0"),
    contractNumber: String(raw?.contractNumber ?? ""),
    reference: String(raw?.reference ?? ""),
    comments: String(raw?.comments ?? ""),
    internalComments: String(raw?.internalComments ?? ""),
    idExemption: String(raw?.idExemption ?? raw?.taxExemption?.idTaxExemption ?? ""),
    idExtraTip: String(raw?.idExtraTip ?? raw?.extraTip?.idExtraTip ?? ""),
    extraTipAmount: String(raw?.extraTipAmount ?? ""),
    idContingency: String(raw?.idContingency ?? raw?.contingency?.idContingency ?? ""),
    contingenciesAmount: String(raw?.contingenciesAmount ?? ""),
    personalContract: Boolean(raw?.personalContract),
    contractAlreadySigned: Boolean(raw?.contractAlreadySigned),
    signatureDate: normalizeDateInput(raw?.signatureDate),
    billingName: String(raw?.billingName ?? ""),
    quoteExpirationDate: normalizeDateInput(raw?.quoteExpirationDate),
    standsQuantity: String(raw?.standsQuantity ?? ""),
    idCreationOper: String(raw?.idCreationOper ?? ""),
    idEventStage: String(raw?.idEventStage ?? ""),
    sustainable: Boolean(raw?.sustainable),
    icca: Boolean(raw?.icca),
  });

  const updateEditField = (
    field: keyof EditEventState,
    value: string | boolean
  ) => {
    setEditState((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  const loadEditOptions = async () => {
    setEditLoading(true);
    setEditError(null);

    const safeLoad = async <T,>(
      label: string,
      loader: () => Promise<T>,
      fallback: T
    ): Promise<T> => {
      try {
        const timeoutPromise = new Promise<T>((_resolve, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        );
        return await Promise.race([loader(), timeoutPromise]);
      } catch (err) {
        console.warn(`loadOptions: ${label} fallo`, err);
        return fallback;
      }
    };

    try {
      const [
        clientData,
        salesData,
        segmentData,
        subsegmentData,
        eventTypeData,
        subtypeData,
        characterData,
        sectorData,
        sizeData,
        paymentData,
        taxData,
        extraTipData,
        contingencyData,
      ] = await Promise.all([
        safeLoad("clients", () => apiService.getClients(), []),
        safeLoad("salesAgents", () => apiService.getSalesAgents(), []),
        safeLoad(
          "eventMarketSegments",
          () => apiService.getEventMarketSegments(),
          []
        ),
        safeLoad(
          "eventMarketSubSegments",
          () => apiService.getEventMarketSubSegments(),
          []
        ),
        safeLoad("eventTypes", () => apiService.getEventTypes(), []),
        safeLoad("eventSubTypes", () => apiService.getEventSubTypes(), []),
        safeLoad("eventCharacters", () => apiService.getEventCharacters(), []),
        safeLoad("eventSectors", () => apiService.getEventSectors(), []),
        safeLoad("eventSizes", () => apiService.getEventSizes(), []),
        safeLoad(
          "eventPaymentForms",
          () => apiService.getEventPaymentForms(),
          []
        ),
        safeLoad("taxExemptions", () => apiService.getTaxExemptions(), []),
        safeLoad("extraTips", () => apiService.getExtraTips(), []),
        safeLoad("contingencies", () => apiService.getContingencies(), []),
      ]);

      const derivedSubsegments = (segmentData || []).flatMap((segment: any) =>
        (segment.marketSubSegments || segment.eventMarketSubSegments || []).map(
          (sub: any) => ({
            ...sub,
            idMarketSegment:
              sub.idMarketSegment ??
              segment.idMarketSegment ??
              segment.idEventMarketSegment ??
              segment.id,
            marketSegmentName:
              sub.marketSegmentName ??
              segment.marketSegmentName ??
              segment.eventMarketSegmentName ??
              segment.name,
          })
        )
      );

      setClients(clientData || []);
      setSalesAgents(salesData || []);
      setEventTypes(eventTypeData || []);
      setSegments(segmentData || []);
      setSubsegments(
        derivedSubsegments.length > 0
          ? derivedSubsegments
          : subsegmentData || []
      );
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
      setTaxExemptions(taxData || []);
      setExtraTips(extraTipData || []);
      setContingencies(contingencyData || []);
      setEditOptionsLoaded(true);
    } catch (err) {
      console.error("Error cargando opciones del formulario:", err);
      setEditError(
        "No se pudieron cargar los datos de referencia. Verifica la conexion e intenta nuevamente."
      );
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      setEditState(buildEditState(event as any));
    }
  }, [event]);

  useEffect(() => {
    if ((editOpen || event) && !editOptionsLoaded && !editLoading) {
      loadEditOptions();
    }
  }, [editOpen, event, editOptionsLoaded, editLoading]);

  useEffect(() => {
    const idClientNumber = toNumberOrNull(editState?.idClient ?? "");
    if (!idClientNumber) {
      setClientManagers([]);
      return;
    }

    let isMounted = true;
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
  }, [editState?.idClient]);

  const sizeIdByLabel = useMemo(() => {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^A-Za-z0-9]+/g, "")
        .toUpperCase()
        .trim();

    const resolveSizeCode = (raw: string) => {
      const name = normalize(raw);
      if (!name) return "";
      if (
        name.includes("XS") ||
        name.includes("XSMALL") ||
        name.includes("EXTRASMALL") ||
        name.includes("EXTRAPEQUENO") ||
        name.includes("EXTRAPEQUEN")
      )
        return "XS";
      if (
        name.includes("XL") ||
        name.includes("XLARGE") ||
        name.includes("EXTRALARGE") ||
        name.includes("EXTRAGRANDE")
      )
        return "XL";
      if (
        name.includes("SMALL") ||
        name.includes("PEQUENO") ||
        name.includes("PEQUEN")
      )
        return "S";
      if (name.includes("MEDIUM") || name.includes("MEDIANO")) return "M";
      if (name.includes("LARGE") || name.includes("GRANDE")) return "L";
      if (name === "S" || name === "M" || name === "L") return name;
      return "";
    };

    const map = new Map<string, string>();
    sizes.forEach((size: any) => {
      const id = String(size.id ?? size.idEventSize ?? "");
      const name = String(size.name ?? size.eventSizeName ?? "");
      const code = resolveSizeCode(name);
      if (id && code) {
        map.set(code, id);
      }
    });
    return map;
  }, [sizes]);

  const sizeRanges = useMemo(() => {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toUpperCase();

    return sizes
      .map((size: any) => {
        const id = String(size.id ?? size.idEventSize ?? "");
        const name = String(size.name ?? size.eventSizeName ?? "");
        if (!id || !name) return null;

        const raw = normalize(name);
        const numbers = raw.match(/\d+/g)?.map(Number) || [];
        const hasPlus =
          raw.includes("+") ||
          raw.includes("MAS") ||
          raw.includes("ADELANTE") ||
          raw.includes("MAYOR") ||
          raw.includes("DESDE") ||
          raw.includes("MINIMO");
        const hasUpperBound =
          raw.includes("HASTA") ||
          raw.includes("MENOS") ||
          raw.includes("MAX") ||
          raw.includes("MAXIMO");

        if (numbers.length >= 2) {
          const min = Math.min(numbers[0], numbers[1]);
          const max = Math.max(numbers[0], numbers[1]);
          return { id, min, max };
        }

        if (numbers.length === 1 && hasUpperBound) {
          return { id, min: 0, max: numbers[0] };
        }

        if (numbers.length === 1 && hasPlus) {
          return { id, min: numbers[0], max: Number.POSITIVE_INFINITY };
        }

        return null;
      })
      .filter((entry): entry is { id: string; min: number; max: number } =>
        Boolean(entry)
      );
  }, [sizes]);

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

  const eventTypeOptions = useMemo(() => {
    const normalized = (eventTypes || [])
      .map((type: any) => ({
        id: String(type.idEventType ?? type.id ?? ""),
        name: type.eventTypeName ?? type.name ?? "",
      }))
      .filter((type) => type.id && type.name.trim().length > 0);

    if (normalized.length > 0) return normalized;

    const derived = new Map<string, string>();
    (subtypes || []).forEach((sub: any) => {
      const id = String(sub.idEventType ?? sub.eventTypeId ?? "");
      const name = sub.eventTypeName ?? "";
      if (id && name && !derived.has(id)) {
        derived.set(id, name);
      }
    });

    return Array.from(derived.entries()).map(([id, name]) => ({ id, name }));
  }, [eventTypes, subtypes]);

  const subtypeOptions = useMemo(() => {
    return (subtypes || [])
      .map((sub: any) => ({
        id: String(sub.idEventSubType ?? sub.id ?? ""),
        name: sub.eventSubTypeName ?? sub.eventTypeName ?? sub.name ?? "",
        typeId: String(sub.idEventType ?? sub.eventTypeId ?? ""),
        subsegmentId: String(
          sub.idMarketSubSegment ??
            sub.idEventMarketSubSegment ??
            sub.idEventSubsegment ??
            sub.idEventSubSegment ??
            sub.subSegmentId ??
            ""
        ),
      }))
      .filter((sub) => sub.id && sub.name.trim().length > 0);
  }, [subtypes]);

  useEffect(() => {
    if (!event || !editOptionsLoaded) return;
    const raw = event as any;
    const eventSubtype = raw?.eventSubtype ?? raw?.eventSubType ?? null;
    if (!eventSubtype) return;

    const idRaw =
      eventSubtype.idEventSubtype ??
      eventSubtype.idEventSubType ??
      eventSubtype.idSubType ??
      "";
    const idNumber = Number(idRaw);
    const id = Number.isFinite(idNumber) ? idNumber : null;
    const name =
      eventSubtype.eventSubTypeName ??
      eventSubtype.eventSubtypeName ??
      eventSubtype.name ??
      "";
    if (!id || !name) return;

    const updates: Partial<EditEventState> = {};
    if (!editState?.idEventSubtype) {
      updates.idEventSubtype = String(id);
    }
    if (!editState?.idEventType) {
      const typeId =
        eventSubtype.idEventType ?? eventSubtype.eventTypeId ?? null;
      if (typeId) updates.idEventType = String(typeId);
    }

    setSubtypes((prev) => {
      const exists = prev.some(
        (item: any) => Number(item.idEventSubType ?? item.id ?? 0) === id
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          idEventSubType: id,
          eventSubTypeName: name,
          idEventType: eventSubtype.idEventType ?? eventSubtype.eventTypeId ?? undefined,
          idMarketSubSegment:
            eventSubtype.idMarketSubSegment ??
            eventSubtype.idEventMarketSubSegment ??
            eventSubtype.idEventSubsegment ??
            eventSubtype.idEventSubSegment ??
            undefined,
        },
      ];
    });

    if (Object.keys(updates).length > 0) {
      setEditState((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  }, [event, editOptionsLoaded, editState]);

  useEffect(() => {
    if (!editOptionsLoaded || !event || !editState) return;

    const raw = event as any;
    const updates: Partial<EditEventState> = {};

    const normalizeLookup = (value?: string | null) =>
      (value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^A-Za-z0-9]+/g, " ")
        .trim()
        .toUpperCase();

    const findIdByName = (
      list: Array<{ id: string; name: string }>,
      name?: string | null
    ) => {
      const target = normalizeLookup(name);
      if (!target) return "";
      return list.find((item) => normalizeLookup(item.name) === target)?.id ?? "";
    };

    if (!editState.idEventSegment) {
      const segmentName =
        raw?.marketSegmentName ??
        raw?.eventMarketSegmentName ??
        raw?.marketSegment?.marketSegmentName ??
        raw?.eventMarketSegment?.marketSegmentName ??
        null;
      const segmentId = findIdByName(segmentOptions, segmentName);
      if (segmentId) updates.idEventSegment = segmentId;
    }

    if (!editState.idEventSubsegment) {
      const subsegmentName =
        raw?.marketSubSegmentName ??
        raw?.eventMarketSubSegmentName ??
        raw?.marketSubSegment?.marketSubSegmentName ??
        raw?.eventMarketSubSegment?.marketSubSegmentName ??
        null;
      const subsegmentId = findIdByName(subsegmentOptions, subsegmentName);
      if (subsegmentId) updates.idEventSubsegment = subsegmentId;
    }

    if (!editState.idEventType) {
      const typeName =
        raw?.eventTypeName ??
        raw?.eventType?.eventTypeName ??
        raw?.eventType?.name ??
        null;
      const typeId = findIdByName(eventTypeOptions, typeName);
      if (typeId) updates.idEventType = typeId;
    }

    if (!editState.idEventSubtype) {
      const subtypeName =
        raw?.eventSubTypeName ??
        raw?.eventSubtypeName ??
        raw?.eventSubType?.eventSubTypeName ??
        raw?.eventSubType?.name ??
        null;
      const subtypeId = findIdByName(subtypeOptions, subtypeName);
      if (subtypeId) updates.idEventSubtype = subtypeId;
    }

    if (!editState.idEventPaymentForm) {
      const paymentName =
        raw?.paymentFormName ??
        raw?.eventPaymentFormName ??
        raw?.eventPaymentFormDescription ??
        raw?.paymentFormDescription ??
        raw?.paymentForm?.paymentFormName ??
        null;
      const paymentId =
        paymentForms.find(
          (form) =>
            normalizeLookup(form.paymentFormName) === normalizeLookup(paymentName)
        )?.idPaymentForm ?? null;
      if (paymentId) updates.idEventPaymentForm = String(paymentId);
    }

    if (Object.keys(updates).length > 0) {
      setEditState((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  }, [
    editOptionsLoaded,
    event,
    editState,
    segmentOptions,
    subsegmentOptions,
    eventTypeOptions,
    subtypeOptions,
    paymentForms,
  ]);

  const hasSegmentMapping = useMemo(
    () =>
      subsegmentOptions.some(
        (sub) => sub.segmentId && sub.segmentId.trim().length > 0
      ),
    [subsegmentOptions]
  );

  const hasTypeMapping = useMemo(
    () => subtypeOptions.some((sub) => sub.typeId && sub.typeId.trim().length > 0),
    [subtypeOptions]
  );

  const filteredSubsegments = useMemo(() => {
    if (!editState?.idEventSegment) {
      if (editState?.idEventSubsegment) return subsegmentOptions;
      return hasSegmentMapping ? [] : subsegmentOptions;
    }

    if (!hasSegmentMapping) return subsegmentOptions;

    return subsegmentOptions.filter(
      (sub) =>
        sub.segmentId === editState.idEventSegment ||
        !sub.segmentId ||
        sub.segmentId.trim().length === 0
    );
  }, [editState?.idEventSegment, subsegmentOptions, hasSegmentMapping]);

  const filteredSubtypes = useMemo(() => {
    if (!editState?.idEventType) {
      if (editState?.idEventSubtype) return subtypeOptions;
      return hasTypeMapping ? [] : subtypeOptions;
    }

    if (!hasTypeMapping) return subtypeOptions;

    return subtypeOptions.filter(
      (sub) =>
        sub.typeId === editState.idEventType ||
        !sub.typeId ||
        sub.typeId.trim().length === 0
    );
  }, [editState?.idEventType, subtypeOptions, hasTypeMapping]);

  useEffect(() => {
    if (!editState?.idEventSegment) {
      if (editState?.idEventSubsegment && hasSegmentMapping) {
        updateEditField("idEventSubsegment", "");
      }
      return;
    }

    const stillValid = filteredSubsegments.some(
      (sub) => sub.id === editState.idEventSubsegment
    );
    if (!stillValid && editState?.idEventSubsegment) {
      updateEditField("idEventSubsegment", "");
    }
  }, [
    editState?.idEventSegment,
    editState?.idEventSubsegment,
    filteredSubsegments,
    hasSegmentMapping,
  ]);

  useEffect(() => {
    if (!editState?.idEventType) {
      if (editState?.idEventSubtype && hasTypeMapping) {
        updateEditField("idEventSubtype", "");
      }
      return;
    }

    const stillValid = filteredSubtypes.some(
      (sub) => sub.id === editState.idEventSubtype
    );
    if (!stillValid && editState?.idEventSubtype) {
      updateEditField("idEventSubtype", "");
    }
  }, [
    editState?.idEventType,
    editState?.idEventSubtype,
    filteredSubtypes,
    hasTypeMapping,
  ]);

  useEffect(() => {
    const paxValue = Number(editState?.estimatedPax ?? "");
    if (Number.isNaN(paxValue) || !editState) return;

    let sizeLabel = "";
    if (paxValue >= 0 && paxValue <= 100) sizeLabel = "XS";
    else if (paxValue >= 101 && paxValue <= 500) sizeLabel = "S";
    else if (paxValue >= 501 && paxValue <= 1500) sizeLabel = "M";
    else if (paxValue >= 1501 && paxValue <= 2500) sizeLabel = "L";
    else if (paxValue >= 2501) sizeLabel = "XL";

    let sizeId = sizeIdByLabel.get(sizeLabel) || "";
    if (!sizeId && sizeRanges.length > 0) {
      const match = sizeRanges.find(
        (range) => paxValue >= range.min && paxValue <= range.max
      );
      sizeId = match?.id || "";
    }
    if (sizeId && sizeId !== editState.idEventSize) {
      updateEditField("idEventSize", sizeId);
    }
  }, [editState?.estimatedPax, editState?.idEventSize, sizeIdByLabel, sizeRanges]);

  const handleUpdateEvent = async () => {
    if (!editState) return;
    setEditError(null);
    setEditSuccess(null);

    const eventNumberValue = Number(
      (event as any)?.eventNumber ?? eventIdentifier ?? 0
    );
    if (!eventNumberValue) {
      setEditError("No se pudo determinar el numero del evento.");
      return;
    }

    setEditSaving(true);

    try {
      const eventPayload = {
        idEvent: toNumberOrNull(String((event as any)?.idEvent ?? "")),
        title: editState.title.trim(),
        description: toStringOrNull(editState.description),
        startDate: editState.startDate,
        endDate: editState.endDate,
        idClient: toNumberOrNull(editState.idClient),
        idCurrency: toNumberOrNull(editState.idCurrency) ?? 3,
        discountPercentage: toNumberOrNull(editState.discountPercentage),
        idSalesAgent: toNumberOrNull(editState.idSalesAgent),
        idEventSubsegment: toNumberOrNull(editState.idEventSubsegment),
        idEventType: toNumberOrNull(editState.idEventType),
        idEventSubtype: toNumberOrNull(editState.idEventSubtype),
        idEventCharacter: toNumberOrNull(editState.idEventCharacter),
        idEventSector: toNumberOrNull(editState.idEventSector),
        idEventSize: toNumberOrNull(editState.idEventSize),
        idEventPaymentForm: toNumberOrNull(editState.idEventPaymentForm),
        idClientEventManager: toNumberOrNull(editState.idClientEventManager),
        idEventCoordinator: toNumberOrNull(editState.idEventCoordinator),
        repetitiveEvent: editState.repetitiveEvent,
        estimatedPax: toNumberOrNull(editState.estimatedPax) ?? 0,
        realPax: toNumberOrNull(editState.realPax) ?? 0,
        contractNumber: toStringOrNull(editState.contractNumber),
        reference: toStringOrNull(editState.reference),
        comments: toStringOrNull(editState.comments),
        internalComments: toStringOrNull(editState.internalComments),
        idExemption: toNumberOrNull(editState.idExemption),
        idExtraTip: toNumberOrNull(editState.idExtraTip),
        extraTipAmount: toNumberOrNull(editState.extraTipAmount),
        idContingency: toNumberOrNull(editState.idContingency),
        contingenciesAmount: toNumberOrNull(editState.contingenciesAmount),
        personalContract: editState.personalContract,
        contractAlreadySigned: editState.contractAlreadySigned,
        signatureDate: toStringOrNull(editState.signatureDate),
        billingName: toStringOrNull(editState.billingName),
        quoteExpirationDate: toStringOrNull(editState.quoteExpirationDate),
        standsQuantity: toNumberOrNull(editState.standsQuantity),
        idCreationOper: toNumberOrNull(editState.idCreationOper),
        idEventStage: toNumberOrNull(editState.idEventStage),
        sustainable: editState.sustainable,
        icca: editState.icca,
      };

      await apiService.updateEvent(eventNumberValue, eventPayload);
      setEditSuccess("Evento actualizado correctamente.");
      sessionStorage.removeItem("currentEvent");
      await loadEventDetails(String(eventNumberValue));
    } catch (err) {
      console.error("Error actualizando evento:", err);
      setEditError(
        err instanceof Error ? err.message : "No se pudo actualizar el evento."
      );
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
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
    rawEvent?.marketSubsegmentName ??
    rawEvent?.marketSubSegment?.marketSubSegmentName ??
    rawEvent?.eventMarketSubSegmentName ??
    rawEvent?.eventMarketSubsegmentName ??
    rawEvent?.eventMarketSubSegment?.marketSubSegmentName ??
    rawEvent?.marketSubSegment?.name ??
    null;
  const eventTypeName =
    rawEvent?.eventType?.eventTypeName ??
    rawEvent?.eventTypeName ??
    rawEvent?.eventType?.name ??
    null;
  const eventSubtypeName =
    rawEvent?.eventSubType?.eventSubTypeName ??
    rawEvent?.eventSubtype?.eventSubTypeName ??
    rawEvent?.eventSubtype?.eventSubtypeName ??
    rawEvent?.eventSubtype?.name ??
    rawEvent?.eventSubtypeName ??
    rawEvent?.eventSubTypeName ??
    rawEvent?.eventSubType?.eventSubtypeName ??
    rawEvent?.eventSubType?.name ??
    null;
  const eventCharacterName =
    rawEvent?.eventCharacter?.eventCharacterName ??
    rawEvent?.eventCharacterName ??
    rawEvent?.eventCharacter?.name ??
    null;
  const eventSectorName =
    rawEvent?.eventSector?.eventSectorName ??
    rawEvent?.eventSectorName ??
    rawEvent?.eventSector?.name ??
    null;
  const eventSizeName =
    rawEvent?.eventSizeName ??
    rawEvent?.eventSize?.eventSizeName ??
    rawEvent?.eventSize?.name ??
    rawEvent?.size?.eventSizeName ??
    null;
  const paymentFormName =
    rawEvent?.paymentForm?.paymentFormName ??
    rawEvent?.paymentFormName ??
    rawEvent?.eventPaymentFormName ??
    rawEvent?.eventPaymentFormDescription ??
    rawEvent?.paymentFormDescription ??
    rawEvent?.paymentForm?.paymentFormDescription ??
    null;

  const normalizeLookup = (value?: string | null) =>
    (value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();

  const findById = (list: Array<{ id: string; name: string }>, id?: string) => {
    if (!id) return null;
    return list.find((item) => item.id === id) ?? null;
  };

  const findByName = (
    list: Array<{ id: string; name: string }>,
    name?: string | null
  ) => {
    const target = normalizeLookup(name);
    if (!target) return null;
    return (
      list.find((item) => normalizeLookup(item.name) === target) ?? null
    );
  };

  const fallbackSegmentName =
    marketSegmentName ||
    findById(segmentOptions, String(rawEvent?.idEventSegment ?? ""))?.name ||
    findById(segmentOptions, String(rawEvent?.idMarketSegment ?? ""))?.name ||
    findByName(segmentOptions, rawEvent?.marketSegmentName)?.name ||
    null;
  const fallbackSubsegmentName =
    marketSubSegmentName ||
    findById(subsegmentOptions, String(rawEvent?.idEventSubsegment ?? ""))?.name ||
    findById(subsegmentOptions, String(rawEvent?.idEventSubSegment ?? ""))?.name ||
    findById(subsegmentOptions, String(rawEvent?.idEventMarketSubSegment ?? ""))?.name ||
    findById(subsegmentOptions, String(rawEvent?.idMarketSubSegment ?? ""))?.name ||
    findByName(subsegmentOptions, rawEvent?.marketSubSegmentName)?.name ||
    findByName(subsegmentOptions, rawEvent?.eventMarketSubSegmentName)?.name ||
    null;
  const fallbackEventTypeName =
    eventTypeName ||
    findById(eventTypeOptions, String(rawEvent?.idEventType ?? ""))?.name ||
    findByName(eventTypeOptions, rawEvent?.eventTypeName)?.name ||
    null;
  const fallbackEventSubtypeName =
    eventSubtypeName ||
    findById(subtypeOptions, String(rawEvent?.idEventSubtype ?? ""))?.name ||
    findById(subtypeOptions, String(rawEvent?.idEventSubType ?? ""))?.name ||
    findById(subtypeOptions, String(rawEvent?.eventSubtype?.idEventSubtype ?? ""))?.name ||
    findByName(subtypeOptions, rawEvent?.eventSubTypeName)?.name ||
    findByName(subtypeOptions, rawEvent?.eventSubtype?.eventSubTypeName)?.name ||
    null;
  const fallbackPaymentFormName =
    paymentFormName ||
    paymentForms.find(
      (form) =>
        String(form.idPaymentForm ?? "") ===
          String(rawEvent?.idEventPaymentForm ?? "") ||
        String(form.idPaymentForm ?? "") === String(rawEvent?.idPaymentForm ?? "")
    )?.paymentFormName ||
    paymentForms.find(
      (form) =>
        normalizeLookup(form.paymentFormName) ===
        normalizeLookup(rawEvent?.paymentFormName ?? rawEvent?.eventPaymentFormName)
    )?.paymentFormName ||
    null;
  const taxExemptionName =
    rawEvent?.taxExemption?.taxExemptionName ??
    rawEvent?.taxExemptionName ??
    rawEvent?.exemptionName ??
    null;
  const contingencyName =
    rawEvent?.contingency?.contingencyName ??
    rawEvent?.contingencyName ??
    null;
  const extraTipName =
    rawEvent?.extraTip?.extraTipName ??
    rawEvent?.extraTipName ??
    null;
  const quoteExpirationDate =
    rawEvent?.quoteExpirationDate ??
    rawEvent?.quoteExpiration ??
    rawEvent?.quoteExpiresOn ??
    null;
  const standsQuantity =
    rawEvent?.standsQuantity ?? rawEvent?.standsQty ?? rawEvent?.stands ?? null;
  const discountPercentage =
    rawEvent?.discountPercentage ?? rawEvent?.discountPercent ?? null;
  const hasStandsQuantity =
    standsQuantity !== null &&
    standsQuantity !== undefined &&
    String(standsQuantity).trim() !== "";
  const hasDiscountPercentage =
    discountPercentage !== null &&
    discountPercentage !== undefined &&
    String(discountPercentage).trim() !== "";
  const hasRepetitiveEvent =
    rawEvent?.repetitiveEvent !== undefined && rawEvent?.repetitiveEvent !== null;

  const isICCA =
    rawEvent?.icca === true ||
    rawEvent?.icca === 1 ||
    rawEvent?.icca === "true" ||
    rawEvent?.isICCA === true;
  const isSostenible =
    rawEvent?.sustainable === true ||
    rawEvent?.sustainable === 1 ||
    rawEvent?.sustainable === "true" ||
    rawEvent?.sostenible === true ||
    rawEvent?.sostenible === 1 ||
    rawEvent?.sostenible === "true" ||
    rawEvent?.isSustainable === true;

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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event)} text-white`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditOpen((prev) => !prev)}
          >
            {editOpen ? "Cerrar edicion" : "Editar Evento"}
          </Button>
        </div>

        {editOpen && editState && (
          <div className="space-y-4">
            {editError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
                {editSuccess}
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
                          client.clientName ||
                          client.tradeName ||
                          client.legalName ||
                          "";
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
                          key={
                            client.idClient ??
                            client.clientCode ??
                            client.clientName
                          }
                          className="w-full rounded-md border border-border p-3 text-left hover:bg-accent transition-colors"
                          onClick={() => {
                            updateEditField(
                              "idClient",
                              String(client.idClient ?? "")
                            );
                            setClientSearchOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {client.clientName ||
                                  client.tradeName ||
                                  "Cliente"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {client.clientCode || ""}{" "}
                                {client.idClient ? `#${client.idClient}` : ""}
                              </p>
                            </div>
                            <span className="text-xs text-primary">
                              Seleccionar
                            </span>
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
                  <Button
                    variant="outline"
                    onClick={() => setClientSearchOpen(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={managerSearchOpen} onOpenChange={setManagerSearchOpen}>
              <DialogContent>
                <DialogHeader onClose={() => setManagerSearchOpen(false)}>
                  <div>
                    <DialogTitle>Buscar responsable</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Selecciona el responsable de cuenta para el evento.
                    </p>
                  </div>
                </DialogHeader>
                <DialogBody className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={managerSearchQuery}
                      onInput={(e) =>
                        setManagerSearchQuery(
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Buscar por nombre, correo o ID"
                    />
                    <Button variant="outline" size="icon" aria-label="Buscar">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto space-y-2">
                    {clientManagers
                      .filter((manager) => {
                        const query = managerSearchQuery.trim().toLowerCase();
                        if (!query) return true;
                        const name = manager.clientEventManagerName || "";
                        const email = manager.clientEventManagerEmail || "";
                        const phone = manager.clientEventManagerPhone || "";
                        const id = manager.idClientEventManager
                          ? String(manager.idClientEventManager)
                          : "";
                        return (
                          name.toLowerCase().includes(query) ||
                          email.toLowerCase().includes(query) ||
                          phone.toLowerCase().includes(query) ||
                          id.includes(query)
                        );
                      })
                      .slice(0, 100)
                      .map((manager) => (
                        <button
                          key={
                            manager.idClientEventManager ??
                            manager.clientEventManagerEmail ??
                            manager.clientEventManagerName
                          }
                          className="w-full rounded-md border border-border p-3 text-left hover:bg-accent transition-colors"
                          onClick={() => {
                            updateEditField(
                              "idClientEventManager",
                              String(manager.idClientEventManager ?? "")
                            );
                            setManagerSearchOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {manager.clientEventManagerName ||
                                  manager.clientEventManagerEmail ||
                                  "Responsable"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {manager.clientEventManagerEmail || ""}
                                {manager.idClientEventManager
                                  ? ` #${manager.idClientEventManager}`
                                  : ""}
                              </p>
                            </div>
                            <span className="text-xs text-primary">
                              Seleccionar
                            </span>
                          </div>
                        </button>
                      ))}

                    {clientManagers.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay responsables disponibles.
                      </p>
                    )}
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setManagerSearchOpen(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle>Editar Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editLoading && (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
                    <Spinner size="sm" />
                    <span className="text-muted-foreground">
                      Cargando parametros del formulario...
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titulo</label>
                    <Input
                      value={editState.title}
                      onInput={(e) =>
                        updateEditField(
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
                        value={editState.idClient}
                        onChange={(e) =>
                          updateEditField(
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
                    value={editState.description}
                    onInput={(e) =>
                      updateEditField(
                        "description",
                        (e.target as HTMLTextAreaElement).value
                      )
                    }
                    placeholder="Descripcion del evento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha inicio</label>
                    <DatePicker
                      value={editState.startDate}
                      onInput={(e) =>
                        updateEditField(
                          "startDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha fin</label>
                    <DatePicker
                      value={editState.endDate}
                      onInput={(e) =>
                        updateEditField(
                          "endDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Coordinador de cuenta
                    </label>
                    <Select
                      value={editState.idSalesAgent}
                      onChange={(e) =>
                        updateEditField(
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PAX estimado</label>
                    <Input
                      type="number"
                      min="0"
                      value={editState.estimatedPax}
                      onInput={(e) =>
                        updateEditField(
                          "estimatedPax",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Cantidad estimada"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PAX real</label>
                    <Input
                      type="number"
                      min="0"
                      value={editState.realPax}
                      onInput={(e) =>
                        updateEditField(
                          "realPax",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Cantidad real"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Cantidad de stands
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={editState.standsQuantity}
                      onInput={(e) =>
                        updateEditField(
                          "standsQuantity",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Cantidad de stands"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Segmento</label>
                    <Select
                      value={editState.idEventSegment}
                      onChange={(e) => {
                        const value = (e.target as HTMLSelectElement).value;
                        updateEditField("idEventSegment", value);
                        updateEditField("idEventSubsegment", "");
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
                      value={editState.idEventSubsegment}
                      onChange={(e) =>
                        updateEditField(
                          "idEventSubsegment",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                      disabled={
                        hasSegmentMapping &&
                        !editState.idEventSegment &&
                        !editState.idEventSubsegment
                      }
                    >
                      <option value="">
                        {hasSegmentMapping &&
                        !editState.idEventSegment &&
                        !editState.idEventSubsegment
                          ? "Selecciona segmento primero"
                          : "Selecciona subsegmento"}
                      </option>
                      {filteredSubsegments.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo del evento</label>
                    <Select
                      value={editState.idEventType}
                      onChange={(e) => {
                        updateEditField(
                          "idEventType",
                          (e.target as HTMLSelectElement).value
                        );
                        updateEditField("idEventSubtype", "");
                      }}
                    >
                      <option value="">Selecciona tipo</option>
                      {eventTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subtipo</label>
                    <Select
                      value={editState.idEventSubtype}
                      disabled={
                        hasTypeMapping &&
                        !editState.idEventType &&
                        !editState.idEventSubtype
                      }
                      onChange={(e) =>
                        updateEditField(
                          "idEventSubtype",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">
                        {hasTypeMapping &&
                        !editState.idEventType &&
                        !editState.idEventSubtype
                          ? "Selecciona tipo primero"
                          : "Selecciona subtipo"}
                      </option>
                      {filteredSubtypes.map((subtype) => (
                        <option key={subtype.id} value={subtype.id}>
                          {subtype.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caracter</label>
                    <Select
                      value={editState.idEventCharacter}
                      onChange={(e) =>
                        updateEditField(
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
                      value={editState.idEventSector}
                      onChange={(e) =>
                        updateEditField(
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
                    <label className="text-sm font-medium">
                      Responsable de la Cuenta
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        className="flex-1"
                        value={editState.idClientEventManager}
                        onChange={(e) =>
                          updateEditField(
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
                      <Button
                        variant="outline"
                        onClick={() => setManagerSearchOpen(true)}
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamaño</label>
                    <Select
                      value={editState.idEventSize}
                      onChange={(e) =>
                        updateEditField(
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
                    <label className="text-sm font-medium">
                      Fecha vencimiento cotizacion
                    </label>
                    <DatePicker
                      value={editState.quoteExpirationDate}
                      onInput={(e) =>
                        updateEditField(
                          "quoteExpirationDate",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Impuestos</label>
                    <Select
                      value={editState.idExemption}
                      onChange={(e) =>
                        updateEditField(
                          "idExemption",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Selecciona impuestos</option>
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
                    <label className="text-sm font-medium">Imprevisto</label>
                    <Select
                      value={editState.idContingency}
                      onChange={(e) =>
                        updateEditField(
                          "idContingency",
                          (e.target as HTMLSelectElement).value
                        )
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Propina</label>
                    <Select
                      value={editState.idExtraTip}
                      onChange={(e) =>
                        updateEditField(
                          "idExtraTip",
                          (e.target as HTMLSelectElement).value
                        )
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de pago</label>
                    <Select
                      value={editState.idEventPaymentForm}
                      onChange={(e) =>
                        updateEditField(
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
                    <label className="text-sm font-medium">Evento repetitivo</label>
                    <div className="flex h-10 items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                      <input
                        type="checkbox"
                        className="accent-slate-600"
                        checked={editState.repetitiveEvent}
                        onChange={(e) =>
                          updateEditField(
                            "repetitiveEvent",
                            (e.target as HTMLInputElement).checked
                          )
                        }
                      />
                      <span>Evento repetitivo</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referencia</label>
                    <Input
                      value={editState.reference}
                      onInput={(e) =>
                        updateEditField(
                          "reference",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Referencia"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Atributos</label>
                    <div className="flex h-10 w-full items-center gap-4 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-slate-600"
                          checked={editState.sustainable}
                          onChange={(e) =>
                            updateEditField(
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
                          checked={editState.icca}
                          onChange={(e) =>
                            updateEditField(
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Comentarios internos
                  </label>
                  <Textarea
                    value={editState.internalComments}
                    onInput={(e) =>
                      updateEditField(
                        "internalComments",
                        (e.target as HTMLTextAreaElement).value
                      )
                    }
                    placeholder="Comentarios internos"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateEvent} disabled={editSaving}>
                    {editSaving ? (
                      <Spinner size="sm" className="border-t-white border-white/30" />
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

              {/* Row 1: Fechas y Estatus */}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event)} text-white`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-border/70" />

              {/* Row 2: Segmento / Subsegmento / Tamaño */}
              {(fallbackSegmentName || fallbackSubsegmentName || eventSizeName) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Segmento de Mercado
                    </p>
                    <p className="text-sm mt-1">{fallbackSegmentName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Subsegmento
                    </p>
                    <p className="text-sm mt-1">
                      {fallbackSubsegmentName || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tamano del Evento
                    </p>
                    <p className="text-sm mt-1">{eventSizeName || "-"}</p>
                  </div>
                </div>
              )}

              <div className="h-px w-full bg-border/70" />

              {/* Row 3: Tipo / Subtipo / Caracter / Sector */}
              {(fallbackEventTypeName || fallbackEventSubtypeName || eventCharacterName || eventSectorName) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo de Evento
                    </p>
                    <p className="text-sm mt-1">{fallbackEventTypeName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Subtipo
                    </p>
                    <p className="text-sm mt-1">{fallbackEventSubtypeName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Caracter
                    </p>
                    <p className="text-sm mt-1">{eventCharacterName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Sector
                    </p>
                    <p className="text-sm mt-1">{eventSectorName || "-"}</p>
                  </div>
                </div>
              )}

              <div className="h-px w-full bg-border/70" />

              {/* Row 4: PAX / Stands / Repetitivo */}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Cantidad de Stands
                  </p>
                  <p className="text-sm mt-1">
                    {hasStandsQuantity ? String(standsQuantity) : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Evento Repetitivo
                  </p>
                  <p className="text-sm mt-1">
                    {hasRepetitiveEvent
                      ? rawEvent?.repetitiveEvent
                        ? "Si"
                        : "No"
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-border/70" />

              {/* Row 5: Contrato / Referencia / Descuento / Vencimiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contrato
                  </p>
                  <p className="text-sm mt-1">
                    {(event as any)?.contractNumber || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Referencia
                  </p>
                  <p className="text-sm mt-1">
                    {(event as any)?.reference || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Descuento (%)
                  </p>
                  <p className="text-sm mt-1">
                    {hasDiscountPercentage ? String(discountPercentage) : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Vencimiento de Cotizacion
                  </p>
                  <p className="text-sm mt-1">
                    {quoteExpirationDate
                      ? formatDateLocal(quoteExpirationDate)
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-border/70" />

              {/* Row 6: Forma de pago / Impuestos / Imprevisto / Propina */}
              {(fallbackPaymentFormName || taxExemptionName || contingencyName || extraTipName) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Forma de Pago
                    </p>
                    <p className="text-sm mt-1">{fallbackPaymentFormName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Impuestos
                    </p>
                    <p className="text-sm mt-1">{taxExemptionName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Imprevisto
                    </p>
                    <p className="text-sm mt-1">{contingencyName || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Propina
                    </p>
                    <p className="text-sm mt-1">{extraTipName || "-"}</p>
                  </div>
                </div>
              )}

              <div className="h-px w-full bg-border/70" />

              {/* Row 4: ICCA / Sostenible */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Evento ICCA
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isICCA ? (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-sm">Sí</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sostenible
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isSostenible ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Leaf className="h-4 w-4" />
                        <span className="text-sm">Sí</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No</span>
                    )}
                  </div>
                </div>

                <div aria-hidden="true" />
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
                      {(event as any).activities
                        .filter((a: any) => !isItemCancelled(a))
                        .map((activity: any, idx: number) => (
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
                        ))}
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
                              !isItemCancelled(activity) &&
                              activity.rooms &&
                              activity.rooms.length > 0
                          )
                          .forEach((activity: any) => {
                            activity.rooms
                              .filter((room: any) => !isItemCancelled(room))
                              .forEach((room: any) => {
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
                              !isItemCancelled(activity) &&
                              activity.services &&
                              activity.services.length > 0
                          )
                          .forEach((activity: any) => {
                            activity.services
                              .filter(
                                (service: any) => !isItemCancelled(service)
                              )
                              .forEach((service: any) => {
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
                    descuento: number;
                  }>;
                  total: number;
                }[] = [];

                let totalGeneral = 0;
                let totalDescuentoCalculado = 0;
                let totalImpuestosCalculado = 0;

                // 1. Salones (de activities.rooms)
                const totalSalones = {
                  area: "Salones",
                  items: [] as Array<{
                    descripcion: string;
                    precio: number;
                    cantidad: number;
                    descuento: number;
                  }>,
                  total: 0,
                };

                if ((event as any)?.activities) {
                  (event as any).activities.forEach((activity: any) => {
                    if (isItemCancelled(activity)) return;
                    if (activity.rooms && Array.isArray(activity.rooms)) {
                      activity.rooms.forEach((room: any) => {
                        if (isItemCancelled(room)) return;
                        const { net, discount, tax, price } =
                          calculateItemAmounts(room, 1);

                        if (net > 0 || price > 0) {
                          totalSalones.items.push({
                            descripcion:
                              room.roomName || room.name || "Salón sin nombre",
                            precio: price,
                            cantidad: 1,
                            descuento: discount,
                          });
                          totalSalones.total += net - discount;
                          totalGeneral += net;
                          totalDescuentoCalculado += discount;
                          totalImpuestosCalculado += tax;
                        }
                      });
                    }
                  });
                }

                if (totalSalones.items.length > 0) {
                  totalesPorArea.push(totalSalones);
                }

                // 2. Servicios agrupados por Grupo de Ingresos (revenueGroup)
                const serviciosPorGrupo: {
                  [grupo: string]: {
                    items: Array<{
                      descripcion: string;
                      precio: number;
                      cantidad: number;
                      descuento: number;
                    }>;
                    total: number;
                  };
                } = {};

                if ((event as any)?.activities) {
                  (event as any).activities.forEach((activity: any) => {
                    if (isItemCancelled(activity)) return;
                    if (activity.services && Array.isArray(activity.services)) {
                      activity.services.forEach((service: any) => {
                        if (isItemCancelled(service)) return;
                        const cantidad =
                          service.quantity || service.serviceQuantity || 1;
                        const { net, discount, tax, price } =
                          calculateItemAmounts(service, cantidad);

                        if (net > 0 || price > 0) {
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
                            precio: price,
                            cantidad,
                            descuento: discount,
                          });
                          serviciosPorGrupo[grupoIngresos].total +=
                            net - discount;
                          totalGeneral += net;
                          totalDescuentoCalculado += discount;
                          totalImpuestosCalculado += tax;
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
                    }
                  });

                const amountSources = [
                  rawEvent,
                  quoteData,
                  quoteData?.result,
                  quoteData?.Quote,
                  quoteData?.quote,
                  quoteData?.totals,
                  quoteData?.Totals,
                  quoteData?.summary,
                  quoteData?.pricing,
                  quoteData?.header,
                  quoteData?.financial,
                  quoteData?.financialSummary,
                  quoteData?.eventTotals,
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

                // Búsqueda profunda por clave que haga match con un patrón
                const findNumericDeep = (
                  source: unknown,
                  keyPattern: RegExp,
                  visited = new WeakSet()
                ): number | null => {
                  if (!source || typeof source !== "object") return null;
                  if (visited.has(source as object)) return null;
                  visited.add(source as object);

                  if (Array.isArray(source)) {
                    for (const item of source) {
                      const found = findNumericDeep(item, keyPattern, visited);
                      if (found !== null) return found;
                    }
                    return null;
                  }

                  for (const [k, v] of Object.entries(
                    source as Record<string, unknown>
                  )) {
                    if (keyPattern.test(k)) {
                      const parsed = parseNumericValue(v);
                      if (parsed !== null) return parsed;
                    }
                    if (v && typeof v === "object") {
                      const child = findNumericDeep(v, keyPattern, visited);
                      if (child !== null) return child;
                    }
                  }
                  return null;
                };

                const pickAmount = (
                  keys: string[],
                  fallbackPattern?: RegExp
                ): number | null => {
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
                    if (fallbackPattern) {
                      const deep = findNumericDeep(source, fallbackPattern);
                      if (deep !== null) return deep;
                    }
                  }
                  return null;
                };

                const ensurePositive = (value: number | null): number => {
                  if (value === null || Number.isNaN(value)) return 0;
                  return Math.abs(value);
                };

                const subtotal = totalGeneral;

                // Priorizar valores calculados si existen items, sino buscar en la cotización
                const hasItems = totalesPorArea.length > 0;

                const discountAmount =
                  hasItems && totalDescuentoCalculado > 0
                    ? totalDescuentoCalculado
                    : ensurePositive(
                        pickAmount(
                          [
                            "totalDiscount",
                            "totalDiscountAmount",
                            "discountAmount",
                            "eventDiscount",
                            "discount",
                            "discountValue",
                            "eventDiscountAmount",
                            "discountPercentage",
                            "discountPercent",
                            "descuento",
                            "dscto",
                          ],
                          /(discount|descuento|dscto|rebate|rebaja|bonif)/i
                        )
                      );

                const taxesAmount =
                  hasItems && totalImpuestosCalculado > 0
                    ? totalImpuestosCalculado
                    : ensurePositive(
                        pickAmount(
                          [
                            "totalTax",
                            "totalTaxes",
                            "totalTaxAmount",
                            "taxAmount",
                            "eventTax",
                            "taxes",
                            "taxValue",
                            "eventTaxes",
                            "tax",
                            "iva",
                            "ivaAmount",
                            "totalIva",
                            "totalVat",
                            "vat",
                            "vatAmount",
                            "vatValue",
                          ],
                          /(tax|iva|vat)/i
                        )
                      );
                const providedGrandTotalValue = pickAmount(
                  [
                    "totalAmount",
                    "grandTotal",
                    "eventTotal",
                    "totalWithTax",
                    "eventAmount",
                    "totalQuotation",
                    "total",
                    "totalQuote",
                  ],
                  /(total)/i
                );

                const computedGrandTotal =
                  subtotal - discountAmount + taxesAmount;

                const normalizedFinalTotal = (() => {
                  // Si tenemos items calculados, confiamos en nuestro cálculo (computedGrandTotal)
                  // por encima del valor total que pueda venir en el JSON (providedGrandTotalValue),
                  // ya que este último a veces no refleja los descuentos por ítem correctamente.
                  if (hasItems && Number.isFinite(computedGrandTotal)) {
                    return computedGrandTotal;
                  }

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
                        {quoteLoading ? (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Actualizando cotización...
                          </p>
                        ) : quoteData ? (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Valores obtenidos de la cotización del sistema
                          </p>
                        ) : null}
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
                                    <div className="flex flex-col gap-0.5">
                                      {item.cantidad > 1 && (
                                        <p className="text-xs text-muted-foreground/70">
                                          Cantidad: {item.cantidad} × $
                                          {item.precio.toLocaleString("es-ES", {
                                            minimumFractionDigits: 2,
                                          })}
                                        </p>
                                      )}
                                      {item.descuento > 0 && (
                                        <p className="text-xs text-destructive font-medium">
                                          Descuento: -$
                                          {item.descuento.toLocaleString(
                                            "es-ES",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p
                                      className={`font-medium ${
                                        item.descuento > 0
                                          ? "text-muted-foreground line-through text-xs"
                                          : ""
                                      }`}
                                    >
                                      $
                                      {(
                                        item.precio * item.cantidad
                                      ).toLocaleString("es-ES", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                    {item.descuento > 0 && (
                                      <p className="font-medium text-foreground">
                                        ${" "}
                                        {(
                                          item.precio * item.cantidad -
                                          item.descuento
                                        ).toLocaleString("es-ES", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </p>
                                    )}
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
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Column 1: Fecha Creación + Fecha Límite */}
              <div>
                {(event as any)?.creationDate && (
                  <>
                    <p className="font-medium text-muted-foreground">
                      Fecha Creación
                    </p>
                    <p className="mt-1">
                      {new Date((event as any).creationDate).toLocaleString(
                        "es-ES"
                      )}
                    </p>
                  </>
                )}

                {deadlineDate && (
                  <div className="mt-3">
                    <p className="font-medium text-muted-foreground">
                      Fecha Límite
                    </p>
                    <p className="mt-1">
                      {deadlineDate.toLocaleString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Column 2: Contador (centrado) */}
              <div className="flex items-center justify-center">
                {countdownActive && timeLeftMs !== null ? (
                  (() => {
                    const ms = timeLeftMs;
                    const absMs = Math.abs(ms);
                    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
                    const seconds = Math.floor((absMs / 1000) % 60);

                    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
                    const nearExpiry = ms > 0 && ms <= oneWeekMs;
                    const ok = ms > oneWeekMs;
                    const expired = ms <= 0;

                    const baseBadge =
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold";

                    const badgeClass = ok
                      ? baseBadge + " bg-emerald-600 text-white"
                      : nearExpiry
                      ? baseBadge + " bg-amber-500 text-white"
                      : baseBadge + " bg-red-600 text-white";

                    const prefix = expired ? "Venció hace" : "Expira en";
                    const timeStr = `${days}d ${String(hours).padStart(
                      2,
                      "0"
                    )}h ${String(minutes).padStart(2, "0")}m ${String(
                      seconds
                    ).padStart(2, "0")}s`;

                    return (
                      <div className="text-center">
                        <div className={badgeClass}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 12A9 9 0 113 12a9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="ml-2">
                            <div className="text-xs">{prefix}</div>
                            <div className="text-sm font-bold">{timeStr}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Estado:{" "}
                          <span className="font-medium">
                            {getEventStatusText(event)}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground">No aplica</div>
                )}
              </div>

              {/* Column 3: Última Modificación + Estado textual */}
              <div className="text-right">
                {(event as any)?.modificationDate && (
                  <>
                    <p className="font-medium text-muted-foreground">
                      Última Modificación
                    </p>
                    <p className="mt-1">
                      {new Date((event as any).modificationDate).toLocaleString(
                        "es-ES"
                      )}
                    </p>
                  </>
                )}

                <div className="mt-3">
                  <p className="font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event)} text-white`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
