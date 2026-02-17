import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { DatePicker } from "../components/ui/datepicker";
import { Spinner } from "../components/ui/spinner";
import type { Opportunity } from "../types/crm";

export type SelectOption = { value: string; label: string };

export type OpportunityFormState = {
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

const asString = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const asBoolean = (value: unknown) => Boolean(value);

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asOptionId = (value: unknown) => asString(asObject(value).id);
const asOptionName = (value: unknown) => asString(asObject(value).nombre);

export const SALES_PROCESS_OPTIONS: SelectOption[] = [
  { value: "Embudo de Ventas", label: "Embudo de Ventas" },
  { value: "Etapas de investigación", label: "Etapas de investigación" },
];

export const SALES_STAGE_OPTIONS: SelectOption[] = [
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

export const BUILDING_BLOCK_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "Licitación", label: "Licitación" },
];

export const OPPORTUNITY_SEGMENT_OPTIONS: SelectOption[] = [
  { value: "Asociativo", label: "Asociativo" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "Gubernamental", label: "Gubernamental" },
  {
    value: "Otros Clientes: Persona Natural",
    label: "Otros Clientes: Persona Natural",
  },
];

export const TERRITORY_OPTIONS: SelectOption[] = [
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

export const PERIODICITY_OPTIONS: SelectOption[] = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Repetido", label: "Repetido" },
];

export const GASTRONOMIC_OPTIONS: SelectOption[] = [
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

export const TECHNOLOGY_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
  { value: "Cableado", label: "Cableado" },
  { value: "WiFi", label: "WiFi" },
];

export const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: "100% Anticipado", label: "100% Anticipado" },
  { value: "Anticipo y Crédito", label: "Anticipo y Crédito" },
];

export const YES_NO_OPTIONS: SelectOption[] = [
  { value: "Si", label: "Si" },
  { value: "No", label: "No" },
];

export const INCOME_CHANNEL_OPTIONS: SelectOption[] = [
  { value: "Investigación GH", label: "Investigación GH" },
  { value: "Investigación UDEI", label: "Investigación UDEI" },
  { value: "Investigación Recinto", label: "Investigación Recinto" },
];

export const MICROSECTOR_OPTIONS: SelectOption[] = [
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

export const QUALIFICATION_OPTIONS: SelectOption[] = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

export const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "Anual", label: "Anual" },
  { value: "Bienal", label: "Bienal" },
  { value: "Trienal", label: "Trienal" },
  { value: "Irregular", label: "Irregular" },
  { value: "Otro", label: "Otro" },
];

export const ROTATION_AREA_OPTIONS: SelectOption[] = [
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

export const createDefaultOpportunityForm = (): OpportunityFormState => ({
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

export const mapSalesStageToOpportunityStage = (salesStage: string) => {
  switch (salesStage) {
    case "Oportunidad Identificada":
      return "prospecto" as const;
    case "Oportunidad Gestión Comercial":
      return "contactado" as const;
    case "Propuestas Presentadas":
      return "propuesta" as const;
    case "Propuestas en Seguimiento":
      return "calificacion" as const;
    case "Negociación y contrato":
      return "negociacion" as const;
    case "Confirmado":
      return "cotizadoSkill" as const;
    case "Finalizado":
      return "ganada" as const;
    case "Perdido":
      return "perdida" as const;
    default:
      return "prospecto" as const;
  }
};

export const buildOpportunityDetails = (form: OpportunityFormState) => ({
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
});

export const mapOpportunityToForm = (opportunity: Opportunity): OpportunityFormState => {
  const details = asObject(opportunity.details);
  const infoBasica = asObject(details.infoBasica);
  const detallesEvento = asObject(details.detallesEvento);
  const pagos = asObject(details.pagos);
  const informacionOAE = asObject(details.informacionOAE);
  const investigacion = asObject(details.investigacionOportunidades);

  return {
    eventName: asString(opportunity.title),
    currency: asString(infoBasica.moneda) === "COP" ? "COP" : "USD",
    opportunityValue: asString(
      infoBasica.valorOportunidad ?? opportunity.estimatedValue ?? ""
    ),
    accountName: asString(
      infoBasica.nombreCuenta || opportunity.client.tradeName || opportunity.client.name
    ),
    relatedContacts: asString(infoBasica.contactosRelacionados),
    salesProcess: asString(infoBasica.procesoOportunidadVenta),
    salesStage: asString(infoBasica.etapaOportunidadVenta),
    salesOwnerId: asOptionId(infoBasica.propietarioVentas),
    salesOwnerName: asOptionName(infoBasica.propietarioVentas) || asString(opportunity.owner),
    opportunitySegmentId: asOptionId(infoBasica.segmentoOportunidad),
    opportunitySegmentName: asOptionName(infoBasica.segmentoOportunidad),
    iccaEvent: asBoolean(infoBasica.eventoICCA),
    sustainableEvent: asBoolean(infoBasica.eventoSostenible),
    buildingBlock: asString(infoBasica.buildingBlock),
    skillEventId: asString(infoBasica.idEventoSkill || opportunity.linkedSkillEvent?.eventNumber),
    generatedByVisit: asBoolean(infoBasica.generadoPorVisita),
    rfp: asBoolean(infoBasica.rfp),
    territory: asString(infoBasica.territorio),
    startDate: asString(detallesEvento.fechaInicio),
    endDate: asString(detallesEvento.fechaFinal || opportunity.expectedCloseDate),
    setupDate: asString(detallesEvento.fechaMontaje),
    teardownDate: asString(detallesEvento.fechaDesmontaje),
    eventTypeId: asOptionId(detallesEvento.tipologiaEvento),
    eventTypeName: asOptionName(detallesEvento.tipologiaEvento),
    eventCharacter: asString(detallesEvento.caracterEvento),
    eventSizeId: asOptionId(detallesEvento.tamanoEvento),
    eventSizeName: asOptionName(detallesEvento.tamanoEvento),
    estimatedAttendees: asString(detallesEvento.numeroAsistentesEstimados),
    economicSectorId: asOptionId(detallesEvento.sectorEconomicoEvento),
    economicSectorName: asOptionName(detallesEvento.sectorEconomicoEvento),
    periodicity: asString(detallesEvento.periodicidad),
    setupTypeId: asOptionId(detallesEvento.tipoMontaje),
    setupTypeName: asOptionName(detallesEvento.tipoMontaje),
    gastronomicRequirements: asString(detallesEvento.requerimientosGastronomicos),
    audiovisualRequirements: asString(detallesEvento.requerimientosEquiposAudiovisuales),
    technologyRequirements: asString(detallesEvento.requerimientosTecnologia),
    eventGeneralObservations: asString(detallesEvento.observacionesGeneralesEvento),
    paymentMethod: asString(pagos.formaPago),
    firstPayment: asString(pagos.primerPago),
    secondPayment: asString(pagos.segundoPago),
    thirdPayment: asString(pagos.tercerPago),
    balancePayment: asString(pagos.pagoSaldo),
    pazYSalvo: asString(pagos.pazYSalvo),
    relatedEventNameOAE: asString(informacionOAE.nombreEventoRelacionado),
    standNumber: asString(informacionOAE.numeroStand),
    incomeChannel: asString(investigacion.canalIngreso),
    iccaId: asString(investigacion.idIcca),
    economicImpactProjection: asString(investigacion.proyeccionImpactoEconomico),
    microsector: asString(investigacion.microsector),
    opportunityQualification: asString(investigacion.calificacionOportunidad),
    frequency: asString(investigacion.frecuencia),
    rotationArea: asString(investigacion.areaRotacion),
    lastEdition: asString(investigacion.ultimaEdicion),
    nextEdition: asString(investigacion.proximaEdicion),
    potentialEditionForGH: asString(investigacion.edicionPotencialGH),
    capturedEvent: asBoolean(investigacion.eventoCaptado),
    heroicBusiness: asBoolean(investigacion.negociosHeroicos),
    notes: asString(opportunity.notes),
  };
};

export const extractOption = (
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

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

function CheckboxField({ label, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <label className={`select-none ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
      <div className="flex h-10 items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40">
        <input
          type="checkbox"
          className="accent-slate-600"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange((event.target as HTMLInputElement).checked)
          }
        />
        <span>{label}</span>
      </div>
    </label>
  );
}

type OpportunityFormFieldsProps = {
  form: OpportunityFormState;
  loadingLookups?: boolean;
  readOnly?: boolean;
  salesOwnerOptions: SelectOption[];
  eventTypeOptions: SelectOption[];
  eventSizeOptions: SelectOption[];
  eventSectorOptions: SelectOption[];
  setupTypeOptions: SelectOption[];
  onFieldChange: (field: keyof OpportunityFormState, value: string) => void;
  onFlagChange: (field: keyof OpportunityFormState, value: boolean) => void;
  onSelectWithLabel: (
    valueField: keyof OpportunityFormState,
    labelField: keyof OpportunityFormState,
    value: string,
    options: SelectOption[]
  ) => void;
};

export function OpportunityFormFields({
  form,
  loadingLookups,
  readOnly,
  salesOwnerOptions,
  eventTypeOptions,
  eventSizeOptions,
  eventSectorOptions,
  setupTypeOptions,
  onFieldChange,
  onFlagChange,
  onSelectWithLabel,
}: OpportunityFormFieldsProps) {
  const isDisabled = Boolean(readOnly);

  return (
    <div className="space-y-6">
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
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("eventName", (event.target as HTMLInputElement).value)
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={form.currency}
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("currency", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onInput={(event) =>
                  onFieldChange(
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
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("accountName", (event.target as HTMLInputElement).value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Contactos relacionados</Label>
            <Input
              value={form.relatedContacts}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("relatedContacts", (event.target as HTMLInputElement).value)
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Proceso de Oportunidad de Venta</Label>
              <Select
                value={form.salesProcess}
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("salesProcess", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("salesStage", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("iccaEvent", checked)}
            />
            <CheckboxField
              label="Evento Sostenible"
              checked={form.sustainableEvent}
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("sustainableEvent", checked)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Building Block</Label>
              <Select
                value={form.buildingBlock}
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("buildingBlock", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onInput={(event) =>
                  onFieldChange("skillEventId", (event.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxField
              label="Generado por visita"
              checked={form.generatedByVisit}
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("generatedByVisit", checked)}
            />
            <CheckboxField
              label="RFP"
              checked={form.rfp}
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("rfp", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Territorio</Label>
            <Select
              value={form.territory}
              disabled={isDisabled}
              onChange={(event) =>
                onFieldChange("territory", (event.target as HTMLSelectElement).value)
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
                onChange={(value) => {
                  if (!isDisabled) onFieldChange("startDate", value);
                }}
                placeholder="Seleccione una fecha"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha final</Label>
              <DatePicker
                value={form.endDate}
                onChange={(value) => {
                  if (!isDisabled) onFieldChange("endDate", value);
                }}
                placeholder="Seleccione una fecha"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha de montaje</Label>
              <DatePicker
                value={form.setupDate}
                onChange={(value) => {
                  if (!isDisabled) onFieldChange("setupDate", value);
                }}
                placeholder="Seleccione una fecha"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de desmontaje</Label>
              <DatePicker
                value={form.teardownDate}
                onChange={(value) => {
                  if (!isDisabled) onFieldChange("teardownDate", value);
                }}
                placeholder="Seleccione una fecha"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipología Evento</Label>
              <Select
                value={form.eventTypeId}
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
                disabled={isDisabled}
                onInput={(event) =>
                  onFieldChange("eventCharacter", (event.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tamaño del Evento</Label>
              <Select
                value={form.eventSizeId}
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
                disabled={isDisabled}
                onInput={(event) =>
                  onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("periodicity", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onSelectWithLabel(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange(
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
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("paymentMethod", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("firstPayment", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("secondPayment", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("thirdPayment", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("balancePayment", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("pazYSalvo", (event.target as HTMLSelectElement).value)
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
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("relatedEventNameOAE", (event.target as HTMLInputElement).value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Número del stand</Label>
            <Input
              value={form.standNumber}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("standNumber", (event.target as HTMLInputElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("incomeChannel", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onInput={(event) =>
                  onFieldChange("iccaId", (event.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Proyección de impacto económico</Label>
            <Input
              type="number"
              value={form.economicImpactProjection}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("microsector", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange(
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("frequency", (event.target as HTMLSelectElement).value)
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
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange("rotationArea", (event.target as HTMLSelectElement).value)
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
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("lastEdition", (event.target as HTMLTextAreaElement).value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Próxima Edición</Label>
            <Textarea
              value={form.nextEdition}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("nextEdition", (event.target as HTMLTextAreaElement).value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Edición potencial para GH</Label>
            <Input
              value={form.potentialEditionForGH}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange(
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
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("capturedEvent", checked)}
            />
            <CheckboxField
              label="Negocios Heroicos"
              checked={form.heroicBusiness}
              disabled={isDisabled}
              onChange={(checked) => onFlagChange("heroicBusiness", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas generales</Label>
            <Textarea
              value={form.notes}
              disabled={isDisabled}
              onInput={(event) =>
                onFieldChange("notes", (event.target as HTMLTextAreaElement).value)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
