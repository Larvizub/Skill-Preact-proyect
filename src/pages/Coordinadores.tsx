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
import type { SalesAgent } from "../services/api.service";
import { UserCog, Mail, Phone, Eye, Search } from "lucide-preact";

export function Coordinadores() {
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const loadAgents = async () => {
    try {
      const data = await apiService.getSalesAgents();
      setAgents(data);
    } catch (error) {
      console.error("Error loading sales agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentClick = (agent: SalesAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };

  const filteredAgents = agents.filter((agent) =>
    (agent.name || agent.salesAgentName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Lógica de paginación
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" label="Cargando coordinadores..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Coordinadores de Cuenta</h1>
          <p className="text-muted-foreground">
            Equipo de ventas y coordinación
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Coordinadores</CardTitle>
            <CardDescription>
              {filteredAgents.length} coordinadores disponibles
              {searchTerm && ` (filtrados de ${agents.length} totales)`}
            </CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onInput={(e) =>
                    setSearchTerm((e.target as HTMLInputElement).value)
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAgents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron coordinadores que coincidan con la búsqueda
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAgents.map((agent) => (
                      <TableRow key={agent.id || agent.idSalesAgent}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {agent.name || agent.salesAgentName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(agent.email || agent.salesAgentEmail) && (
                              <>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">
                                  {agent.email || agent.salesAgentEmail}
                                </p>
                              </>
                            )}
                            {!agent.email && !agent.salesAgentEmail && <p>-</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(agent.phone ||
                              agent.salesAgentPhone ||
                              agent.salesAgentMobilePhone) && (
                              <>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">
                                  {agent.phone ||
                                    agent.salesAgentPhone ||
                                    agent.salesAgentMobilePhone}
                                </p>
                              </>
                            )}
                            {!agent.phone &&
                              !agent.salesAgentPhone &&
                              !agent.salesAgentMobilePhone && <p>-</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAgentClick(agent)}
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
            {filteredAgents.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredAgents.length)} de{" "}
                  {filteredAgents.length} coordinadores
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

        {/* Modal de Detalles del Coordinador */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedAgent?.name ||
                    selectedAgent?.salesAgentName ||
                    "Detalles del Coordinador"}
                </DialogTitle>
                <DialogDescription>Coordinador de Cuenta</DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedAgent && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">ID</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.id || selectedAgent.idSalesAgent || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.name ||
                          selectedAgent.salesAgentName ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.email ||
                        selectedAgent.salesAgentEmail ? (
                          <a
                            href={`mailto:${
                              selectedAgent.email ||
                              selectedAgent.salesAgentEmail
                            }`}
                            className="text-primary hover:underline"
                          >
                            {selectedAgent.email ||
                              selectedAgent.salesAgentEmail}
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.phone ||
                        selectedAgent.salesAgentPhone ? (
                          <a
                            href={`tel:${
                              selectedAgent.phone ||
                              selectedAgent.salesAgentPhone
                            }`}
                            className="text-primary hover:underline"
                          >
                            {selectedAgent.phone ||
                              selectedAgent.salesAgentPhone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Teléfono Móvil</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.salesAgentMobilePhone ? (
                          <a
                            href={`tel:${selectedAgent.salesAgentMobilePhone}`}
                            className="text-primary hover:underline"
                          >
                            {selectedAgent.salesAgentMobilePhone}
                          </a>
                        ) : (
                          "-"
                        )}
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
