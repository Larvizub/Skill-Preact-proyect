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
  CalendarClock,
  Link,
  UserRoundCheck,
  Plus,
  Trash2,
  MessageSquarePlus,
} from "lucide-preact";
import {
  FIREBASE_DATABASE_OPTIONS,
} from "../services/firebase";
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

type SkillEventOption = {
  eventNumber: string;
  title: string;
};

const STAGE_BADGE_CLASS: Record<OpportunityStage, string> = {
  prospecto: "bg-muted text-muted-foreground",
  contactado: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  calificacion: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  propuesta: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  negociacion: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  cotizadoSkill: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  ganada: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  perdida: "bg-red-500/10 text-red-700 dark:text-red-300",
};

const DEFAULT_FORM = {
  title: "",
  stage: "prospecto" as OpportunityStage,
  estimatedValue: "",
  expectedCloseDate: "",
  owner: "",
  notes: "",
  clientName: "",
  clientTradeName: "",
  clientEmail: "",
  clientPhone: "",
  clientIdentification: "",
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

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
  const [saving, setSaving] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [timeline, setTimeline] = useState<OpportunityTimelineEntry[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [noteText, setNoteText] = useState("");

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingOpportunity, setLinkingOpportunity] = useState<Opportunity | null>(
    null
  );
  const [eventSearchType, setEventSearchType] = useState<"eventNumber" | "eventName">(
    "eventNumber"
  );
  const [eventSearchValue, setEventSearchValue] = useState("");
  const [searchingEvents, setSearchingEvents] = useState(false);
  const [skillEvents, setSkillEvents] = useState<SkillEventOption[]>([]);
  const [selectedSkillEventNumber, setSelectedSkillEventNumber] = useState("");
  const [creatingClientInSkillId, setCreatingClientInSkillId] = useState("");

  const totalPipelineValue = useMemo(
    () =>
      opportunities.reduce((acc, item) => {
        if (item.stage === "ganada" || item.stage === "perdida") {
          return acc;
        }
        return acc + (item.estimatedValue || 0);
      }, 0),
    [opportunities]
  );

  const stageCounters = useMemo(() => {
    return opportunities.reduce<Record<OpportunityStage, number>>(
      (acc, item) => {
        acc[item.stage] += 1;
        return acc;
      },
      {
        prospecto: 0,
        contactado: 0,
        calificacion: 0,
        propuesta: 0,
        negociacion: 0,
        cotizadoSkill: 0,
        ganada: 0,
        perdida: 0,
      }
    );
  }, [opportunities]);

  useEffect(() => {
    const syncSelectedDb = () => {
      const recinto = authService.getRecinto() as CrmDatabaseKey;
      setSelectedDb((prev) => (prev === recinto ? prev : recinto));
    };

    syncSelectedDb();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "skill_recinto") {
        syncSelectedDb();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSelectedDb();
      }
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
          if (!previous) {
            return items[0];
          }

          return items.find((item) => item.id === previous.id) || items[0];
        });
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
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

  const updateFormField = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const clearForm = () => {
    setForm(DEFAULT_FORM);
  };

  const createOpportunity = async () => {
    if (!form.title.trim() || !form.clientName.trim()) {
      alert("Título de oportunidad y cliente son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await crmService.createOpportunity(selectedDb, {
        title: form.title.trim(),
        stage: form.stage,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
        owner: form.owner || undefined,
        client: {
          name: form.clientName.trim(),
          tradeName: form.clientTradeName || undefined,
          email: form.clientEmail || undefined,
          phone: form.clientPhone || undefined,
          identification: form.clientIdentification || undefined,
        },
      });

      clearForm();
    } catch (error) {
      console.error("Error al crear oportunidad:", error);
      alert("No fue posible crear la oportunidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (
    opportunity: Opportunity,
    newStage: OpportunityStage
  ) => {
    if (opportunity.stage === newStage) {
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
    if (!confirmed) {
      return;
    }

    try {
      await crmService.deleteOpportunity(selectedDb, opportunity.id);
    } catch (error) {
      console.error("Error eliminando oportunidad:", error);
      alert("No se pudo eliminar la oportunidad.");
    }
  };

  const handleAddNote = async () => {
    if (!selectedOpportunity || !noteText.trim()) {
      return;
    }

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

  const handleCreateClientInSkill = async (opportunity: Opportunity) => {
    setCreatingClientInSkillId(opportunity.id);

    try {
      const response = await apiService.createClient({
        clientName: opportunity.client.name,
        tradeName: opportunity.client.tradeName,
        legalName: opportunity.client.tradeName || opportunity.client.name,
        identificationNumber: opportunity.client.identification,
        email: opportunity.client.email,
        phone: opportunity.client.phone,
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

  const openLinkDialog = (opportunity: Opportunity) => {
    setLinkingOpportunity(opportunity);
    setLinkDialogOpen(true);
    setSkillEvents([]);
    setSelectedSkillEventNumber("");
    setEventSearchValue("");
    setEventSearchType("eventNumber");
  };

  const searchSkillEvents = async () => {
    if (!eventSearchValue.trim()) {
      alert("Ingresa un valor para buscar evento.");
      return;
    }

    setSearchingEvents(true);
    try {
      const events =
        eventSearchType === "eventNumber"
          ? await apiService.getEvents(undefined, undefined, eventSearchValue.trim())
          : await apiService.getEvents(
              undefined,
              undefined,
              undefined,
              eventSearchValue.trim()
            );

      const options = events
        .slice(0, 20)
        .map((event: any) => ({
          eventNumber: String(event?.eventNumber || event?.idEvent || ""),
          title: String(event?.title || "Sin título"),
        }))
        .filter((item: SkillEventOption) => item.eventNumber);

      setSkillEvents(options);
      if (options.length > 0) {
        setSelectedSkillEventNumber(options[0].eventNumber);
      }
    } catch (error) {
      console.error("Error buscando eventos de Skill:", error);
      alert("No se pudieron consultar los eventos en Skill.");
    } finally {
      setSearchingEvents(false);
    }
  };

  const linkToSkillEvent = async () => {
    if (!linkingOpportunity || !selectedSkillEventNumber) {
      return;
    }

    const selectedEvent = skillEvents.find(
      (item) => item.eventNumber === selectedSkillEventNumber
    );

    try {
      await crmService.linkOpportunityToSkillEvent(selectedDb, linkingOpportunity.id, {
        eventNumber: selectedSkillEventNumber,
        title: selectedEvent?.title,
      });

      setLinkDialogOpen(false);
      setLinkingOpportunity(null);
    } catch (error) {
      console.error("Error enlazando oportunidad a Skill:", error);
      alert("No se pudo enlazar la oportunidad con el evento en Skill.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Gestión de oportunidades comerciales, tracking por etapas y enlace con
              cotizaciones de Skill.
            </p>
          </div>

          <div className="w-full lg:w-64">
            <Label htmlFor="crm-db">Base de datos (Firebase)</Label>
            <Select
              id="crm-db"
              value={selectedDb}
              disabled
            >
              {FIREBASE_DATABASE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Oportunidades</p>
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
                  <p className="text-sm text-muted-foreground">Pipeline activo</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(totalPipelineValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">En negociación</p>
                  <p className="text-2xl font-semibold">{stageCounters.negociacion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserRoundCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Ganadas</p>
                  <p className="text-2xl font-semibold">{stageCounters.ganada}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle>Nueva oportunidad</CardTitle>
              <CardDescription>
                Registra clientes y oportunidades en la base seleccionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  placeholder="Ej. Congreso médico 2026"
                  onInput={(event) =>
                    updateFormField("title", (event.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <Select
                    value={form.stage}
                    onChange={(event) =>
                      updateFormField(
                        "stage",
                        (event.target as HTMLSelectElement).value
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

                <div className="space-y-2">
                  <Label>Valor estimado (CRC)</Label>
                  <Input
                    type="number"
                    value={form.estimatedValue}
                    onInput={(event) =>
                      updateFormField(
                        "estimatedValue",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input
                    value={form.clientName}
                    placeholder="Nombre principal"
                    onInput={(event) =>
                      updateFormField(
                        "clientName",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre comercial</Label>
                  <Input
                    value={form.clientTradeName}
                    onInput={(event) =>
                      updateFormField(
                        "clientTradeName",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.clientEmail}
                    onInput={(event) =>
                      updateFormField(
                        "clientEmail",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.clientPhone}
                    onInput={(event) =>
                      updateFormField(
                        "clientPhone",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cédula / Identificación</Label>
                  <Input
                    value={form.clientIdentification}
                    onInput={(event) =>
                      updateFormField(
                        "clientIdentification",
                        (event.target as HTMLInputElement).value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsable comercial</Label>
                  <Input
                    value={form.owner}
                    onInput={(event) =>
                      updateFormField("owner", (event.target as HTMLInputElement).value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha esperada de cierre</Label>
                <Input
                  type="date"
                  value={form.expectedCloseDate}
                  onInput={(event) =>
                    updateFormField(
                      "expectedCloseDate",
                      (event.target as HTMLInputElement).value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onInput={(event) =>
                    updateFormField("notes", (event.target as HTMLTextAreaElement).value)
                  }
                />
              </div>

              <Button
                onClick={createOpportunity}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear oportunidad
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking de oportunidades</CardTitle>
              <CardDescription>
                Controla avance por etapa y conecta con eventos cotizados de Skill.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  No hay oportunidades en esta base de datos.
                </p>
              ) : (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                  {opportunities.map((item) => {
                    const isSelected = selectedOpportunity?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-base">{item.title}</p>
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
                                {formatCurrency(item.estimatedValue)}
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
                              Enlazar Skill
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
                                : "Crear cliente en Skill"}
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
                            <Label>Última actualización</Label>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Línea de tiempo de oportunidad</CardTitle>
            <CardDescription>
              {selectedOpportunity
                ? `${selectedOpportunity.title} · ${selectedOpportunity.client.name}`
                : "Selecciona una oportunidad para ver su tracking"}
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
              <DialogTitle>Enlazar oportunidad con evento de Skill</DialogTitle>
              <DialogDescription>
                {linkingOpportunity
                  ? `${linkingOpportunity.title} · ${linkingOpportunity.client.name}`
                  : "Selecciona un evento de Skill para esta oportunidad."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Tipo búsqueda</Label>
                <Select
                  value={eventSearchType}
                  onChange={(event) =>
                    setEventSearchType(
                      (event.target as HTMLSelectElement).value as
                        | "eventNumber"
                        | "eventName"
                    )
                  }
                >
                  <option value="eventNumber">N° Evento</option>
                  <option value="eventName">Nombre</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  value={eventSearchValue}
                  onInput={(event) =>
                    setEventSearchValue((event.target as HTMLInputElement).value)
                  }
                  placeholder={
                    eventSearchType === "eventNumber"
                      ? "Ej. 10234"
                      : "Ej. Congreso"
                  }
                />
              </div>

              <Button onClick={searchSkillEvents} disabled={searchingEvents}>
                {searchingEvents ? <Spinner size="sm" /> : "Buscar"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Evento de Skill</Label>
              <Select
                value={selectedSkillEventNumber}
                onChange={(event) =>
                  setSelectedSkillEventNumber(
                    (event.target as HTMLSelectElement).value
                  )
                }
                disabled={skillEvents.length === 0}
              >
                {skillEvents.length === 0 ? (
                  <option value="">Sin resultados</option>
                ) : (
                  skillEvents.map((item) => (
                    <option key={item.eventNumber} value={item.eventNumber}>
                      #{item.eventNumber} · {item.title}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={linkToSkillEvent}
              disabled={!selectedSkillEventNumber || !linkingOpportunity}
            >
              Enlazar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
