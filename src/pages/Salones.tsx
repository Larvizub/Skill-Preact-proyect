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
import type { Room, RoomRate } from "../services/api.service";
import { Building, Users, Eye, Check, X, FileSpreadsheet } from "lucide-preact";
import {
  buildRoomPriceLookup,
  generateRoomsGeneralExcelReport,
  generateRoomsTotalsExcelReport,
} from "../lib/roomsReportUtils";
import { authService } from "../services/auth.service";
import { toast } from "sonner";

export function Salones() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomRates, setRoomRates] = useState<RoomRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesStatus, setRatesStatus] = useState<
    "idle" | "loading" | "ready" | "empty" | "error"
  >("idle");
  const [loading, setLoading] = useState(true);
  const [exportingGeneral, setExportingGeneral] = useState(false);
  const [exportingTotals, setExportingTotals] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const roomsData = await apiService.getRooms();
      setRooms(roomsData);

      setLoading(false);
      setLoadingRates(true);
      setRatesStatus("loading");

      const roomIds = roomsData
        .map((room: Room) => Number(room.idRoom))
        .filter((id: number) => Number.isFinite(id) && id > 0);

      const roomRatesData = await apiService
        .getRoomRates(roomIds)
        .catch(() => [] as RoomRate[]);

      setRoomRates(Array.isArray(roomRatesData) ? roomRatesData : []);

      if (!Array.isArray(roomRatesData) || roomRatesData.length === 0) {
        setRatesStatus("empty");
      } else {
        setRatesStatus("ready");
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
      setLoading(false);
      setRatesStatus("error");
    } finally {
      setLoadingRates(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return "N/D";

    const recinto = authService.getRecinto();
    const currencyCode = recinto === "CCCR" ? "USD" : "COP";

    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const roomPriceLookup = useMemo(
    () => buildRoomPriceLookup(rooms, roomRates),
    [rooms, roomRates]
  );

  const roomsWithResolvedPriceCount = useMemo(
    () =>
      rooms.reduce((count, room) => {
        const priceInfo = roomPriceLookup.get(Number(room.idRoom));
        if (priceInfo && priceInfo.price !== null && Number.isFinite(priceInfo.price)) {
          return count + 1;
        }
        return count;
      }, 0),
    [rooms, roomPriceLookup]
  );

  const handleExportGeneral = async () => {
    if (rooms.length === 0 || exportingGeneral) return;

    const toastId = "salones-reporte-general";
    setExportingGeneral(true);
    toast.loading("Generando reporte general de salones...", { id: toastId });

    try {
      await generateRoomsGeneralExcelReport(rooms, roomRates);
      toast.success("Reporte general generado correctamente.", { id: toastId });
    } catch (error) {
      console.error("Error exporting general rooms report:", error);
      toast.error("No se pudo generar el reporte general de salones.", {
        id: toastId,
      });
    } finally {
      setExportingGeneral(false);
    }
  };

  const handleExportTotals = async () => {
    if (rooms.length === 0 || exportingTotals) return;

    const toastId = "salones-reporte-totales";
    setExportingTotals(true);
    toast.loading("Generando reporte total de salones...", { id: toastId });

    try {
      await generateRoomsTotalsExcelReport(rooms, roomRates);
      toast.success("Reporte total de salones generado correctamente.", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error exporting rooms totals report:", error);
      toast.error("No se pudo generar el reporte total de salones.", {
        id: toastId,
      });
    } finally {
      setExportingTotals(false);
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
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
          <h1 className="text-3xl font-bold">Salones</h1>
          <p className="text-muted-foreground">
            Gestión de salones y espacios disponibles
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lista de Salones</CardTitle>
                <CardDescription>
                  {rooms.length} salones disponibles
                  {loadingRates ? " • Cargando tarifas..." : ""}
                </CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  {ratesStatus === "loading" && (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="h-3 w-3" />
                      Consultando precios de salones...
                    </span>
                  )}
                  {ratesStatus === "ready" && (
                    <span>
                      Precios cargados para {roomsWithResolvedPriceCount} de {rooms.length} salones.
                    </span>
                  )}
                  {ratesStatus === "empty" && (
                    <span className="text-amber-600 dark:text-amber-400">
                      No se encontraron tarifas para la consulta actual.
                    </span>
                  )}
                  {ratesStatus === "error" && (
                    <span className="text-red-600 dark:text-red-400">
                      Error consultando tarifas de salones.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleExportGeneral}
                  disabled={rooms.length === 0 || exportingGeneral}
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
                  disabled={rooms.length === 0 || exportingTotals}
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
            {rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay salones disponibles
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salón</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Altura</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio TNI</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => {
                      const roomPriceInfo = roomPriceLookup.get(Number(room.idRoom)) ?? {
                        price: null,
                        currency: "USD",
                      };

                      return (
                        <TableRow key={room.idRoom}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{room.roomName}</p>
                              {room.roomComments && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {room.roomComments}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{room.roomMt2}m²</TableCell>
                        <TableCell>{room.roomHeight}m</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {room.roomSetups.length > 0
                              ? Math.max(
                                  ...room.roomSetups.map(
                                    (s) => s.roomSetupPaxsCapacity
                                  )
                                )
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {room.roomActive ? (
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
                        <TableCell>
                          {loadingRates ? (
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Spinner className="h-3 w-3" />
                              Cargando...
                            </span>
                          ) : roomPriceInfo.price !== null ? (
                            formatCurrency(roomPriceInfo.price)
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin tarifa</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoomClick(room)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles del Salón */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedRoom?.roomName || "Detalles del Salón"}
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedRoom?.idRoom}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedRoom && (
                <div className="space-y-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.roomComments || "Sin descripción"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Área</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomMt2}m²
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Altura</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomHeight}m
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Estado</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomActive ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Capacidad Máxima
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRoom.roomSetups.length > 0
                            ? Math.max(
                                ...selectedRoom.roomSetups.map(
                                  (s) => s.roomSetupPaxsCapacity
                                )
                              )
                            : "N/A"}{" "}
                          personas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Montajes Disponibles */}
                  <div>
                    <p className="text-sm font-medium mb-3">
                      Montajes Disponibles
                    </p>
                    {selectedRoom.roomSetups.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRoom.roomSetups.map((setup, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {setup.roomSetupName || `Montaje ${idx + 1}`}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {setup.roomSetupPaxsCapacity} personas
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay montajes disponibles para este salón
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
