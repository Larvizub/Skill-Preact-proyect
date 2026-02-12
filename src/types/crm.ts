export type CrmDatabaseKey = "CCCR" | "CCCI" | "CEVP";

export type OpportunityStage =
  | "prospecto"
  | "contactado"
  | "calificacion"
  | "propuesta"
  | "negociacion"
  | "cotizadoSkill"
  | "ganada"
  | "perdida";

export interface OpportunityClient {
  name: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  identification?: string;
}

export interface SkillEventLink {
  eventNumber: string;
  title?: string;
  quoteAmount?: number;
  linkedAt: string;
}

export interface SkillClientLink {
  created: boolean;
  createdAt?: string;
  idClient?: number;
  clientCode?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStage;
  sourceDb: CrmDatabaseKey;
  estimatedValue?: number;
  expectedCloseDate?: string;
  notes?: string;
  owner?: string;
  details?: Record<string, unknown>;
  client: OpportunityClient;
  linkedSkillEvent?: SkillEventLink;
  skillClient?: SkillClientLink;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityTimelineEntry {
  id: string;
  opportunityId: string;
  type:
    | "created"
    | "stageChanged"
    | "note"
    | "linkedSkillEvent"
    | "skillClientCreated"
    | "updated";
  message: string;
  stage?: OpportunityStage;
  createdAt: string;
  createdBy?: string;
}

export interface CreateOpportunityInput {
  title: string;
  stage: OpportunityStage;
  estimatedValue?: number;
  expectedCloseDate?: string;
  notes?: string;
  owner?: string;
  details?: Record<string, unknown>;
  client: OpportunityClient;
}

export interface UpdateOpportunityInput {
  title?: string;
  stage?: OpportunityStage;
  estimatedValue?: number;
  expectedCloseDate?: string;
  notes?: string;
  owner?: string;
  details?: Record<string, unknown>;
  client?: OpportunityClient;
}

export const CRM_STAGE_OPTIONS: Array<{ value: OpportunityStage; label: string }> = [
  { value: "prospecto", label: "Prospecto" },
  { value: "contactado", label: "Contactado" },
  { value: "calificacion", label: "Calificación" },
  { value: "propuesta", label: "Propuesta" },
  { value: "negociacion", label: "Negociación" },
  { value: "cotizadoSkill", label: "Cotizado en Skill" },
  { value: "ganada", label: "Ganada" },
  { value: "perdida", label: "Perdida" },
];

export const CRM_STAGE_LABELS: Record<OpportunityStage, string> =
  CRM_STAGE_OPTIONS.reduce(
    (acc, option) => ({
      ...acc,
      [option.value]: option.label,
    }),
    {} as Record<OpportunityStage, string>
  );
