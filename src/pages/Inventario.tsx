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
import { Spinner } from "../components/ui/spinner";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { apiService } from "../services/api.service";
import type { Service } from "../services/api.service";
import {
  buildServicePriceLookup,
  generateInventoryGeneralExcelReport,
  generateInventoryTotalsExcelReport,
} from "../lib/inventoryReportUtils";
import {
  Package,
  Tag,
  DollarSign,
  Eye,
  Check,
  X,
  Search,
  FileSpreadsheet,
} from "lucide-preact";
import { toast } from "sonner";

export function Inventario() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportingGeneral, setExportingGeneral] = useState(false);
  const [exportingTotals, setExportingTotals] = useState(false);
  const itemsPerPage = 50;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const servicesCatalog = await apiService.getServices({
        includeRates: false,
        forceRefresh: false,
      });
      setServices(servicesCatalog);
      setLoading(false);

      setLoadingPrices(true);
      const servicesWithRates = await apiService.getServices({
        includeRates: true,
        forceRefresh: false,
      });
      setServices(servicesWithRates);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
      setLoadingPrices(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const formatPrice = (value: unknown) => {
    if (value == null) return "N/D";
    const num = Number(value);
    if (Number.isNaN(num)) return "N/D";
    return `$${num.toFixed(2)}`;
  };

  const filteredServices = useMemo(
    () =>
      services.filter((service) =>
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [services, searchTerm]
  );

  const servicePriceLookup = useMemo(
    () => buildServicePriceLookup(services),
    [services]
  );

  // Lógica de paginación
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = useMemo(
    () => filteredServices.slice(startIndex, endIndex),
    [filteredServices, startIndex, endIndex]
  );

  const selectedServicePrice = selectedService
    ? servicePriceLookup.get(Number(selectedService.idService)) ?? {
        tni: null,
        ti: null,
      }
    : { tni: null, ti: null };

  const handleExportGeneral = async () => {
    if (services.length === 0 || exportingGeneral) return;

    const toastId = "inventario-reporte-general";
    setExportingGeneral(true);
    toast.loading("Generando reporte general de inventario...", { id: toastId });

    try {
      await generateInventoryGeneralExcelReport(services, servicePriceLookup);
      toast.success("Reporte general de inventario generado correctamente.", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error exporting inventory general report:", error);
      toast.error("No se pudo generar el reporte general de inventario.", {
        id: toastId,
      });
    } finally {
      setExportingGeneral(false);
    }
  };

  const handleExportTotals = async () => {
    if (services.length === 0 || exportingTotals) return;

    const toastId = "inventario-reporte-totales";
    setExportingTotals(true);
    toast.loading("Generando reporte total de inventario...", { id: toastId });

    try {
      await generateInventoryTotalsExcelReport(services, servicePriceLookup);
      toast.success("Reporte total de inventario generado correctamente.", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error exporting inventory totals report:", error);
      toast.error("No se pudo generar el reporte total de inventario.", {
        id: toastId,
      });
    } finally {
      setExportingTotals(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">
            Artículos y servicios disponibles
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Lista de Servicios</CardTitle>
                <CardDescription>
                  {filteredServices.length} servicios disponibles
                  {searchTerm && ` (filtrados de ${services.length} totales)`}
                  {loadingPrices ? " • Actualizando precios..." : ""}
                </CardDescription>
                <div className="flex items-center gap-2 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre del servicio..."
                      value={searchTerm}
                      onInput={(e) =>
                        setSearchTerm((e.target as HTMLInputElement).value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleExportGeneral}
                  disabled={services.length === 0 || exportingGeneral}
                  className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
                >
                  {exportingGeneral ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  {exportingGeneral ? "Generando..." : "Reporte Excel General"}
                </Button>
                <Button
                  onClick={handleExportTotals}
                  disabled={services.length === 0 || exportingTotals}
                  className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
                >
                  {exportingTotals ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  {exportingTotals ? "Generando..." : "Reporte Excel Totales"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm
                  ? "No se encontraron servicios que coincidan con la búsqueda"
                  : "No hay servicios disponibles"}
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Precio TNI</TableHead>
                      <TableHead>Precio TI</TableHead>

                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedServices.map((service) => {
                      const priceInfo =
                        servicePriceLookup.get(Number(service.idService)) ?? {
                          tni: null,
                          ti: null,
                        };

                      return (
                      <TableRow key={service.idService}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {service.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {service.serviceCode || "Sin código"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {service.serviceCategory.serviceCategoryName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {
                                service.serviceSubCategory
                                  .serviceSubCategoryName
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{service.serviceStock}</TableCell>
                        <TableCell>
                          {loadingPrices && priceInfo.tni == null ? (
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Spinner className="h-3 w-3" />
                              Cargando...
                            </span>
                          ) : (
                            formatPrice(priceInfo.tni)
                          )}
                        </TableCell>
                        <TableCell>
                          {loadingPrices && priceInfo.ti == null ? (
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Spinner className="h-3 w-3" />
                              Cargando...
                            </span>
                          ) : (
                            formatPrice(priceInfo.ti)
                          )}
                        </TableCell>

                        <TableCell>
                          {service.serviceActive ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <Check className="h-3 w-3" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <X className="h-3 w-3" />
                              Inactivo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleServiceClick(service)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Controles de paginación */}
            {filteredServices.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredServices.length)} de{" "}
                  {filteredServices.length} servicios
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles del Servicio */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedService?.serviceName || "Detalles del Servicio"}
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedService?.idService}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedService && (
                <div className="space-y-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Nombre</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.serviceName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Código</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.serviceCode || "Sin código"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.serviceComments || "Sin descripción"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Stock</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.serviceStock} unidades
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Estado</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.serviceActive
                            ? "Activo"
                            : "Inactivo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Categorización */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Categoría</p>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">
                            {
                              selectedService.serviceCategory
                                .serviceCategoryName
                            }
                          </p>
                          <p className="text-xs">
                            Subcategoría:{" "}
                            {
                              selectedService.serviceSubCategory
                                .serviceSubCategoryName
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Grupo de Ingresos
                      </p>
                      <span className="inline-block px-3 py-1 text-sm rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {selectedService.revenueGroup.revenueGroupName}
                      </span>
                    </div>
                  </div>

                  {/* Información de Precios */}
                  {(selectedServicePrice.ti != null ||
                    selectedServicePrice.tni != null) && (
                    <div>
                      <p className="text-sm font-medium mb-3">
                        Información de Precios
                      </p>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">
                            Precios del Servicio
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {selectedServicePrice.tni != null && (
                            <p>
                              Precio TNI:{" "}
                              {formatPrice(selectedServicePrice.tni)}
                            </p>
                          )}
                          {selectedServicePrice.ti != null && (
                            <p>
                              Precio TI:{" "}
                              {formatPrice(selectedServicePrice.ti)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información de Costos */}
                  {(selectedService.serviceMinCostPrice > 0 ||
                    selectedService.serviceMaxCostPrice > 0) && (
                    <div>
                      <p className="text-sm font-medium mb-3">
                        Información de Costos Internos
                      </p>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">Rango de Costo</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Costo mínimo:{" "}
                            {formatPrice(selectedService.serviceMinCostPrice)}
                          </p>
                          {selectedService.serviceMinCostPrice !==
                            selectedService.serviceMaxCostPrice && (
                            <p>
                              Costo máximo:{" "}
                              {formatPrice(selectedService.serviceMaxCostPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
