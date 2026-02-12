export interface Room {
  idRoom: number;
  roomName: string;
  roomCode: string;
  roomMt2: number;
  roomHeight: number;
  roomComments: string;
  roomVisualOrder: number;
  roomActive: boolean;
  roomBackGroundColor: number;
  roomForeColor: number | null;
  roomType: {
    idRoomType: number;
    roomTypeName: string;
    roomTypeVisualOrder: number;
  };
  location: {
    idLocation: number;
    locationName: string;
    locationVisualOrder: number;
  };
  revenueGroup: {
    idRevenueGroup: number;
    revenueGroupName: string;
    revenueGroupColumnName: string;
    revenueGroupVisualOrder: number;
  };
  roomSetups: Array<{
    idRoomSetup: number;
    roomSetupName: string;
    roomSetupPaxsCapacity: number;
    roomSetupPreparationTime: number;
    roomSetupCleaningTime: number;
  }>;
}

export interface Service {
  idService: number;
  serviceName: string;
  serviceNameAlternative: string;
  serviceCode: string;
  serviceStock: number;
  serviceMinCostPrice: number;
  serviceMaxCostPrice: number;
  // Precios con y sin impuestos (normalizados desde priceLists)
  priceTI?: number; // Price Taxes Included (con impuesto)
  priceTNI?: number; // Price Taxes Not Included (sin impuesto)
  serviceProfitMargin: number;
  serviceComments: string;
  serviceActive: boolean;
  revenueGroup: {
    idRevenueGroup: number;
    revenueGroupName: string;
    revenueGroupColumnName: string;
    revenueGroupVisualOrder: number;
  };
  serviceCategory: {
    idServiceCategory: number;
    serviceCategoryName: string;
    serviceCategorySystem: boolean;
    serviceCategoryActive: boolean;
    serviceCategoryVisualOrder: number;
    serviceCategoryAffectsExtraTip: boolean;
  };
  serviceSubCategory: {
    idServiceSubCategory: number;
    serviceSubCategoryName: string;
    serviceSubCategoryActive: boolean;
  };
  // Datos originales de priceLists (si existen)
  priceLists?: Array<{
    servicePriceTaxesIncluded?: number;
    servicePriceTaxesNotIncluded?: number;
    priceListActive?: boolean;
    priceListFromDate?: string;
    priceListToDate?: string;
  }>;
}

export interface RoomRate {
  id: string;
  roomId: string;
  rate: number;
  currency: string;
}

export interface ServiceRate {
  id: string;
  serviceId: string;
  rate: number;
  currency: string;
}

export interface RoomAvailability {
  roomId: string;
  date: string;
  available: boolean;
}

export interface EventType {
  id: string;
  name: string;
  description?: string;
}

export interface MarketSegment {
  id: string;
  name: string;
}

export interface SalesAgent {
  idSalesAgent: number;
  salesAgentName: string;
  salesAgentEmail?: string;
  salesAgentPhone?: string;
  salesAgentMobilePhone?: string;
  // Campos adicionales para compatibilidad con UI
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface EventStatus {
  id: string;
  name: string;
  color?: string;
}

export interface EventCharacter {
  id: string;
  name: string;
}

export interface EventSector {
  id: string;
  name: string;
}

export interface EventSize {
  id: string;
  name: string;
}

export interface ReservationType {
  id: string;
  name: string;
}

export interface ReservationUse {
  id: string;
  name: string;
}

export interface EventStage {
  id: string;
  name: string;
}

export interface ActivityType {
  id: string;
  name: string;
}

export interface EventCoordinator {
  id: string;
  name: string;
  email?: string;
}

export interface BillingCurrency {
  idCurrency: number;
  currencyName?: string;
  currencyCode?: string;
}

export interface EventMarketSubSegment {
  idMarketSubSegment: number;
  marketSubSegmentName?: string;
  marketSegmentName?: string;
  idMarketSegment?: number;
}

export interface EventSubType {
  idEventSubType: number;
  eventSubTypeName?: string;
  eventTypeName?: string;
  idEventType?: number;
  idMarketSubSegment?: number;
  idEventMarketSubSegment?: number;
  idEventSubSegment?: number;
  subSegmentId?: number;
}

export interface EventPaymentForm {
  idPaymentForm: number;
  paymentFormName?: string;
  paymentFormDescription?: string;
}

export interface TaxExemption {
  idTaxExemption: number;
  taxExemptionName?: string;
}

export interface ExtraTip {
  idExtraTip: number;
  extraTipName?: string;
  extraTipDescription?: string;
}

export interface Contingency {
  idContingency: number;
  contingencyName?: string;
}

export interface ClientEventManager {
  idClientEventManager: number;
  clientEventManagerName?: string;
  clientEventManagerEmail?: string;
  clientEventManagerPhone?: string;
}

export interface Resource {
  idResource: number;
  resourceName?: string;
}

export interface ActivityPackage {
  idActivityPackage: number;
  activityPackageName?: string;
}

export interface Client {
  idClient?: number;
  clientCode?: string;
  clientName?: string;
  tradeName?: string;
  legalName?: string;
  address?: string;
  identificationNumber?: string;
  email?: string;
  location?: string;
  city?: string | null;
  zipcode?: string | null;
  province?: string | null;
  phone?: string;
  idIdentificationType?: number | null;
  idProfileType?: number | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface Contact {
  idClientEventManager?: number;
  clientEventManagerName?: string;
  clientEventManagerEmail?: string;
  clientEventManagerMobilePhone?: string;
  clientEventManagerPhone?: string;
  client?: any;
  idClient?: number;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
}

export interface Schedule {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Event {
  idEvent: number;
  eventNumber: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedPax: number;
  realPax: number;
  contractNumber: string;
  reference: string;
  comments: string;
  internalComments: string;
  creationDate: string;
  modificationDate: string;
  icca?: boolean | number;
  sustainable?: boolean | number;
  // Propiedades opcionales para simplificar
  salesAgent?: any;
  eventType?: any;
  eventStatus?: any;
  client?: any;
  activities?: any[];
  eventRooms?: any[];
}

export interface EventQuote {
  id: string;
  eventId: string;
  total: number;
  currency: string;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EventInvoice {
  id: string;
  eventId: string;
  invoiceNumber: string;
  date: string;
  total: number;
  currency: string;
  status: string;
}
