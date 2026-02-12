import type { Client, Contact } from "../../types/skill/api";

type ApiRequest = <T>(endpoint: string, options?: RequestInit) => Promise<T>;
type BuildPayload = (payload?: Record<string, unknown>) => string;

type WithFallback = <T>(
  primary: () => Promise<T>,
  fallback?: () => Promise<T>
) => Promise<T>;

type GetEvents = (
  startDate?: string,
  endDate?: string,
  eventNumber?: string,
  eventName?: string
) => Promise<any[]>;

type CreateClientsServiceDeps = {
  apiRequest: ApiRequest;
  buildPayload: BuildPayload;
  withFallback: WithFallback;
  getEvents: GetEvents;
};

export function createClientsService({
  apiRequest,
  buildPayload,
  withFallback,
  getEvents,
}: CreateClientsServiceDeps) {
  const getClients = async (): Promise<Client[]> => {
    try {
      // Intentar endpoint directo de clientes primero
      const response = await withFallback(
        () =>
          apiRequest<
            | { success: boolean; result?: { clients?: Client[] } }
            | { clients?: Client[] }
            | Client[]
          >("/clients", {
            method: "GET",
          }),
        () =>
          apiRequest<
            | { success: boolean; result?: { clients?: Client[] } }
            | { clients?: Client[] }
            | Client[]
          >("/GetClients", {
            method: "POST",
            body: buildPayload(),
          })
      );

      // Normalizar respuesta
      let clients: Client[] = [];
      if (Array.isArray(response)) {
        clients = response;
      } else if (Array.isArray((response as any)?.clients)) {
        clients = (response as any).clients;
      } else if (Array.isArray((response as any)?.result?.clients)) {
        clients = (response as any).result.clients;
      }

      return clients;
    } catch (error) {
      console.warn("Endpoint de clientes falló, extrayendo desde eventos:", error);
      // Fallback: extraer clientes desde eventos
      const events = await getEvents("2025-01-01", "2025-12-31");
      const clientMap = new Map<string, Client>();

      events.forEach((event: any) => {
        if (event.client) {
          const client = event.client;
          const key = client.clientCode || client.idClient || client.clientName;
          if (key && !clientMap.has(key)) {
            clientMap.set(key, {
              idClient: client.idClient,
              clientCode: client.clientCode || "",
              clientName: client.clientName || "",
              tradeName: client.tradeName,
              legalName: client.legalName,
              address: client.address,
              identificationNumber: client.identificationNumber,
              email: client.email,
              location: client.location,
              city: client.city,
              zipcode: client.zipcode,
              province: client.province,
              phone: client.phone,
              idIdentificationType: client.idIdentificationType,
              idProfileType: client.idProfileType,
              firstName: client.firstName,
              lastName: client.lastName,
            });
          }
        }
      });

      return Array.from(clientMap.values());
    }
  };

  const getContacts = async (): Promise<Contact[]> => {
    try {
      // Intentar endpoint directo de contactos primero
      const response = await withFallback(
        () =>
          apiRequest<
            | { success: boolean; result?: { contacts?: Contact[] } }
            | { contacts?: Contact[] }
            | Contact[]
          >("/contacts", {
            method: "GET",
          }),
        () =>
          apiRequest<
            | { success: boolean; result?: { contacts?: Contact[] } }
            | { contacts?: Contact[] }
            | Contact[]
          >("/GetContacts", {
            method: "POST",
            body: buildPayload(),
          })
      );

      // Normalizar respuesta
      let contacts: Contact[] = [];
      if (Array.isArray(response)) {
        contacts = response;
      } else if (Array.isArray((response as any)?.contacts)) {
        contacts = (response as any).contacts;
      } else if (Array.isArray((response as any)?.result?.contacts)) {
        contacts = (response as any).result.contacts;
      }

      return contacts;
    } catch (error) {
      console.warn(
        "Endpoint de contactos falló, extrayendo desde eventos:",
        error
      );
      // Fallback: extraer contactos desde eventos
      const events = await getEvents("2025-01-01", "2025-12-31");
      const contactMap = new Map<string, Contact>();

      events.forEach((event: any) => {
        if (event.clientEventManager) {
          const contact = event.clientEventManager;
          const key =
            contact.idClientEventManager ||
            contact.clientEventManagerEmail ||
            contact.clientEventManagerName;
          if (key && !contactMap.has(String(key))) {
            contactMap.set(String(key), {
              idClientEventManager: contact.idClientEventManager,
              clientEventManagerName: contact.clientEventManagerName || "",
              clientEventManagerEmail: contact.clientEventManagerEmail,
              clientEventManagerMobilePhone: contact.clientEventManagerMobilePhone,
              clientEventManagerPhone: contact.clientEventManagerPhone,
              client: event.client,
              idClient: contact.idClient || event.client?.idClient,
              firstName: contact.firstName,
              lastName: contact.lastName,
              position: contact.position,
              department: contact.department,
            });
          }
        }
      });

      return Array.from(contactMap.values());
    }
  };

  return {
    getClients,
    getContacts,
  };
}
