import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { authService } from "../services/auth.service";
import { crmService } from "../services/crm.service";
import { apiService } from "../services/api.service";
import { toast } from "sonner";
import type { CrmDatabaseKey } from "../types/crm";
import {
  buildOpportunityDetails,
  createDefaultOpportunityForm,
  extractOption,
  mapSalesStageToOpportunityStage,
  OpportunityFormFields,
  type OpportunityFormState,
  type SelectOption,
} from "./oportunidadesForm";

export function CrearOportunidades() {
  const [selectedDb, setSelectedDb] = useState<CrmDatabaseKey>(
    authService.getRecinto() as CrmDatabaseKey
  );
  const [form, setForm] = useState<OpportunityFormState>(createDefaultOpportunityForm());
  const [saving, setSaving] = useState(false);
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

  const createOpportunity = async () => {
    if (!form.eventName.trim() || !form.accountName.trim()) {
      toast.error("Nombre del evento y nombre de la cuenta son obligatorios.");
      return;
    }

    const toastId = "crm-create-opportunity";
    setSaving(true);
    toast.loading("Guardando oportunidad...", { id: toastId });
    try {
      await crmService.createOpportunity(selectedDb, {
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

      toast.success("Oportunidad creada correctamente.", { id: toastId });

      route("/crm", true);
    } catch (error) {
      console.error("Error al crear oportunidad:", error);
      toast.error("No fue posible crear la oportunidad.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nueva oportunidad</h1>
            <p className="text-muted-foreground">
              Formulario CRM en secciones para el registro integral de la oportunidad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => route("/crm")}>Cancelar</Button>
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
          </div>
        </div>

        <OpportunityFormFields
          form={form}
          loadingLookups={loadingLookups}
          salesOwnerOptions={salesOwnerOptions}
          eventTypeOptions={eventTypeOptions}
          eventSizeOptions={eventSizeOptions}
          eventSectorOptions={eventSectorOptions}
          setupTypeOptions={setupTypeOptions}
          onFieldChange={updateFormField}
          onFlagChange={updateFormFlag}
          onSelectWithLabel={handleSelectWithLabel}
        />
      </div>
    </Layout>
  );
}
