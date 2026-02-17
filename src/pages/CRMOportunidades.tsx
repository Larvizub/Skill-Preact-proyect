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
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { authService } from "../services/auth.service";
import { crmService } from "../services/crm.service";
import type { CrmDatabaseKey, Opportunity } from "../types/crm";

type FiltersState = {
  procesoOportunidadVenta: string;
  etapaOportunidadVenta: string;
  propietarioVenta: string;
  segmentoVenta: string;
  territorio: string;
};

const INITIAL_FILTERS: FiltersState = {
  procesoOportunidadVenta: "all",
  etapaOportunidadVenta: "all",
  propietarioVenta: "all",
  segmentoVenta: "all",
  territorio: "all",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getInfoBasica = (opportunity: Opportunity) =>
  asRecord(asRecord(opportunity.details).infoBasica);

const getOwnerName = (opportunity: Opportunity) => {
  const infoBasica = getInfoBasica(opportunity);
  const propietario = asRecord(infoBasica.propietarioVentas);
  return asString(propietario.nombre) || asString(opportunity.owner);
};

const getSegmentName = (opportunity: Opportunity) => {
  const infoBasica = getInfoBasica(opportunity);
  const segmento = asRecord(infoBasica.segmentoOportunidad);
  return asString(segmento.nombre);
};

const getSalesProcess = (opportunity: Opportunity) => {
  const infoBasica = getInfoBasica(opportunity);
  return asString(infoBasica.procesoOportunidadVenta);
};

const getSalesStage = (opportunity: Opportunity) => {
  const infoBasica = getInfoBasica(opportunity);
  return asString(infoBasica.etapaOportunidadVenta);
};

const getTerritory = (opportunity: Opportunity) => {
  const infoBasica = getInfoBasica(opportunity);
  return asString(infoBasica.territorio);
};

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter((value) => value.length > 0))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

export function CRMOportunidades() {
  const [selectedDb, setSelectedDb] = useState<CrmDatabaseKey>(
    authService.getRecinto() as CrmDatabaseKey
  );
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<FiltersState>(INITIAL_FILTERS);

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
        const sortedByCreatedAt = [...items].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        setOpportunities(sortedByCreatedAt);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [selectedDb]);

  const processOptions = useMemo(
    () => uniqueSorted(opportunities.map((item) => getSalesProcess(item))),
    [opportunities]
  );

  const stageOptions = useMemo(
    () => uniqueSorted(opportunities.map((item) => getSalesStage(item))),
    [opportunities]
  );

  const ownerOptions = useMemo(
    () => uniqueSorted(opportunities.map((item) => getOwnerName(item))),
    [opportunities]
  );

  const segmentOptions = useMemo(
    () => uniqueSorted(opportunities.map((item) => getSegmentName(item))),
    [opportunities]
  );

  const territoryOptions = useMemo(
    () => uniqueSorted(opportunities.map((item) => getTerritory(item))),
    [opportunities]
  );

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const process = getSalesProcess(item);
      const stage = getSalesStage(item);
      const owner = getOwnerName(item);
      const segment = getSegmentName(item);
      const territory = getTerritory(item);

      return (
        (filters.procesoOportunidadVenta === "all" ||
          filters.procesoOportunidadVenta === process) &&
        (filters.etapaOportunidadVenta === "all" ||
          filters.etapaOportunidadVenta === stage) &&
        (filters.propietarioVenta === "all" || filters.propietarioVenta === owner) &&
        (filters.segmentoVenta === "all" || filters.segmentoVenta === segment) &&
        (filters.territorio === "all" || filters.territorio === territory)
      );
    });
  }, [opportunities, filters]);

  const updateFilter = (field: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consulta de Oportunidades</h1>
            <p className="text-muted-foreground">
              Oportunidades CRM ordenadas de la más reciente a la más antigua.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => route("/crm")}>
              Ir a gestión CRM
            </Button>
            <Button onClick={() => route("/crm/oportunidades/crear")}>
              Nueva oportunidad
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra por Proceso de Oportunidad de Venta, Etapa, Propietario,
              Segmento y Territorio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="filtro-proceso">Proceso de oportunidad de venta</Label>
              <Select
                id="filtro-proceso"
                value={filters.procesoOportunidadVenta}
                onChange={(event) =>
                  updateFilter(
                    "procesoOportunidadVenta",
                    (event.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="all">Todos</option>
                {processOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-etapa">Etapa de oportunidad de venta</Label>
              <Select
                id="filtro-etapa"
                value={filters.etapaOportunidadVenta}
                onChange={(event) =>
                  updateFilter(
                    "etapaOportunidadVenta",
                    (event.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="all">Todas</option>
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-propietario">Propietario de venta</Label>
              <Select
                id="filtro-propietario"
                value={filters.propietarioVenta}
                onChange={(event) =>
                  updateFilter(
                    "propietarioVenta",
                    (event.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="all">Todos</option>
                {ownerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-segmento">Segmento de venta</Label>
              <Select
                id="filtro-segmento"
                value={filters.segmentoVenta}
                onChange={(event) =>
                  updateFilter(
                    "segmentoVenta",
                    (event.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="all">Todos</option>
                {segmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-territorio">Territorio</Label>
              <Select
                id="filtro-territorio"
                value={filters.territorio}
                onChange={(event) =>
                  updateFilter("territorio", (event.target as HTMLSelectElement).value)
                }
              >
                <option value="all">Todos</option>
                {territoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2 xl:col-span-5 flex justify-end">
              <Button variant="outline" onClick={() => setFilters(INITIAL_FILTERS)}>
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Oportunidades</CardTitle>
            <CardDescription>
              {filteredOpportunities.length} resultado(s) de {opportunities.length}
              oportunidad(es).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No hay oportunidades para los filtros seleccionados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creación</TableHead>
                    <TableHead>Oportunidad</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Proceso</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Territorio</TableHead>
                    <TableHead>Valor estimado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.client.tradeName || item.client.name || "-"}</TableCell>
                      <TableCell>{getSalesProcess(item) || "-"}</TableCell>
                      <TableCell>{getSalesStage(item) || "-"}</TableCell>
                      <TableCell>{getOwnerName(item) || "-"}</TableCell>
                      <TableCell>{getSegmentName(item) || "-"}</TableCell>
                      <TableCell>{getTerritory(item) || "-"}</TableCell>
                      <TableCell>{formatCurrencyUSD(item.estimatedValue)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => route(`/crm/oportunidades/${item.id}`)}
                        >
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
