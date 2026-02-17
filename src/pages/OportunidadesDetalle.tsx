import { useEffect, useMemo, useState } from "preact/hooks";
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
import { authService } from "../services/auth.service";
import { crmService } from "../services/crm.service";
import { apiService } from "../services/api.service";
import type { CrmDatabaseKey, Opportunity } from "../types/crm";
import {
  buildOpportunityDetails,
  createDefaultOpportunityForm,
  extractOption,
  mapOpportunityToForm,
  mapSalesStageToOpportunityStage,
  OpportunityFormFields,
  type OpportunityFormState,
  type SelectOption,
} from "./oportunidadesForm";

interface OportunidadesDetalleProps {
  opportunityId?: string;
  id?: string;
}

const formatCurrencyUSD = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function OportunidadesDetalle({ opportunityId, id }: OportunidadesDetalleProps) {
  const recordId = opportunityId ?? id ?? "";
  const [selectedDb, setSelectedDb] = useState<CrmDatabaseKey>(
    authService.getRecinto() as CrmDatabaseKey
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [form, setForm] = useState<OpportunityFormState>(createDefaultOpportunityForm());
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [salesOwnerOptions, setSalesOwnerOptions] = useState<SelectOption[]>([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<SelectOption[]>([]);
  const [eventSizeOptions, setEventSizeOptions] = useState<SelectOption[]>([]);
  const [eventSectorOptions, setEventSectorOptions] = useState<SelectOption[]>([]);
  const [setupTypeOptions, setSetupTypeOptions] = useState<SelectOption[]>([]);

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
    if (!recordId) {
      setLoading(false);
      return;
    }

    const unsubscribe = crmService.subscribeToOpportunities(
      selectedDb,
      (items) => {
        const current = items.find((item) => item.id === recordId) || null;
        setOpportunity(current);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [recordId, selectedDb]);

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
              extractOption(item, ["idEventSector", "id"], ["eventSectorName", "name"])
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

  useEffect(() => {
    if (!opportunity || editing) return;
    setForm(mapOpportunityToForm(opportunity));
  }, [opportunity, editing]);

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

  const handleSave = async () => {
    if (!opportunity) return;
    if (!form.eventName.trim() || !form.accountName.trim()) {
      alert("Nombre del evento y nombre de la cuenta son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await crmService.updateOpportunity(selectedDb, opportunity.id, {
        title: form.eventName.trim(),
        stage: mapSalesStageToOpportunityStage(form.salesStage),
        estimatedValue: form.opportunityValue ? Number(form.opportunityValue) : undefined,
        expectedCloseDate: form.endDate || undefined,
        owner: form.salesOwnerName || undefined,
        notes: form.notes || undefined,
        details: buildOpportunityDetails(form),
        client: {
          name: form.accountName.trim(),
          tradeName: form.accountName.trim(),
        },
      });
      setEditing(false);
    } catch (error) {
      console.error("Error actualizando oportunidad:", error);
      alert("No fue posible actualizar la oportunidad.");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    if (!opportunity) return null;
    return {
      evento: form.eventName || opportunity.title,
      cuenta: form.accountName || opportunity.client.tradeName || opportunity.client.name,
      etapa: form.salesStage || "-",
      propietario: form.salesOwnerName || opportunity.owner || "-",
      territorio: form.territory || "-",
      valor: form.opportunityValue
        ? formatCurrencyUSD(Number(form.opportunityValue))
        : formatCurrencyUSD(opportunity.estimatedValue),
    };
  }, [form, opportunity]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Detalle de oportunidad</h1>
            <p className="text-muted-foreground">
              Vista de información general con edición controlada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => route("/crm")}>Volver</Button>
            {!editing ? (
              <Button onClick={() => setEditing(true)} disabled={!opportunity || loading}>
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (opportunity) setForm(mapOpportunityToForm(opportunity));
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-14 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : !opportunity ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No se encontró la oportunidad solicitada.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Información general</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Evento</p>
                  <p className="font-medium">{summary?.evento}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cuenta</p>
                  <p className="font-medium">{summary?.cuenta}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Etapa</p>
                  <p className="font-medium">{summary?.etapa}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Propietario</p>
                  <p className="font-medium">{summary?.propietario}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Territorio</p>
                  <p className="font-medium">{summary?.territorio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor estimado</p>
                  <p className="font-medium">{summary?.valor}</p>
                </div>
              </CardContent>
            </Card>

            <OpportunityFormFields
              form={form}
              loadingLookups={loadingLookups}
              readOnly={!editing}
              salesOwnerOptions={salesOwnerOptions}
              eventTypeOptions={eventTypeOptions}
              eventSizeOptions={eventSizeOptions}
              eventSectorOptions={eventSectorOptions}
              setupTypeOptions={setupTypeOptions}
              onFieldChange={updateFormField}
              onFlagChange={updateFormFlag}
              onSelectWithLabel={handleSelectWithLabel}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
