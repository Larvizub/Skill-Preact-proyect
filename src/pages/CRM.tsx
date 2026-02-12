import { useEffect, useMemo, useState } from "preact/hooks";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { DatePicker } from "../components/ui/datepicker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Spinner } from "../components/ui/spinner";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Link,
  UserRoundCheck,
  Plus,
  Trash2,
  MessageSquarePlus,
  Percent,
  Target,
} from "lucide-preact";
import { authService } from "../services/auth.service";
import { crmService } from "../services/crm.service";
import {
  CRM_STAGE_LABELS,
  CRM_STAGE_OPTIONS,
  type CrmDatabaseKey,
  type Opportunity,
  type OpportunityStage,
  type OpportunityTimelineEntry,
} from "../types/crm";
import { apiService } from "../services/api.service";
import { resolveEventQuoteGrandTotal } from "../lib/quoteUtils";

type SelectOption = { value: string; label: string };

type OpportunityFormState = {
  eventName: string;
  currency: "USD" | "COP";
  opportunityValue: string;
  accountName: string;
  relatedContacts: string;
  salesProcess: string;
  salesStage: string;
  salesOwnerId: string;
  salesOwnerName: string;
  opportunitySegmentId: string;
  opportunitySegmentName: string;
  iccaEvent: boolean;
  sustainableEvent: boolean;
  buildingBlock: string;
  skillEventId: string;
  generatedByVisit: boolean;
  rfp: boolean;
  territory: string;
  startDate: string;
  endDate: string;
  setupDate: string;
  teardownDate: string;
  eventTypeId: string;
  eventTypeName: string;
  eventCharacter: string;
  eventSizeId: string;
  eventSizeName: string;
  estimatedAttendees: string;
  economicSectorId: string;
  economicSectorName: string;
  periodicity: string;
  setupTypeId: string;
  setupTypeName: string;
  gastronomicRequirements: string;
  audiovisualRequirements: string;
  technologyRequirements: string;
  eventGeneralObservations: string;
  paymentMethod: string;
  firstPayment: string;
  secondPayment: string;
  thirdPayment: string;
  balancePayment: string;
  pazYSalvo: string;
  relatedEventNameOAE: string;
  standNumber: string;
  incomeChannel: string;
  iccaId: string;
  economicImpactProjection: string;
  microsector: string;
  opportunityQualification: string;
  frequency: string;
  rotationArea: string;
  lastEdition: string;
  nextEdition: string;
  potentialEditionForGH: string;
  capturedEvent: boolean;
  heroicBusiness: boolean;
  notes: string;
};

const SALES_PROCESS_OPTIONS: SelectOption[] = [
  { value: "Embudo de Ventas", label: "Embudo de Ventas" },
  { value: "Etapas de investigación", label: "Etapas de investigación" },
];

const SALES_STAGE_OPTIONS: SelectOption[] = [
  { value: "Oportunidad Identificada", label: "Oportunidad Identificada" },
  {
    value: "Oportunidad Gestión Comercial",
    label: "Oportunidad Gestión Comercial",
  },
  { value: "Propuestas Presentadas", label: "Propuestas Presentadas" },
  { value: "Propuestas en Seguimiento", label: "Propuestas en Seguimiento" },
  { value: "Negociación y contrato", label: "Negociación y contrato" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "Finalizado", label: "Finalizado" },
  { value: "Perdido", label: "Perdido" },
];

const BUILDING_BLOCK_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "Licitación", label: "Licitación" },
];

const OPPORTUNITY_SEGMENT_OPTIONS: SelectOption[] = [
  { value: "Asociativo", label: "Asociativo" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "Gubernamental", label: "Gubernamental" },
  {
    value: "Otros Clientes: Persona Natural",
    label: "Otros Clientes: Persona Natural",
  },
];

const TERRITORY_OPTIONS: SelectOption[] = [
  {
    value: "Centro de Convenciones de Costar Rica",
    label: "Centro de Convenciones de Costar Rica",
  },
  {
    value: "Centro de Convenciones Cartagena de Indias",
    label: "Centro de Convenciones Cartagena de Indias",
  },
  {
    value: "Centro de Evento Valle del Pacífico",
    label: "Centro de Evento Valle del Pacífico",
  },
  { value: "Grupo Heroica", label: "Grupo Heroica" },
  { value: "Negocios Heroicos", label: "Negocios Heroicos" },
];

const PERIODICITY_OPTIONS: SelectOption[] = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Repetido", label: "Repetido" },
];

const GASTRONOMIC_OPTIONS: SelectOption[] = [
  { value: "Almuerzo Buffet", label: "Almuerzo Buffet" },
  { value: "Almuerzo Plato Servido", label: "Almuerzo Plato Servido" },
  { value: "Cena Buffet", label: "Cena Buffet" },
  { value: "Cena Plato Servido", label: "Cena Plato Servido" },
  { value: "Coffe AM", label: "Coffe AM" },
  { value: "Coffe PM", label: "Coffe PM" },
  {
    value: "Estación Café Autoservicio",
    label: "Estación Café Autoservicio",
  },
  { value: "Gastronomía por Estación", label: "Gastronomía por Estación" },
  { value: "Pasabocas tipo Coctel", label: "Pasabocas tipo Coctel" },
];

const TECHNOLOGY_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
  { value: "Cableado", label: "Cableado" },
  { value: "WiFi", label: "WiFi" },
];

const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: "100% Anticipado", label: "100% Anticipado" },
  { value: "Anticipo y Crédito", label: "Anticipo y Crédito" },
];

const YES_NO_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
];

const INCOME_CHANNEL_OPTIONS: SelectOption[] = [
  { value: "Investigación GH", label: "Investigación GH" },
  { value: "Investigación UDEI", label: "Investigación UDEI" },
  { value: "Investigación Recinto", label: "Investigación Recinto" },
];

const MICROSECTOR_OPTIONS: SelectOption[] = [
  { value: "Agroindustria", label: "Agroindustria" },
  { value: "Ciencias de la Vida", label: "Ciencias de la Vida" },
  { value: "Infraestructura Turística", label: "Infraestructura Turística" },
  { value: "Manofactura Avanzada", label: "Manofactura Avanzada" },
  { value: "Otro", label: "Otro" },
  { value: "Proyectos Especiales", label: "Proyectos Especiales" },
  { value: "Semiconductores", label: "Semiconductores" },
  { value: "Servicios", label: "Servicios" },
  {
    value: "Sostenibilidad y descarbonización",
    label: "Sostenibilidad y descarbonización",
  },
];

const QUALIFICATION_OPTIONS: SelectOption[] = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "Anual", label: "Anual" },
  { value: "Bienal", label: "Bienal" },
  { value: "Trienal", label: "Trienal" },
  { value: "Irregular", label: "Irregular" },
  { value: "Otro", label: "Otro" },
];

const ROTATION_AREA_OPTIONS: SelectOption[] = [
  { value: "Central America", label: "Central America" },
  { value: "Central America/Caribean", label: "Central America/Caribean" },
  {
    value: "Central America/North America",
    label: "Central America/North America",
  },
  { value: "Europe/Interamerican", label: "Europe/Interamerican" },
  { value: "Europe/Latin America", label: "Europe/Latin America" },
  { value: "Europe/North America", label: "Europe/North America" },
  { value: "Ibero-America", label: "Ibero-America" },
  { value: "Interamerican", label: "Interamerican" },
  { value: "Latin America", label: "Latin America" },
  { value: "Latin America/Caribean", label: "Latin America/Caribean" },
  { value: "World/International", label: "World/International" },
];

const STAGE_BADGE_CLASS: Record<OpportunityStage, string> = {
  prospecto: "bg-muted text-muted-foreground",
  contactado: "bg-secondary text-secondary-foreground",
  calificacion: "bg-secondary text-secondary-foreground",
  propuesta: "bg-secondary text-secondary-foreground",
  negociacion: "bg-secondary text-secondary-foreground",
  cotizadoSkill: "bg-primary/10 text-primary",
  ganada: "bg-primary text-primary-foreground",
  perdida: "bg-destructive/10 text-destructive",
};

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="cursor-pointer select-none">
      <div className="flex h-10 items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
        <input
          type="checkbox"
          className="accent-slate-600"
          checked={checked}
          onChange={(event) =>
            onChange((event.target as HTMLInputElement).checked)
          }
        />
        <span>{label}</span>
      </div>
    </label>
  );
}

const mapSalesStageToOpportunityStage = (salesStage: string): OpportunityStage => {
  switch (salesStage) {
    case "Oportunidad Identificada":
      return "prospecto";
    case "Oportunidad Gestión Comercial":
      return "contactado";
    case "Propuestas Presentadas":
      return "propuesta";
    case "Propuestas en Seguimiento":
      return "calificacion";
    case "Negociación y contrato":
      return "negociacion";
    case "Confirmado":
      return "cotizadoSkill";
    case "Finalizado":
      return "ganada";
    case "Perdido":
      return "perdida";
    default:
      return "prospecto";
  }
};

const createDefaultForm = (): OpportunityFormState => ({
  eventName: "",
  currency: "USD",
  opportunityValue: "",
  accountName: "",
  relatedContacts: "",
  salesProcess: SALES_PROCESS_OPTIONS[0].value,
  salesStage: SALES_STAGE_OPTIONS[0].value,
  salesOwnerId: "",
  salesOwnerName: "",
  opportunitySegmentId: "",
  opportunitySegmentName: "",
  iccaEvent: false,
  sustainableEvent: false,
  buildingBlock: "",
  skillEventId: "",
  generatedByVisit: false,
  rfp: false,
  territory: "",
  startDate: "",
  endDate: "",
  setupDate: "",
  teardownDate: "",
  eventTypeId: "",
  eventTypeName: "",
  eventCharacter: "",
  eventSizeId: "",
  eventSizeName: "",
  estimatedAttendees: "",
  economicSectorId: "",
  economicSectorName: "",
  periodicity: "",
  setupTypeId: "",
  setupTypeName: "",
  gastronomicRequirements: "",
  audiovisualRequirements: "",
  technologyRequirements: "",
  eventGeneralObservations: "",
  paymentMethod: "",
  firstPayment: "",
  secondPayment: "",
  thirdPayment: "",
  balancePayment: "",
  pazYSalvo: "",
  relatedEventNameOAE: "",
  standNumber: "",
  incomeChannel: "",
  iccaId: "",
  economicImpactProjection: "",
  microsector: "",
  opportunityQualification: "",
  frequency: "",
  rotationArea: "",
  lastEdition: "",
  nextEdition: "",
  potentialEditionForGH: "",
  capturedEvent: false,
  heroicBusiness: false,
  notes: "",
});

const formatCurrencyUSD = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const extractOption = (
  item: any,
  idCandidates: string[],
  labelCandidates: string[]
): SelectOption | null => {
  let value = "";
  let label = "";

  for (const key of idCandidates) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      value = String(item[key]);
      break;
    }
  }

  for (const key of labelCandidates) {
    if (item?.[key]) {
      label = String(item[key]);
      break;
    }
  }

  if (!value && label) value = label;
  if (!label && value) label = value;
  if (!value || !label) return null;

  return { value, label };
};

export function CRM() {
  const [selectedDb, setSelectedDb] = useState<CrmDatabaseKey>(
    authService.getRecinto() as CrmDatabaseKey
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [timeline, setTimeline] = useState<OpportunityTimelineEntry[]>([]);
  const [noteText, setNoteText] = useState("");
  const [listFilter, setListFilter] = useState<"all" | OpportunityStage>("all");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<OpportunityFormState>(createDefaultForm());

  const [salesOwnerOptions, setSalesOwnerOptions] = useState<SelectOption[]>([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<SelectOption[]>([]);
  const [eventSizeOptions, setEventSizeOptions] = useState<SelectOption[]>([]);
  const [eventSectorOptions, setEventSectorOptions] = useState<SelectOption[]>([]);
  const [setupTypeOptions, setSetupTypeOptions] = useState<SelectOption[]>([]);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingOpportunity, setLinkingOpportunity] = useState<Opportunity | null>(
    null
  );
  const [eventIdInput, setEventIdInput] = useState("");
  const [linkingSkillEvent, setLinkingSkillEvent] = useState(false);
  const [creatingClientInSkillId, setCreatingClientInSkillId] = useState("");

  useEffect(() => {
    const syncSelectedDb = () => {
      const recinto = authService.getRecinto() as CrmDatabaseKey;
      setSelectedDb((prev) => (prev === recinto ? prev : recinto));
    };

    syncSelectedDb();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "skill_recinto") syncSelectedDb();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") syncSelectedDb();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = crmService.subscribeToOpportunities(
      selectedDb,
      (items) => {
        setOpportunities(items);
        setLoading(false);

        if (items.length === 0) {
          setSelectedOpportunity(null);
          return;
        }

        setSelectedOpportunity((previous) => {
          if (!previous) return items[0];
          return items.find((item) => item.id === previous.id) || items[0];
        });
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [selectedDb]);

  useEffect(() => {
    if (!selectedOpportunity) {
      setTimeline([]);
      return;
    }

    const unsubscribe = crmService.subscribeToTimeline(
      selectedDb,
      selectedOpportunity.id,
      (items) => setTimeline(items)
    );

    return () => unsubscribe();
  }, [selectedDb, selectedOpportunity?.id]);

  useEffect(() => {
    let mounted = true;

    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        const [salesAgents, eventTypes, eventSizes, eventSectors, setupTypes] =
          await Promise.all([
            apiService.getSalesAgents().catch(() => []),
            apiService.getEventTypes().catch(() => []),
            apiService.getEventSizes().catch(() => []),
            apiService.getEventSectors().catch(() => []),
            apiService.getReservationTypes().catch(() => []),
          ]);

        if (!mounted) return;

        setSalesOwnerOptions(
          (salesAgents as any[])
            .map((item) =>
              extractOption(item, ["idSalesAgent", "id"], ["salesAgentName", "name"])
            )
            .filter(Boolean) as SelectOption[]
        );

        setEventTypeOptions(
          (eventTypes as any[])
            .map((item) =>
              extractOption(item, ["idEventType", "id"], ["eventTypeName", "name"])
            )
            .filter(Boolean) as SelectOption[]
        );

        setEventSizeOptions(
          (eventSizes as any[])
            .map((item) =>
              extractOption(item, ["idEventSize", "id"], ["eventSizeName", "name"])
            )
            .filter(Boolean) as SelectOption[]
        );

        setEventSectorOptions(
          (eventSectors as any[])
            .map((item) =>
              extractOption(
                item,
                ["idEventSector", "id"],
                ["eventSectorName", "name"]
              )
            )
            .filter(Boolean) as SelectOption[]
        );

        setSetupTypeOptions(
          (setupTypes as any[])
            .map((item) =>
              extractOption(
                item,
                ["idReservationType", "id"],
                ["reservationTypeName", "name"]
              )
            )
            .filter(Boolean) as SelectOption[]
        );
      } finally {
        if (mounted) setLoadingLookups(false);
      }
    };

    loadLookups();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const parseNumber = (value: unknown) => {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const totalUSD = opportunities.reduce((acc, op) => {
      const infoBasica = (op.details?.infoBasica as Record<string, unknown>) || {};
      const moneda = String(infoBasica.moneda || "");
      const valor = parseNumber(infoBasica.valorOportunidad ?? op.estimatedValue);
      return moneda === "USD" ? acc + valor : acc;
    }, 0);

    const iccaEvents = opportunities.filter((op) => {
      const infoBasica = (op.details?.infoBasica as Record<string, unknown>) || {};
      return Boolean(infoBasica.eventoICCA);
    }).length;

    const sustainableEvents = opportunities.filter((op) => {
      const infoBasica = (op.details?.infoBasica as Record<string, unknown>) || {};
      return Boolean(infoBasica.eventoSostenible);
    }).length;

    const avgAttendeesBase = opportunities
      .map((op) => {
        const detallesEvento =
          (op.details?.detallesEvento as Record<string, unknown>) || {};
        return parseNumber(detallesEvento.numeroAsistentesEstimados);
      })
      .filter((value) => value > 0);

    const avgAttendees =
      avgAttendeesBase.length > 0
        ? avgAttendeesBase.reduce((acc, value) => acc + value, 0) /
          avgAttendeesBase.length
        : 0;

    const territoryCounter = opportunities.reduce<Record<string, number>>(
      (acc, op) => {
        const infoBasica = (op.details?.infoBasica as Record<string, unknown>) || {};
        const territory = String(infoBasica.territorio || "").trim();
        if (!territory) return acc;
        acc[territory] = (acc[territory] || 0) + 1;
        return acc;
      },
      {}
    );

    const topTerritoryEntry = Object.entries(territoryCounter).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const topTerritory = topTerritoryEntry?.[0] || "-";
    const topTerritoryCount = topTerritoryEntry?.[1] || 0;

    const quotedInSkill = opportunities.filter((op) => op.stage === "cotizadoSkill");

    const byStage = SALES_STAGE_OPTIONS.map((stage) => ({
      stage: stage.value,
      label: stage.label,
      count: opportunities.filter((op) => {
        const infoBasica = (op.details?.infoBasica as Record<string, unknown>) || {};
        const salesStage = String(infoBasica.etapaOportunidadVenta || "").trim();
        return salesStage === stage.value;
      }).length,
    }));

    return {
      totalUSD,
      iccaEvents,
      sustainableEvents,
      avgAttendees,
      topTerritory,
      topTerritoryCount,
      quotedInSkill: quotedInSkill.length,
      byStage,
    };
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    if (listFilter === "all") return opportunities;
    return opportunities.filter((item) => item.stage === listFilter);
  }, [listFilter, opportunities]);

  const updateFormField = (field: keyof OpportunityFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateFormFlag = (field: keyof OpportunityFormState, value: boolean) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSelectWithLabel = (
    valueField: keyof OpportunityFormState,
    labelField: keyof OpportunityFormState,
    value: string,
    options: SelectOption[]
  ) => {
    const matched = options.find((option) => option.value === value);
    setForm((previous) => ({
      ...previous,
      [valueField]: value,
      [labelField]: matched?.label || "",
    }));
  };

  const resetCreateForm = () => setForm(createDefaultForm());

  const createOpportunity = async () => {
    if (!form.eventName.trim() || !form.accountName.trim()) {
      alert("Nombre del evento y nombre de la cuenta son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const details: Record<string, unknown> = {
        infoBasica: {
          moneda: form.currency,
          valorOportunidad: form.opportunityValue ? Number(form.opportunityValue) : null,
          nombreCuenta: form.accountName,
          contactosRelacionados: form.relatedContacts,
          procesoOportunidadVenta: form.salesProcess,
          etapaOportunidadVenta: form.salesStage,
          propietarioVentas: {
            id: form.salesOwnerId,
            nombre: form.salesOwnerName,
          },
          segmentoOportunidad: {
            id: form.opportunitySegmentId,
            nombre: form.opportunitySegmentName,
          },
          eventoICCA: form.iccaEvent,
          eventoSostenible: form.sustainableEvent,
          buildingBlock: form.buildingBlock,
          idEventoSkill: form.skillEventId,
          generadoPorVisita: form.generatedByVisit,
          rfp: form.rfp,
          territorio: form.territory,
        },
        detallesEvento: {
          fechaInicio: form.startDate,
          fechaFinal: form.endDate,
          fechaMontaje: form.setupDate,
          fechaDesmontaje: form.teardownDate,
          tipologiaEvento: {
            id: form.eventTypeId,
            nombre: form.eventTypeName,
          },
          caracterEvento: form.eventCharacter,
          tamanoEvento: {
            id: form.eventSizeId,
            nombre: form.eventSizeName,
          },
          numeroAsistentesEstimados: form.estimatedAttendees,
          sectorEconomicoEvento: {
            id: form.economicSectorId,
            nombre: form.economicSectorName,
          },
          periodicidad: form.periodicity,
          tipoMontaje: {
            id: form.setupTypeId,
            nombre: form.setupTypeName,
          },
          requerimientosGastronomicos: form.gastronomicRequirements,
          requerimientosEquiposAudiovisuales: form.audiovisualRequirements,
          requerimientosTecnologia: form.technologyRequirements,
          observacionesGeneralesEvento: form.eventGeneralObservations,
        },
        pagos: {
          formaPago: form.paymentMethod,
          primerPago: form.firstPayment,
          segundoPago: form.secondPayment,
          tercerPago: form.thirdPayment,
          pagoSaldo: form.balancePayment,
          pazYSalvo: form.pazYSalvo,
        },
        informacionOAE: {
          nombreEventoRelacionado: form.relatedEventNameOAE,
          numeroStand: form.standNumber,
        },
        investigacionOportunidades: {
          canalIngreso: form.incomeChannel,
          idIcca: form.iccaId,
          proyeccionImpactoEconomico: form.economicImpactProjection,
          microsector: form.microsector,
          calificacionOportunidad: form.opportunityQualification,
          frecuencia: form.frequency,
          areaRotacion: form.rotationArea,
          ultimaEdicion: form.lastEdition,
          proximaEdicion: form.nextEdition,
          edicionPotencialGH: form.potentialEditionForGH,
          eventoCaptado: form.capturedEvent,
          negociosHeroicos: form.heroicBusiness,
        },
      };

      await crmService.createOpportunity(selectedDb, {
        title: form.eventName.trim(),
        stage: mapSalesStageToOpportunityStage(form.salesStage),
        estimatedValue: form.opportunityValue ? Number(form.opportunityValue) : undefined,
        expectedCloseDate: form.endDate || undefined,
        owner: form.salesOwnerName || undefined,
        notes: form.notes || undefined,
        details,
        client: {
          name: form.accountName.trim(),
          tradeName: form.accountName.trim(),
        },
      });

      setCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error("Error al crear oportunidad:", error);
      alert("No fue posible crear la oportunidad.");
    } finally {
      setSaving(false);
    }
  };

  const openLinkDialog = (opportunity: Opportunity) => {
    setLinkingOpportunity(opportunity);
    setEventIdInput(opportunity.linkedSkillEvent?.eventNumber || "");
    setLinkDialogOpen(true);
  };

  const linkOpportunityByEventId = async (
    opportunity: Opportunity,
    eventId: string
  ) => {
    const normalizedEventId = eventId.trim();
    if (!normalizedEventId) {
      throw new Error("Debes indicar el ID de evento de Skill.");
    }

    const events = await apiService.getEvents(undefined, undefined, normalizedEventId);
    const rawEvent =
      events.find(
        (event: any) =>
          String(event?.idEvent ?? "") === normalizedEventId ||
          String(event?.eventNumber ?? "") === normalizedEventId
      ) || events[0];

    if (!rawEvent) {
      throw new Error("No se encontró el evento en Skill con ese ID.");
    }

    const quote = await apiService.getEventQuote(String(rawEvent?.idEvent));
    const quoteAmount = resolveEventQuoteGrandTotal(rawEvent, quote);

    await crmService.linkOpportunityToSkillEvent(selectedDb, opportunity.id, {
      eventNumber: String(rawEvent?.eventNumber || rawEvent?.idEvent || normalizedEventId),
      title: String(rawEvent?.title || "Sin título"),
      ...(Number.isFinite(quoteAmount) && quoteAmount > 0
        ? { quoteAmount }
        : {}),
    });
  };

  const linkToSkillEvent = async () => {
    if (!linkingOpportunity || !eventIdInput.trim()) return;

    setLinkingSkillEvent(true);
    try {
      await linkOpportunityByEventId(linkingOpportunity, eventIdInput);
      setLinkDialogOpen(false);
      setLinkingOpportunity(null);
      setEventIdInput("");
    } catch (error) {
      console.error("Error enlazando oportunidad a Skill:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo enlazar la oportunidad con el evento en Skill."
      );
    } finally {
      setLinkingSkillEvent(false);
    }
  };

  const handleStageChange = async (
    opportunity: Opportunity,
    newStage: OpportunityStage
  ) => {
    if (opportunity.stage === newStage) return;

    if (newStage === "cotizadoSkill") {
      openLinkDialog(opportunity);
      return;
    }

    try {
      await crmService.changeOpportunityStage(
        selectedDb,
        opportunity.id,
        newStage,
        `Cambio de etapa: ${CRM_STAGE_LABELS[newStage]}`
      );
    } catch (error) {
      console.error("Error cambiando etapa:", error);
      alert("No se pudo actualizar la etapa.");
    }
  };

  const handleDeleteOpportunity = async (opportunity: Opportunity) => {
    const confirmed = confirm(
      `¿Deseas eliminar la oportunidad \"${opportunity.title}\"?`
    );
    if (!confirmed) return;

    try {
      await crmService.deleteOpportunity(selectedDb, opportunity.id);
    } catch (error) {
      console.error("Error eliminando oportunidad:", error);
      alert("No se pudo eliminar la oportunidad.");
    }
  };

  const handleCreateClientInSkill = async (opportunity: Opportunity) => {
    setCreatingClientInSkillId(opportunity.id);

    try {
      const response = await apiService.createClient({
        clientName: opportunity.client.name,
        tradeName: opportunity.client.tradeName,
        legalName: opportunity.client.tradeName || opportunity.client.name,
      });

      const idClient =
        (response as any)?.result?.client?.idClient ??
        (response as any)?.result?.idClient;
      const clientCode =
        (response as any)?.result?.client?.clientCode ??
        (response as any)?.result?.clientCode;

      await crmService.markClientCreatedInSkill(selectedDb, opportunity.id, {
        idClient: typeof idClient === "number" ? idClient : undefined,
        clientCode: typeof clientCode === "string" ? clientCode : undefined,
      });

      alert("Cliente creado/marcado en Skill correctamente.");
    } catch (error) {
      console.error("Error creando cliente en Skill:", error);
      alert(
        "No se pudo crear automáticamente el cliente en Skill. Puedes intentarlo de nuevo o registrarlo manualmente desde Skill."
      );
    } finally {
      setCreatingClientInSkillId("");
    }
  };

  const handleAddNote = async () => {
    if (!selectedOpportunity || !noteText.trim()) return;

    try {
      await crmService.addOpportunityNote(
        selectedDb,
        selectedOpportunity.id,
        noteText.trim()
      );
      setNoteText("");
    } catch (error) {
      console.error("Error agregando nota:", error);
      alert("No se pudo guardar la nota.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Analítica comercial, seguimiento de oportunidades y timeline de avance.
            </p>
          </div>

          <div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva oportunidad
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total oportunidades</p>
                  <p className="text-2xl font-semibold">{opportunities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Oportunidades USD</p>
                  <p className="text-lg font-semibold">
                    {formatCurrencyUSD(stats.totalUSD)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">ICCA / Sostenible</p>
                  <p className="text-lg font-semibold">
                    {stats.iccaEvents} / {stats.sustainableEvents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Oportunidades cotizadas en Skill
                  </p>
                  <p className="text-2xl font-semibold">{stats.quotedInSkill}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Tracking de oportunidades</CardTitle>
                  <CardDescription>
                    Gestión por etapa y acciones comerciales.
                  </CardDescription>
                </div>
                <div className="w-full md:w-60">
                  <Label htmlFor="crm-filter">Filtrar por etapa</Label>
                  <Select
                    id="crm-filter"
                    value={listFilter}
                    onChange={(event) =>
                      setListFilter(
                        (event.target as HTMLSelectElement).value as
                          | "all"
                          | OpportunityStage
                      )
                    }
                  >
                    <option value="all">Todas</option>
                    {CRM_STAGE_OPTIONS.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  No hay oportunidades para el filtro seleccionado.
                </p>
              ) : (
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  {filteredOpportunities.map((item) => {
                    const selected = selectedOpportunity?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 ${
                          selected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.client.tradeName || item.client.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  STAGE_BADGE_CLASS[item.stage]
                                }`}
                              >
                                {CRM_STAGE_LABELS[item.stage]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrencyUSD(item.estimatedValue)}
                              </span>
                              {item.linkedSkillEvent?.eventNumber && (
                                <span className="text-xs text-muted-foreground">
                                  Skill #{item.linkedSkillEvent.eventNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOpportunity(item)}
                            >
                              Ver tracking
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLinkDialog(item)}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Enlazar ID Evento
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateClientInSkill(item)}
                              disabled={creatingClientInSkillId === item.id}
                            >
                              <UserRoundCheck className="h-4 w-4 mr-1" />
                              {creatingClientInSkillId === item.id
                                ? "Creando..."
                                : "Crear cliente Skill"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteOpportunity(item)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Etapa</Label>
                            <Select
                              value={item.stage}
                              onChange={(event) =>
                                handleStageChange(
                                  item,
                                  (event.target as HTMLSelectElement)
                                    .value as OpportunityStage
                                )
                              }
                            >
                              {CRM_STAGE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label>Actualización</Label>
                            <p className="text-sm text-muted-foreground rounded-md border border-border px-3 py-2 h-10 flex items-center">
                              {formatDateTime(item.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis por etapa de oportunidad</CardTitle>
              <CardDescription>
                Distribución según la etapa comercial del formulario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.byStage.map((row) => {
                const percent =
                  opportunities.length > 0 ? (row.count / opportunities.length) * 100 : 0;

                return (
                  <div key={row.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="text-muted-foreground">
                        {row.count} · {percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-2 bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
                <p>Cotizadas en Skill: {stats.quotedInSkill}</p>
                <p>
                  Territorio principal: {stats.topTerritory}
                  {stats.topTerritoryCount > 0 ? ` (${stats.topTerritoryCount})` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
            <CardDescription>
              {selectedOpportunity
                ? `${selectedOpportunity.title} · ${selectedOpportunity.client.name}`
                : "Selecciona una oportunidad para ver su historial"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedOpportunity ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay una oportunidad seleccionada.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <Input
                    value={noteText}
                    placeholder="Agregar comentario de seguimiento"
                    onInput={(event) =>
                      setNoteText((event.target as HTMLInputElement).value)
                    }
                  />
                  <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Agregar nota
                  </Button>
                </div>

                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Esta oportunidad todavía no tiene historial.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex gap-3 rounded-md border border-border p-3"
                      >
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{entry.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.createdAt)}
                            {entry.stage ? ` · ${CRM_STAGE_LABELS[entry.stage]}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        panelClassName="max-w-6xl"
      >
        <DialogContent>
          <DialogHeader onClose={() => setCreateModalOpen(false)}>
            <div>
              <DialogTitle>Nueva oportunidad</DialogTitle>
              <DialogDescription>
                Formulario CRM en secciones para el registro integral de la oportunidad.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {loadingLookups && (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Spinner size="sm" /> Cargando catálogos de Skill...
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del evento</Label>
                  <Input
                    value={form.eventName}
                    onInput={(event) =>
                      updateFormField("eventName", (event.target as HTMLInputElement).value)
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select
                      value={form.currency}
                      onChange={(event) =>
                        updateFormField("currency", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="COP">COP</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor de oportunidad de venta</Label>
                    <Input
                      type="number"
                      value={form.opportunityValue}
                      onInput={(event) =>
                        updateFormField(
                          "opportunityValue",
                          (event.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de la Cuenta</Label>
                  <Input
                    value={form.accountName}
                    onInput={(event) =>
                      updateFormField("accountName", (event.target as HTMLInputElement).value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contactos relacionados</Label>
                  <Input
                    value={form.relatedContacts}
                    onInput={(event) =>
                      updateFormField(
                        "relatedContacts",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Proceso de Oportunidad de Venta</Label>
                    <Select
                      value={form.salesProcess}
                      onChange={(event) =>
                        updateFormField("salesProcess", (event.target as HTMLSelectElement).value)
                      }
                    >
                      {SALES_PROCESS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Etapa de Oportunidad de venta</Label>
                    <Select
                      value={form.salesStage}
                      onChange={(event) =>
                        updateFormField("salesStage", (event.target as HTMLSelectElement).value)
                      }
                    >
                      {SALES_STAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Propietario de ventas</Label>
                    <Select
                      value={form.salesOwnerId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "salesOwnerId",
                          "salesOwnerName",
                          (event.target as HTMLSelectElement).value,
                          salesOwnerOptions
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {salesOwnerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento de oportunidad</Label>
                    <Select
                      value={form.opportunitySegmentId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "opportunitySegmentId",
                          "opportunitySegmentName",
                          (event.target as HTMLSelectElement).value,
                          OPPORTUNITY_SEGMENT_OPTIONS
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {OPPORTUNITY_SEGMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Evento ICCA"
                    checked={form.iccaEvent}
                    onChange={(checked) => updateFormFlag("iccaEvent", checked)}
                  />
                  <CheckboxField
                    label="Evento Sostenible"
                    checked={form.sustainableEvent}
                    onChange={(checked) =>
                      updateFormFlag("sustainableEvent", checked)
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Building Block</Label>
                    <Select
                      value={form.buildingBlock}
                      onChange={(event) =>
                        updateFormField("buildingBlock", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {BUILDING_BLOCK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ID del Evento</Label>
                    <Input
                      value={form.skillEventId}
                      onInput={(event) =>
                        updateFormField("skillEventId", (event.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Generado por visita"
                    checked={form.generatedByVisit}
                    onChange={(checked) => updateFormFlag("generatedByVisit", checked)}
                  />
                  <CheckboxField
                    label="RFP"
                    checked={form.rfp}
                    onChange={(checked) => updateFormFlag("rfp", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Territorio</Label>
                  <Select
                    value={form.territory}
                    onChange={(event) =>
                      updateFormField("territory", (event.target as HTMLSelectElement).value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    {TERRITORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detalles del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de inicio</Label>
                    <DatePicker
                      value={form.startDate}
                      onChange={(value) => updateFormField("startDate", value)}
                      placeholder="Seleccione una fecha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha final</Label>
                    <DatePicker
                      value={form.endDate}
                      onChange={(value) => updateFormField("endDate", value)}
                      placeholder="Seleccione una fecha"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de montaje</Label>
                    <DatePicker
                      value={form.setupDate}
                      onChange={(value) => updateFormField("setupDate", value)}
                      placeholder="Seleccione una fecha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de desmontaje</Label>
                    <DatePicker
                      value={form.teardownDate}
                      onChange={(value) => updateFormField("teardownDate", value)}
                      placeholder="Seleccione una fecha"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipología Evento</Label>
                    <Select
                      value={form.eventTypeId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "eventTypeId",
                          "eventTypeName",
                          (event.target as HTMLSelectElement).value,
                          eventTypeOptions
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {eventTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Carácter del Evento</Label>
                    <Input
                      value={form.eventCharacter}
                      onInput={(event) =>
                        updateFormField(
                          "eventCharacter",
                          (event.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tamaño del Evento</Label>
                    <Select
                      value={form.eventSizeId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "eventSizeId",
                          "eventSizeName",
                          (event.target as HTMLSelectElement).value,
                          eventSizeOptions
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {eventSizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de asistentes estimados</Label>
                    <Input
                      type="number"
                      value={form.estimatedAttendees}
                      onInput={(event) =>
                        updateFormField(
                          "estimatedAttendees",
                          (event.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sector Económico del evento</Label>
                    <Select
                      value={form.economicSectorId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "economicSectorId",
                          "economicSectorName",
                          (event.target as HTMLSelectElement).value,
                          eventSectorOptions
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {eventSectorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Periodicidad</Label>
                    <Select
                      value={form.periodicity}
                      onChange={(event) =>
                        updateFormField("periodicity", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {PERIODICITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Montaje</Label>
                    <Select
                      value={form.setupTypeId}
                      onChange={(event) =>
                        handleSelectWithLabel(
                          "setupTypeId",
                          "setupTypeName",
                          (event.target as HTMLSelectElement).value,
                          setupTypeOptions
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {setupTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Requerimientos Gastronómicos</Label>
                    <Select
                      value={form.gastronomicRequirements}
                      onChange={(event) =>
                        updateFormField(
                          "gastronomicRequirements",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {GASTRONOMIC_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Requerimientos Equipos Audiovisuales</Label>
                    <Select
                      value={form.audiovisualRequirements}
                      onChange={(event) =>
                        updateFormField(
                          "audiovisualRequirements",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Requerimientos Tecnología</Label>
                    <Select
                      value={form.technologyRequirements}
                      onChange={(event) =>
                        updateFormField(
                          "technologyRequirements",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {TECHNOLOGY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observaciones Generales del evento</Label>
                  <Textarea
                    value={form.eventGeneralObservations}
                    onInput={(event) =>
                      updateFormField(
                        "eventGeneralObservations",
                        (event.target as HTMLTextAreaElement).value
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pagos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Forma de Pago</Label>
                    <Select
                      value={form.paymentMethod}
                      onChange={(event) =>
                        updateFormField("paymentMethod", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Primer pago</Label>
                    <Select
                      value={form.firstPayment}
                      onChange={(event) =>
                        updateFormField("firstPayment", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Segundo pago</Label>
                    <Select
                      value={form.secondPayment}
                      onChange={(event) =>
                        updateFormField(
                          "secondPayment",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tercer pago</Label>
                    <Select
                      value={form.thirdPayment}
                      onChange={(event) =>
                        updateFormField("thirdPayment", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pago saldo</Label>
                    <Select
                      value={form.balancePayment}
                      onChange={(event) =>
                        updateFormField(
                          "balancePayment",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Paz y Salvo</Label>
                    <Select
                      value={form.pazYSalvo}
                      onChange={(event) =>
                        updateFormField("pazYSalvo", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información OAE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del evento relacionado</Label>
                  <Input
                    value={form.relatedEventNameOAE}
                    onInput={(event) =>
                      updateFormField(
                        "relatedEventNameOAE",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número del stand</Label>
                  <Input
                    value={form.standNumber}
                    onInput={(event) =>
                      updateFormField("standNumber", (event.target as HTMLInputElement).value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Investigación de Oportunidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Canal de ingreso</Label>
                    <Select
                      value={form.incomeChannel}
                      onChange={(event) =>
                        updateFormField("incomeChannel", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {INCOME_CHANNEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ID ICCA</Label>
                    <Input
                      value={form.iccaId}
                      onInput={(event) =>
                        updateFormField("iccaId", (event.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Proyección de impacto económico</Label>
                  <Input
                    type="number"
                    value={form.economicImpactProjection}
                    onInput={(event) =>
                      updateFormField(
                        "economicImpactProjection",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Microsector</Label>
                    <Select
                      value={form.microsector}
                      onChange={(event) =>
                        updateFormField("microsector", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {MICROSECTOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Calificación de la Oportunidad</Label>
                    <Select
                      value={form.opportunityQualification}
                      onChange={(event) =>
                        updateFormField(
                          "opportunityQualification",
                          (event.target as HTMLSelectElement).value
                        )
                      }
                    >
                      <option value="">Seleccionar</option>
                      {QUALIFICATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <Select
                      value={form.frequency}
                      onChange={(event) =>
                        updateFormField("frequency", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Área de Rotación</Label>
                    <Select
                      value={form.rotationArea}
                      onChange={(event) =>
                        updateFormField("rotationArea", (event.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {ROTATION_AREA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Última Edición</Label>
                  <Textarea
                    value={form.lastEdition}
                    onInput={(event) =>
                      updateFormField("lastEdition", (event.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Próxima Edición</Label>
                  <Textarea
                    value={form.nextEdition}
                    onInput={(event) =>
                      updateFormField("nextEdition", (event.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Edición potencial para GH</Label>
                  <Input
                    value={form.potentialEditionForGH}
                    onInput={(event) =>
                      updateFormField(
                        "potentialEditionForGH",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Evento Captado"
                    checked={form.capturedEvent}
                    onChange={(checked) => updateFormFlag("capturedEvent", checked)}
                  />
                  <CheckboxField
                    label="Negocios Heroicos"
                    checked={form.heroicBusiness}
                    onChange={(checked) => updateFormFlag("heroicBusiness", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas generales</Label>
                  <Textarea
                    value={form.notes}
                    onInput={(event) =>
                      updateFormField("notes", (event.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetCreateForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={createOpportunity} disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Crear oportunidad"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader onClose={() => setLinkDialogOpen(false)}>
            <div>
              <DialogTitle>Enlazar oportunidad con Skill</DialogTitle>
              <DialogDescription>
                Ingresa el ID de Evento para sincronizar cotización y valor estimado en
                USD.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>ID de Evento en Skill</Label>
              <Input
                value={eventIdInput}
                onInput={(event) =>
                  setEventIdInput((event.target as HTMLInputElement).value)
                }
                placeholder="Ej. 10234"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={linkToSkillEvent}
              disabled={!eventIdInput.trim() || !linkingOpportunity || linkingSkillEvent}
            >
              {linkingSkillEvent ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Enlazando...
                </>
              ) : (
                "Enlazar evento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
