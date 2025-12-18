import type { Event } from "../services/api.service";

export const STATUS_DEFINITIONS = [
  { id: "confirmado", label: "Confirmado", colorClass: "bg-yellow-400" },
  { id: "porConfirmar", label: "Por Confirmar", colorClass: "bg-blue-900" },
  { id: "opcion1", label: "Opción 1", colorClass: "bg-gray-400" },
  { id: "opcion2", label: "Opción 2", colorClass: "bg-gray-500" },
  { id: "opcion3", label: "Opción 3", colorClass: "bg-gray-600" },
  {
    id: "reunionInterna",
    label: "Reunión Interna",
    colorClass: "bg-orange-500",
  },
  { id: "eventoInterno", label: "Evento Interno", colorClass: "bg-orange-500" },
  { id: "cancelado", label: "Cancelado", colorClass: "bg-red-500" },
  { id: "otros", label: "Otros", colorClass: "bg-green-500" },
] as const;

export type StatusCategory = (typeof STATUS_DEFINITIONS)[number]["id"];

export const STATUS_DEFINITION_MAP = STATUS_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.id] = definition;
    return acc;
  },
  {} as Record<StatusCategory, (typeof STATUS_DEFINITIONS)[number]>
);

// Filtros por defecto (todos activos excepto "cancelado")
export const DEFAULT_STATUS_FILTERS: Record<StatusCategory, boolean> = {
  confirmado: true,
  porConfirmar: true,
  opcion1: true,
  opcion2: true,
  opcion3: true,
  reunionInterna: true,
  eventoInterno: true,
  cancelado: false,
  otros: true,
};

export const getEventStatusText = (event: Event) => {
  const rawEvent = event as any;

  // Recolectar todos los estados de las actividades
  const activityStatuses: string[] = [];

  if (Array.isArray(rawEvent?.activities)) {
    rawEvent.activities.forEach((activity: any) => {
      const statusText =
        activity?.eventStatus?.eventStatusDescription ??
        activity?.eventStatus?.eventStatusName ??
        activity?.eventStatusName ??
        activity?.statusDescription ??
        activity?.statusName ??
        activity?.status ??
        "";

      if (statusText && typeof statusText === "string" && statusText.trim()) {
        activityStatuses.push(statusText.trim());
      }
    });
  }

  // Si no hay actividades con estado, usar el estado del evento directamente
  if (activityStatuses.length === 0) {
    const candidate =
      rawEvent?.eventStatus?.eventStatusDescription ??
      rawEvent?.eventStatusDescription ??
      rawEvent?.eventStatus?.eventStatusName ??
      rawEvent?.eventStatusName ??
      rawEvent?.statusDescription ??
      rawEvent?.statusName ??
      rawEvent?.status ??
      "";
    return typeof candidate === "string" ? candidate : "";
  }

  // Aplicar la misma lógica de prioridad que classifyEventStatus

  // REGLA 1: Si AL MENOS UNA actividad es "Confirmado" → Retornar "Confirmado"
  const hasConfirmado = activityStatuses.some((status) => {
    const normalized = status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (
      normalized.includes("confirmado") && !normalized.includes("confirmar")
    );
  });

  if (hasConfirmado) {
    // Buscar y retornar el texto exacto de "Confirmado" como viene del API
    return (
      activityStatuses.find((status) => {
        const normalized = status
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return (
          normalized.includes("confirmado") && !normalized.includes("confirmar")
        );
      }) || "Confirmado"
    );
  }

  // REGLA 2: Si TODAS las actividades son "Cancelado" → Retornar "Cancelado"
  const allCancelado = activityStatuses.every((status) => {
    const normalized = status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalized.includes("cancelado") || normalized.includes("cancelada");
  });

  if (allCancelado) {
    return activityStatuses[0]; // Retornar el texto original
  }

  // REGLA 3: Si TODAS las actividades tienen el mismo estado → Retornar ese estado
  const firstStatus = activityStatuses[0];
  const allSame = activityStatuses.every((status) => {
    const norm1 = status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const norm2 = firstStatus
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return norm1 === norm2;
  });

  if (allSame) {
    return firstStatus;
  }

  // REGLA 4: Estados mixtos (sin confirmado)
  // Preferir el primer estado que NO sea "cancelado" si existe. Esto
  // garantiza que, aunque la mayoría de actividades estén canceladas,
  // si hay alguna actividad "por confirmar" u otra relevante, el
  // evento refleje ese estado en lugar de "cancelado".
  const firstNonCancelled = activityStatuses.find((status) => {
    const normalized = status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return !(
      normalized.includes("cancelado") || normalized.includes("cancelada")
    );
  });

  if (firstNonCancelled) return firstNonCancelled;

  return firstStatus;
};

/**
 * Helper: Normaliza y clasifica un texto de estado individual
 */
const classifyStatusText = (statusText: string): StatusCategory => {
  const normalized = statusText
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const normalizedCompact = normalized.replace(/\s+/g, "");

  if (!normalized) {
    return "otros";
  }

  if (normalized.includes("cancelado") || normalized.includes("cancelada")) {
    return "cancelado";
  }

  if (
    (normalized.includes("reunion") && normalized.includes("interna")) ||
    normalizedCompact.includes("reunioninterna")
  ) {
    return "reunionInterna";
  }

  // Algunas APIs devuelven "Reserva Interna" u otras variantes que operativamente
  // deben considerarse como reunión/evento interno. Mapear aquí.
  if (
    (normalized.includes("reserva") && normalized.includes("interna")) ||
    normalizedCompact.includes("reservainterna")
  ) {
    return "reunionInterna";
  }

  if (
    (normalized.includes("evento") && normalized.includes("interno")) ||
    normalizedCompact.includes("eventointerno")
  ) {
    return "eventoInterno";
  }

  if (
    normalized.includes("opcion 3") ||
    normalizedCompact.includes("opcion3")
  ) {
    return "opcion3";
  }

  if (
    normalized.includes("opcion 2") ||
    normalizedCompact.includes("opcion2")
  ) {
    return "opcion2";
  }

  if (
    normalized.includes("opcion 1") ||
    normalizedCompact.includes("opcion1")
  ) {
    return "opcion1";
  }

  if (
    normalized.includes("por confirmar") ||
    normalized.includes("confirmar")
  ) {
    return "porConfirmar";
  }

  if (normalized.includes("confirmado") && !normalized.includes("confirmar")) {
    return "confirmado";
  }

  return "otros";
};

/**
 * Clasifica el estado del evento basándose en las actividades
 *
 * Lógica de prioridad:
 * 1. Si AL MENOS UNA actividad es "Confirmado" → Evento = Confirmado
 * 2. Si TODAS las actividades son "Cancelado" → Evento = Cancelado
 * 3. Si TODAS las actividades tienen el mismo estado → Evento = Ese estado
 * 4. Si hay estados mixtos (sin confirmado) → Toma el primer estado encontrado
 */
export const classifyEventStatus = (event: Event): StatusCategory => {
  const rawEvent = event as any;

  // Recolectar todos los estados de las actividades con logs
  const activityStatuses: StatusCategory[] = [];
  const activityStatusDetails: Array<{
    raw: string;
    classified: StatusCategory;
  }> = [];

  if (Array.isArray(rawEvent?.activities)) {
    rawEvent.activities.forEach((activity: any, idx: number) => {
      const statusText =
        activity?.eventStatus?.eventStatusDescription ??
        activity?.eventStatus?.eventStatusName ??
        activity?.eventStatusName ??
        activity?.statusDescription ??
        activity?.statusName ??
        activity?.status ??
        "";

      if (statusText && typeof statusText === "string" && statusText.trim()) {
        const classified = classifyStatusText(statusText);
        activityStatuses.push(classified);
        activityStatusDetails.push({ raw: statusText, classified });
      } else {
        console.warn(
          `[classifyEventStatus] Actividad ${idx} del evento ${rawEvent?.idEvent} sin estado válido:`,
          activity
        );
      }
    });
  }

  // Log para depuración
  if (rawEvent?.idEvent) {
    console.log(
      `[classifyEventStatus] Evento #${rawEvent.idEvent} (${rawEvent?.title}):`,
      {
        totalActivities: rawEvent?.activities?.length ?? 0,
        activityStatusesFound: activityStatuses.length,
        statusDetails: activityStatusDetails,
        uniqueStatuses: [...new Set(activityStatuses)],
      }
    );
  }

  // Si no hay actividades, usar el estado del evento directamente
  if (activityStatuses.length === 0) {
    const eventStatusText = getEventStatusText(event);
    const classified = classifyStatusText(eventStatusText);
    console.log(
      `[classifyEventStatus] Evento #${rawEvent?.idEvent} sin actividades válidas, usando estado del evento: "${eventStatusText}" → ${classified}`
    );
    return classified;
  }

  // REGLA 1: Si AL MENOS UNA actividad es "Confirmado" → Evento = Confirmado
  if (activityStatuses.includes("confirmado")) {
    console.log(
      `[classifyEventStatus] Evento #${rawEvent?.idEvent} tiene al menos una actividad CONFIRMADA → CONFIRMADO`
    );
    return "confirmado";
  }

  // REGLA 2: Si TODAS las actividades son "Cancelado" → Evento = Cancelado
  const allCanceled = activityStatuses.every(
    (status) => status === "cancelado"
  );
  if (allCanceled) {
    console.log(
      `[classifyEventStatus] Evento #${rawEvent?.idEvent} tiene TODAS las actividades CANCELADAS → CANCELADO`
    );
    return "cancelado";
  }

  // REGLA 3: Si TODAS las actividades tienen el mismo estado → Evento = Ese estado
  const firstStatus = activityStatuses[0];
  const allSameStatus = activityStatuses.every(
    (status) => status === firstStatus
  );
  if (allSameStatus) {
    console.log(
      `[classifyEventStatus] Evento #${rawEvent?.idEvent} tiene TODAS las actividades con estado ${firstStatus} → ${firstStatus}`
    );
    return firstStatus;
  }

  // REGLA 4: Estados mixtos (sin confirmado y sin todas cancelado)
  // Preferir el primer estado que NO sea "cancelado" si existe, de manera
  // que eventos con mayoría de actividades canceladas pero con alguna
  // actividad "por confirmar" u otro estado relevante se muestren con
  // ese estado en lugar de "cancelado".
  const firstNonCanceled = activityStatuses.find((s) => s !== "cancelado");
  if (firstNonCanceled) {
    console.log(
      `[classifyEventStatus] Evento #${rawEvent?.idEvent} tiene estados MIXTOS → tomando primer estado NO-CANCELADO: ${firstNonCanceled}`
    );
    return firstNonCanceled;
  }

  console.log(
    `[classifyEventStatus] Evento #${rawEvent?.idEvent} tiene estados MIXTOS → tomando primer estado: ${firstStatus}`
  );
  return firstStatus;
};

export const getStatusColorByCategory = (category: StatusCategory) =>
  STATUS_DEFINITION_MAP[category]?.colorClass ?? "bg-green-500";

export const getEventStatusColor = (event: Event) =>
  getStatusColorByCategory(classifyEventStatus(event));

const SEGMENT_FALLBACK_LABEL = "Sin segmento";
const SEGMENT_FALLBACK_KEY = "__sin_segmento";

const normalizeKey = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const getEventMarketSegmentText = (event: Event) => {
  const rawEvent = event as any;

  const candidate =
    rawEvent?.marketSegmentName ??
    rawEvent?.marketSegment?.marketSegmentName ??
    rawEvent?.eventMarketSegmentName ??
    rawEvent?.eventMarketSegment?.marketSegmentName ??
    rawEvent?.marketSegment?.name ??
    rawEvent?.eventMarketSegment?.name ??
    rawEvent?.marketSegmentDescription ??
    rawEvent?.marketSegment ??
    "";

  return typeof candidate === "string" ? candidate.trim() : "";
};

export const getEventMarketSegmentKey = (event: Event) => {
  const segment = getEventMarketSegmentText(event);
  if (!segment) {
    return SEGMENT_FALLBACK_KEY;
  }

  return getMarketSegmentKeyFromLabel(segment);
};

export const collectMarketSegments = (events: Event[]) => {
  const segmentMap = new Map<string, string>();

  events.forEach((event) => {
    const rawLabel = getEventMarketSegmentText(event);
    const label = rawLabel || SEGMENT_FALLBACK_LABEL;
    const key = getEventMarketSegmentKey(event);

    if (!segmentMap.has(key)) {
      segmentMap.set(
        key,
        key === SEGMENT_FALLBACK_KEY ? SEGMENT_FALLBACK_LABEL : label
      );
    }
  });

  if (segmentMap.size === 0) {
    return [] as Array<{ key: string; label: string }>;
  }

  return Array.from(segmentMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
};

export const getSegmentLabelByKey = (key: string) =>
  key === SEGMENT_FALLBACK_KEY ? SEGMENT_FALLBACK_LABEL : undefined;

export const SEGMENT_FILTER_DEFAULTS = {
  FALLBACK_KEY: SEGMENT_FALLBACK_KEY,
  FALLBACK_LABEL: SEGMENT_FALLBACK_LABEL,
};

export type SegmentOption = { key: string; label: string };

export const getMarketSegmentKeyFromLabel = (label: string) => {
  const normalized = normalizeKey(label || "");

  if (!normalized) {
    return SEGMENT_FALLBACK_KEY;
  }

  const compact = normalized.replace(/-/g, "");

  if (
    (compact.includes("reserva") && compact.includes("interna")) ||
    (compact.includes("reunion") && compact.includes("interna"))
  ) {
    return "reunion-interna";
  }

  return normalized;
};

export const buildSegmentOption = (label: string): SegmentOption => ({
  key: getMarketSegmentKeyFromLabel(label),
  label: label.trim() || SEGMENT_FALLBACK_LABEL,
});

export const isItemCancelled = (item: any): boolean => {
  if (!item) return false;

  // 1. Check boolean flags
  if (item.isCancelled === true || item.cancelled === true) return true;

  // 2. Check specific known fields (string or object with name/desc)
  const checkString = (s: any) => {
    if (!s) return false;
    const str = typeof s === "string" ? s : s.name || s.description || "";
    if (typeof str !== "string") return false;
    const lower = str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (
      lower.includes("cancelado") ||
      lower.includes("cancelled") ||
      lower.includes("anulado")
    );
  };

  const explicitCandidates = [
    item.eventStatusDescription,
    item.eventStatus,
    item.eventStatusName,
    item.statusDescription,
    item.statusName,
    item.status,
    item.state,
    item.roomStatus,
    item.serviceStatus,
    item.roomStatusName,
    item.serviceStatusName,
  ];

  if (explicitCandidates.some(checkString)) return true;

  // 3. Dynamic check for any property looking like a status
  for (const key in item) {
    if (
      key.toLowerCase().includes("status") ||
      key.toLowerCase().includes("state")
    ) {
      if (checkString(item[key])) return true;
    }
  }

  return false;
};
