import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
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
import { SALES_STAGE_OPTIONS } from "./oportunidadesForm";

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

export function CRM() {
  const [selectedDb, setSelectedDb] = useState<CrmDatabaseKey>(
    authService.getRecinto() as CrmDatabaseKey
  );

  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [timeline, setTimeline] = useState<OpportunityTimelineEntry[]>([]);
  const [noteText, setNoteText] = useState("");
  const [listFilter, setListFilter] = useState<"all" | OpportunityStage>("all");

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
      ...(Number.isFinite(quoteAmount) && quoteAmount > 0 ? { quoteAmount } : {}),
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
            <h1 className="text-3xl font-bold">Oportunidades</h1>
            <p className="text-muted-foreground">
              Sección CRM para analítica comercial, seguimiento de oportunidades y timeline de avance.
            </p>
          </div>

          <div>
            <Button onClick={() => route("/crm/oportunidades/crear")}>
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
                  <p className="text-lg font-semibold">{formatCurrencyUSD(stats.totalUSD)}</p>
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
                  <CardDescription>Gestión por etapa y acciones comerciales.</CardDescription>
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
                              onClick={() => route(`/crm/oportunidades/${item.id}`)}
                            >
                              Ver detalle
                            </Button>
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
