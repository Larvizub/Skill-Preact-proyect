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
  type Client,
  type ClientEventManager,
  type Contingency,
  type EventMarketSubSegment,
  type EventPaymentForm,
  type EventSector,
  type EventSize,
  type EventSubType,
  type ExtraTip,
  type MarketSegment,
  type SalesAgent,
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
  signatureDate: string; // Eliminar logica
  billingName: string; // Eliminar logica
  quoteExpirationDate: string;
  standsQuantity: string;
  idCreationOper: string; 
  idEventStage: string;
  sustainable: boolean;
  icca: boolean;
}


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
  idEventType: "",
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

export function CrearEventoDetalle() {
  const [eventState, setEventState] = useState<EventFormState>(
    initialEventState
  );
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState({
    general: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdEventNumber, setCreatedEventNumber] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState({
    general: true,
  });
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
  const loadGeneral = async () => {
    setLoadingSections({ general: true });

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
        currencyData,
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
        safeLoad("billingCurrencies", () => apiService.getBillingCurrencies(), []),
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

        if (!eventState.idCurrency) {
          const preferred =
            (currencyData || []).find(
              (currency: any) => Number(currency.idCurrency) === 3
            ) || (currencyData || [])[0];
          const resolvedId = preferred?.idCurrency ?? 3;
          setEventState((prev) =>
            prev.idCurrency
              ? prev
              : {
                  ...prev,
                  idCurrency: String(resolvedId),
                }
          );
        }

      if (clientData.length === 0 || salesData.length === 0) {
        setError(
          "Algunos parametros clave no se pudieron cargar. Revisa la conexion o el API."
        );
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error cargando opciones del formulario:", err);
      setError(
        "No se pudieron cargar los datos de referencia. Verifica la conexion e intenta nuevamente."
      );
    } finally {
      setLoadingSections({ general: false });
    }
  };

  useEffect(() => {
    loadGeneral();
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

  const filteredSubsegments = useMemo(() => {
    if (!eventState.idEventSegment) return [];
    const hasSegmentMapping = subsegmentOptions.some(
      (sub) => sub.segmentId && sub.segmentId.trim().length > 0
    );
    if (!hasSegmentMapping) return subsegmentOptions;

    return subsegmentOptions.filter(
      (sub) =>
        sub.segmentId === eventState.idEventSegment ||
        !sub.segmentId ||
        sub.segmentId.trim().length === 0
    );
  }, [eventState.idEventSegment, subsegmentOptions]);

  const filteredSubtypes = useMemo(() => {
    if (!eventState.idEventType) return [];
    const hasTypeMapping = subtypeOptions.some(
      (sub) => sub.typeId && sub.typeId.trim().length > 0
    );
    if (!hasTypeMapping) return subtypeOptions;

    return subtypeOptions.filter(
      (sub) =>
        sub.typeId === eventState.idEventType ||
        !sub.typeId ||
        sub.typeId.trim().length === 0
    );
  }, [eventState.idEventType, subtypeOptions]);
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

  useEffect(() => {
    if (!eventState.idEventType) {
      if (eventState.idEventSubtype) {
        updateEventField("idEventSubtype", "");
      }
      return;
    }

    const stillValid = filteredSubtypes.some(
      (sub) => sub.id === eventState.idEventSubtype
    );
    if (!stillValid && eventState.idEventSubtype) {
      updateEventField("idEventSubtype", "");
    }
  }, [eventState.idEventType, eventState.idEventSubtype, filteredSubtypes]);

  useEffect(() => {
    const pax = Number(eventState.estimatedPax);
    if (Number.isNaN(pax)) return;

    let sizeLabel = "";
    if (pax >= 0 && pax <= 100) sizeLabel = "XS";
    else if (pax >= 101 && pax <= 500) sizeLabel = "S";
    else if (pax >= 501 && pax <= 1500) sizeLabel = "M";
    else if (pax >= 1501 && pax <= 2500) sizeLabel = "L";
    else if (pax >= 2501) sizeLabel = "XL";

    let sizeId = sizeIdByLabel.get(sizeLabel) || "";
    if (!sizeId && sizeRanges.length > 0) {
      const match = sizeRanges.find(
        (range) => pax >= range.min && pax <= range.max
      );
      sizeId = match?.id || "";
    }
    if (sizeId && sizeId !== eventState.idEventSize) {
      updateEventField("idEventSize", sizeId);
    }
  }, [
    eventState.estimatedPax,
    eventState.idEventSize,
    sizeIdByLabel,
    sizeRanges,
  ]);
  const updateEventField = (
    field: keyof EventFormState,
    value: string | boolean
  ) => {
    setEventState((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    if (!eventState.idEventType) return "Selecciona el tipo del evento.";
    if (!eventState.idEventSubtype) return "Selecciona el subtipo del evento.";
    if (!eventState.idEventCharacter)
      return "Selecciona el caracter del evento.";
    if (!eventState.idEventSector)
      return "Selecciona el sector del evento.";
    if (!eventState.idEventSize) return "Selecciona el tamano del evento.";

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
        idCurrency: toNumberOrNull(eventState.idCurrency) ?? 3,
        discountPercentage: toNumberOrNull(eventState.discountPercentage),
        idSalesAgent: toNumberOrNull(eventState.idSalesAgent),
        idEventSubsegment: toNumberOrNull(eventState.idEventSubsegment),
        idEventType: toNumberOrNull(eventState.idEventType),
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

      setSuccessMessage(
        `Evento creado correctamente. Numero de evento: ${eventNumber}`
      );
      setCreatedEventNumber(eventNumber);
      setSuccessModalOpen(true);
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
                        updateEventField(
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
                        <span className="text-xs text-primary">Seleccionar</span>
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
              <Button variant="outline" onClick={() => setManagerSearchOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent>
            <DialogHeader onClose={() => setSuccessModalOpen(false)}>
              <div>
                <DialogTitle>Evento creado</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  El evento se guardo correctamente.
                </p>
              </div>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                Numero de evento: <span className="font-semibold">{createdEventNumber ?? "-"}</span>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessModalOpen(false);
                  if (createdEventNumber) {
                    route(`/eventos/${createdEventNumber}`);
                  }
                }}
              >
                Ver evento
              </Button>
              <Button
                onClick={() => {
                  setSuccessModalOpen(false);
                }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-6">
          {loadingSections.general && (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
              <Spinner size="sm" />
              <span className="text-muted-foreground">
                Cargando parametros del formulario...
              </span>
            </div>
          )}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PAX estimado</label>
                    <Input
                      type="number"
                      min="0"
                      value={eventState.estimatedPax}
                      onInput={(e) =>
                        updateEventField(
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
                      value={eventState.realPax}
                      onInput={(e) =>
                        updateEventField(
                          "realPax",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      placeholder="Cantidad real"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo del evento</label>
                    <Select
                      value={eventState.idEventType}
                      onChange={(e) => {
                        updateEventField(
                          "idEventType",
                          (e.target as HTMLSelectElement).value
                        );
                        updateEventField("idEventSubtype", "");
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
                      value={eventState.idEventSubtype}
                      disabled={!eventState.idEventType}
                      onChange={(e) =>
                        updateEventField(
                          "idEventSubtype",
                          (e.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">
                        {eventState.idEventType
                          ? "Selecciona subtipo"
                          : "Selecciona tipo primero"}
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
                    <label className="text-sm font-medium">
                      Responsable de la Cuenta
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        className="flex-1"
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
                    <label className="text-sm font-medium">Impuestos</label>
                    <Select
                      value={eventState.idExemption}
                      onChange={(e) =>
                        updateEventField(
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
                      value={eventState.idContingency}
                      onChange={(e) =>
                        updateEventField(
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
                      value={eventState.idExtraTip}
                      onChange={(e) =>
                        updateEventField(
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
                    <label className="text-sm font-medium">Evento repetitivo</label>
                    <div className="flex h-10 items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                      <input
                        type="checkbox"
                        className="accent-slate-600"
                        checked={eventState.repetitiveEvent}
                        onChange={(e) =>
                          updateEventField(
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
                    placeholder="Comentarios internos"
                  />
                </div>
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
      </div>
    </Layout>
  );
}
