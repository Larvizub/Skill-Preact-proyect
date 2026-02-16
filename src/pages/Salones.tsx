import { useEffect, useState } from "preact/hooks";
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
  generateRoomsGeneralExcelReport,
  generateRoomsTotalsExcelReport,
  getRoomPriceInfo,
} from "../lib/roomsReportUtils";
import { toast } from "sonner";

export function Salones() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomRates, setRoomRates] = useState<RoomRate[]>([]);
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
      const [roomsData, roomRatesData] = await Promise.all([
        apiService.getRooms(),
        apiService.getRoomRates().catch(() => [] as RoomRate[]),
      ]);
      setRooms(roomsData);
      setRoomRates(Array.isArray(roomRatesData) ? roomRatesData : []);
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null || !Number.isFinite(value)) return "N/D";

    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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
                </CardDescription>
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
                      <TableHead>Precio TI</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => {
                      const roomPriceInfo = getRoomPriceInfo(room, roomRates);

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
                          {formatCurrency(
                            roomPriceInfo.price,
                            roomPriceInfo.currency
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
