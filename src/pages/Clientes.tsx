import { useState } from "preact/hooks";
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
import type { Client } from "../services/api.service";
import { Users, Eye, Search } from "lucide-preact";

export function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setCurrentPage(1); // Resetear a la primera página
    try {
      // traer la lista completa y luego filtrar localmente
      const clientsData = await apiService.getClients();
      // siempre guardamos la lista completa
      // buscar coincidencias por tradeName, clientName o identificationNumber
      const q = (searchTerm || "").toLowerCase().trim();
      const filtered = (clientsData || []).filter((c) => {
        const trade = (c.tradeName || c.clientName || "").toLowerCase();
        const idnum = String(c.identificationNumber || "").toLowerCase();
        return trade.includes(q) || idnum.includes(q);
      });

      if (q && filtered.length === 0) {
        // no hay coincidencias: mostrar la lista completa como fallback
        setClients(clientsData);
      } else if (q) {
        setClients(filtered);
      } else {
        // si la query está vacía devolvemos todo
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Error searching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  // filteredClients ahora es la lista tal como la dejó handleSearch (ya filtrada)
  const filteredClients = clients;

  // Lógica de paginación
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestión de clientes y empresas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredClients.length} clientes disponibles
              {searchTerm && ` (filtrados de ${clients.length} totales)`}
            </CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onInput={(e) =>
                    setSearchTerm((e.target as HTMLInputElement).value)
                  }
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                Buscar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!searched ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium">Busca clientes por nombre</p>
                <p className="text-muted-foreground">
                  No se realizan búsquedas automáticas para evitar carga
                  innecesaria.
                </p>
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron clientes que coincidan con la búsqueda
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre / Razón Social</TableHead>
                      <TableHead>Identificación</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.idClient || client.clientCode}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {client.tradeName || client.clientName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {client.legalName}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {client.identificationNumber || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{client.email || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{client.phone || "-"}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClientClick(client)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Controles de paginación */}
            {searched && filteredClients.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredClients.length)} de{" "}
                  {filteredClients.length} clientes
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

        {/* Modal de Detalles del Cliente */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedClient?.clientName || "Detalles del Cliente"}
                </DialogTitle>
                <DialogDescription>
                  Código: {selectedClient?.clientCode || "N/A"}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedClient && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">ID</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.idClient ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Trade Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.tradeName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Legal Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.legalName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Identification Number
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.identificationNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.email || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.address || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.location || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Province</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.province || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">City</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.city || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Zipcode</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.zipcode || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        ID Identification Type
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.idIdentificationType ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">ID Profile Type</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.idProfileType ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">First Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.firstName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.lastName || "-"}
                      </p>
                    </div>
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
