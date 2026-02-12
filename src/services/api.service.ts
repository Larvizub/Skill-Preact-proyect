import { apiRequest, buildPayload, withFallback } from "./api/apiClient";
import { createEventsService } from "./api/events.service";
import { createRoomsService } from "./api/rooms.service";
import { createServicesCatalogService } from "./api/servicesCatalog.service";
import { createLookupsService } from "./api/lookups.service";
import { createSchedulesService } from "./api/schedules.service";
import { createActivitiesService } from "./api/activities.service";
import { createClientsService } from "./api/clients.service";

export type {
  ActivityPackage,
  ActivityType,
  BillingCurrency,
  Client,
  ClientEventManager,
  Contact,
  Contingency,
  Event,
  EventCharacter,
  EventCoordinator,
  EventInvoice,
  EventMarketSubSegment,
  EventPaymentForm,
  EventQuote,
  EventSector,
  EventSize,
  EventStage,
  EventStatus,
  EventSubType,
  EventType,
  ExtraTip,
  MarketSegment,
  QuoteItem,
  ReservationType,
  ReservationUse,
  Resource,
  Room,
  RoomAvailability,
  RoomRate,
  SalesAgent,
  Schedule,
  Service,
  ServiceRate,
  TaxExemption,
} from "../types/skill/api";

const eventsService = createEventsService({ apiRequest, buildPayload, withFallback });
const schedulesService = createSchedulesService({ apiRequest });
const roomsService = createRoomsService({
  apiRequest,
  buildPayload,
  withFallback,
  getEvents: eventsService.getEvents,
  getSchedules: schedulesService.getSchedules,
});
const servicesCatalogService = createServicesCatalogService({
  apiRequest,
  buildPayload,
  withFallback,
});
const lookupsService = createLookupsService({ apiRequest, buildPayload, withFallback });
const activitiesService = createActivitiesService({ apiRequest });
const clientsService = createClientsService({
  apiRequest,
  buildPayload,
  withFallback,
  getEvents: eventsService.getEvents,
});

// Tipos del API movidos a src/types/skill/api.ts (re-exportados desde este módulo).

// Servicios de API
export const apiService = {
  ...eventsService,
  ...schedulesService,
  ...roomsService,
  ...servicesCatalogService,
  ...lookupsService,
  ...activitiesService,
  ...clientsService,
};
