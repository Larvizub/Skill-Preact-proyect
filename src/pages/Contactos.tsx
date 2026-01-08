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
import type { Contact } from "../services/api.service";
import { UserCircle, Eye, Search, Mail, Phone } from "lucide-preact";

export function Contactos() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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
      const contactsData = await apiService.getContacts();
      const q = (searchTerm || "").toLowerCase().trim();
      const filtered = (contactsData || []).filter((c) => {
        const name = (c.clientEventManagerName || "").toLowerCase();
        const email = (c.clientEventManagerEmail || "").toLowerCase();
        const phone = (
          c.clientEventManagerPhone ||
          c.clientEventManagerMobilePhone ||
          ""
        ).toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });

      if (q && filtered.length === 0) {
        setContacts(contactsData);
      } else if (q) {
        setContacts(filtered);
      } else {
        setContacts(contactsData);
      }
    } catch (error) {
      console.error("Error searching contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const filteredContacts = contacts;

  // Lógica de paginación
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold">Contactos</h1>
          <p className="text-muted-foreground">
            Gestión de contactos de clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Contactos</CardTitle>
            <CardDescription>
              {filteredContacts.length} contactos disponibles
              {searchTerm && ` (filtrados de ${contacts.length} totales)`}
            </CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
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
                <p className="text-lg font-medium">
                  Busca contactos por nombre, email o teléfono
                </p>
                <p className="text-muted-foreground">
                  Presiona "Buscar" para cargar los contactos.
                </p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron contactos que coincidan con la búsqueda
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContacts.map((contact) => (
                      <TableRow
                        key={
                          contact.idClientEventManager ||
                          contact.clientEventManagerEmail
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {contact.clientEventManagerName || "-"}
                              </p>
                              {(contact.firstName || contact.lastName) && (
                                <p className="text-xs text-muted-foreground">
                                  {[contact.firstName, contact.lastName]
                                    .filter(Boolean)
                                    .join(" ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {contact.clientEventManagerEmail && (
                              <>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">
                                  {contact.clientEventManagerEmail}
                                </p>
                              </>
                            )}
                            {!contact.clientEventManagerEmail && <p>-</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(contact.clientEventManagerPhone ||
                              contact.clientEventManagerMobilePhone) && (
                              <>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">
                                  {contact.clientEventManagerPhone ||
                                    contact.clientEventManagerMobilePhone}
                                </p>
                              </>
                            )}
                            {!contact.clientEventManagerPhone &&
                              !contact.clientEventManagerMobilePhone && (
                                <p>-</p>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {contact.client?.tradeName ||
                              contact.client?.clientName ||
                              "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactClick(contact)}
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
            {searched && filteredContacts.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredContacts.length)} de{" "}
                  {filteredContacts.length} contactos
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

        {/* Modal de Detalles del Contacto */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader onClose={handleCloseModal}>
              <div>
                <DialogTitle>
                  {selectedContact?.clientEventManagerName ||
                    "Detalles del Contacto"}
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedContact?.idClientEventManager || "N/A"}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogBody>
              {selectedContact && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">ID</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.idClientEventManager ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.clientEventManagerName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">First Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.firstName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.lastName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.clientEventManagerEmail || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.clientEventManagerPhone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Móvil</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.clientEventManagerMobilePhone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Posición</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.position || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Departamento</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.department || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cliente</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.client?.tradeName ||
                          selectedContact.client?.clientName ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">ID Cliente</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.idClient ?? "-"}
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
