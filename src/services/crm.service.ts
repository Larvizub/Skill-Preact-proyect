import {
  onValue,
  push,
  ref,
  set,
  update,
  remove,
  type DataSnapshot,
} from "firebase/database";
import {
  getFirebaseDatabaseByKey,
  type FirebaseDatabaseKey,
} from "./firebase";
import type {
  CreateOpportunityInput,
  CrmDatabaseKey,
  Opportunity,
  OpportunityTimelineEntry,
  SkillClientLink,
  SkillEventLink,
  UpdateOpportunityInput,
  OpportunityStage,
} from "../types/crm";

type RawObject = Record<string, unknown>;

const toEntries = <T>(snapshot: DataSnapshot): T[] => {
  if (!snapshot.exists()) {
    return [];
  }

  const raw = snapshot.val() as Record<string, T>;
  return Object.entries(raw).map(([id, value]) => ({
    ...(value as Record<string, unknown>),
    id,
  })) as T[];
};

const nowIso = () => new Date().toISOString();

const opportunitiesPath = "crm/opportunities";

const timelinePathByOpportunity = (opportunityId: string) =>
  `crm/opportunities/${opportunityId}/timeline`;

const resolveDb = (dbKey: CrmDatabaseKey) =>
  getFirebaseDatabaseByKey(dbKey as FirebaseDatabaseKey);

const normalizeOpportunity = (item: RawObject, id: string): Opportunity => {
  const client = (item.client || {}) as Record<string, unknown>;
  const skillClient = (item.skillClient || {}) as Record<string, unknown>;
  const linkedSkillEvent = (item.linkedSkillEvent || {}) as Record<string, unknown>;

  return {
    id,
    title: String(item.title || "Sin título"),
    stage: (item.stage || "prospecto") as OpportunityStage,
    sourceDb: (item.sourceDb || "CCCR") as CrmDatabaseKey,
    estimatedValue:
      typeof item.estimatedValue === "number" ? item.estimatedValue : undefined,
    expectedCloseDate: (item.expectedCloseDate as string) || undefined,
    notes: (item.notes as string) || undefined,
    owner: (item.owner as string) || undefined,
    details:
      item.details && typeof item.details === "object"
        ? (item.details as Record<string, unknown>)
        : undefined,
    client: {
      name: String(client.name || ""),
      tradeName: (client.tradeName as string) || undefined,
      email: (client.email as string) || undefined,
      phone: (client.phone as string) || undefined,
      identification: (client.identification as string) || undefined,
    },
    linkedSkillEvent:
      linkedSkillEvent && linkedSkillEvent.eventNumber
        ? {
            eventNumber: String(linkedSkillEvent.eventNumber),
            title: (linkedSkillEvent.title as string) || undefined,
            quoteAmount:
              typeof linkedSkillEvent.quoteAmount === "number"
                ? linkedSkillEvent.quoteAmount
                : undefined,
            linkedAt: (linkedSkillEvent.linkedAt as string) || nowIso(),
          }
        : undefined,
    skillClient:
      typeof skillClient.created === "boolean"
        ? {
            created: skillClient.created as boolean,
            createdAt: (skillClient.createdAt as string) || undefined,
            idClient:
              typeof skillClient.idClient === "number"
                ? skillClient.idClient
                : undefined,
            clientCode: (skillClient.clientCode as string) || undefined,
          }
        : undefined,
    createdAt: String(item.createdAt || nowIso()),
    updatedAt: String(item.updatedAt || nowIso()),
  };
};

const createTimelineEntry = async (
  dbKey: CrmDatabaseKey,
  opportunityId: string,
  entry: Omit<OpportunityTimelineEntry, "id" | "opportunityId" | "createdAt">
) => {
  const db = resolveDb(dbKey);
  const timelineRef = ref(db, timelinePathByOpportunity(opportunityId));
  const entryRef = push(timelineRef);

  await set(entryRef, {
    ...entry,
    opportunityId,
    createdAt: nowIso(),
  });
};

export const crmService = {
  subscribeToOpportunities(
    dbKey: CrmDatabaseKey,
    callback: (items: Opportunity[]) => void,
    onError?: (error: unknown) => void
  ) {
    const db = resolveDb(dbKey);
    const opportunitiesRef = ref(db, opportunitiesPath);

    return onValue(
      opportunitiesRef,
      (snapshot) => {
        const list = toEntries<RawObject>(snapshot)
          .map((item) => normalizeOpportunity(item as RawObject, String((item as any).id)))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        callback(list);
      },
      (error) => {
        console.error("Error al suscribirse a oportunidades CRM:", error);
        onError?.(error);
      }
    );
  },

  async createOpportunity(dbKey: CrmDatabaseKey, input: CreateOpportunityInput) {
    const db = resolveDb(dbKey);
    const rootRef = ref(db, opportunitiesPath);
    const itemRef = push(rootRef);
    const id = itemRef.key;

    if (!id) {
      throw new Error("No fue posible generar el ID de la oportunidad.");
    }

    const timestamp = nowIso();
    const opportunity: Omit<Opportunity, "id"> = {
      title: input.title,
      stage: input.stage,
      sourceDb: dbKey,
      estimatedValue: input.estimatedValue,
      expectedCloseDate: input.expectedCloseDate,
      notes: input.notes,
      owner: input.owner,
      details: input.details,
      client: input.client,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await set(itemRef, opportunity);
    await createTimelineEntry(dbKey, id, {
      type: "created",
      message: "Oportunidad creada en CRM.",
      stage: input.stage,
    });

    return id;
  },

  async updateOpportunity(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    input: UpdateOpportunityInput
  ) {
    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);

    const payload: Record<string, unknown> = {
      ...input,
      updatedAt: nowIso(),
    };

    await update(itemRef, payload);
    await createTimelineEntry(dbKey, opportunityId, {
      type: "updated",
      message: "Datos de la oportunidad actualizados.",
      stage: input.stage,
    });
  },

  async changeOpportunityStage(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    stage: OpportunityStage,
    note?: string
  ) {
    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);

    await update(itemRef, {
      stage,
      updatedAt: nowIso(),
    });

    await createTimelineEntry(dbKey, opportunityId, {
      type: "stageChanged",
      message: note || `Etapa actualizada a ${stage}.`,
      stage,
    });
  },

  async linkOpportunityToSkillEvent(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    eventLink: Omit<SkillEventLink, "linkedAt">
  ) {
    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);

    const link: SkillEventLink = {
      ...eventLink,
      linkedAt: nowIso(),
    };

    await update(itemRef, {
      linkedSkillEvent: link,
      stage: "cotizadoSkill",
      ...(typeof link.quoteAmount === "number"
        ? { estimatedValue: link.quoteAmount }
        : {}),
      updatedAt: nowIso(),
    });

    await createTimelineEntry(dbKey, opportunityId, {
      type: "linkedSkillEvent",
      message:
        typeof link.quoteAmount === "number"
          ? `Enlazada al evento de Skill #${link.eventNumber}. Total cotizado: $${link.quoteAmount.toFixed(
              2
            )} USD.`
          : `Enlazada al evento de Skill #${link.eventNumber}.`,
      stage: "cotizadoSkill",
    });
  },

  async markClientCreatedInSkill(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    skillClient: Omit<SkillClientLink, "created" | "createdAt"> = {}
  ) {
    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);

    await update(itemRef, {
      skillClient: {
        created: true,
        createdAt: nowIso(),
        ...skillClient,
      },
      updatedAt: nowIso(),
    });

    await createTimelineEntry(dbKey, opportunityId, {
      type: "skillClientCreated",
      message: "Cliente marcado como creado en Skill.",
    });
  },

  async addOpportunityNote(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    message: string
  ) {
    await createTimelineEntry(dbKey, opportunityId, {
      type: "note",
      message,
    });

    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);
    await update(itemRef, {
      updatedAt: nowIso(),
    });
  },

  subscribeToTimeline(
    dbKey: CrmDatabaseKey,
    opportunityId: string,
    callback: (items: OpportunityTimelineEntry[]) => void,
    onError?: (error: unknown) => void
  ) {
    const db = resolveDb(dbKey);
    const timelineRef = ref(db, timelinePathByOpportunity(opportunityId));

    return onValue(
      timelineRef,
      (snapshot) => {
        const list = toEntries<RawObject>(snapshot)
          .map((item) => ({
            id: String((item as any).id),
            opportunityId,
            type: String((item as any).type) as OpportunityTimelineEntry["type"],
            message: String((item as any).message || ""),
            stage: (item as any).stage as OpportunityStage | undefined,
            createdAt: String((item as any).createdAt || nowIso()),
            createdBy: (item as any).createdBy as string | undefined,
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        callback(list);
      },
      (error) => {
        console.error("Error al suscribirse al timeline CRM:", error);
        onError?.(error);
      }
    );
  },

  async deleteOpportunity(dbKey: CrmDatabaseKey, opportunityId: string) {
    const db = resolveDb(dbKey);
    const itemRef = ref(db, `${opportunitiesPath}/${opportunityId}`);
    await remove(itemRef);
  },
};
