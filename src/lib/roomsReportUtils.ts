import * as XLSX from "xlsx";
import type { Room, RoomRate } from "../types/skill/api";

type NormalizedRoomRate = {
  roomId: number | null;
  setupId: number | null;
  setupName: string;
  price: number;
  currency: string;
};

const DEFAULT_CURRENCY = "USD";

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const asPositiveNumber = (value: unknown): number | null => {
  const parsed = asNumber(value);
  if (parsed === null) return null;
  return parsed > 0 ? parsed : null;
};

const findNumericDeep = (
  source: unknown,
  keyPattern: RegExp,
  visited = new WeakSet<object>()
): number | null => {
  if (!source || typeof source !== "object") return null;
  if (visited.has(source as object)) return null;
  visited.add(source as object);

  if (Array.isArray(source)) {
    for (const item of source) {
      const found = findNumericDeep(item, keyPattern, visited);
      if (found !== null) return found;
    }
    return null;
  }

  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (keyPattern.test(key)) {
      const parsed = asPositiveNumber(value);
      if (parsed !== null) return parsed;
    }

    if (value && typeof value === "object") {
      const nested = findNumericDeep(value, keyPattern, visited);
      if (nested !== null) return nested;
    }
  }

  return null;
};

const pickActivePriceList = (rate: any) => {
  const lists = Array.isArray(rate?.priceLists)
    ? rate.priceLists
    : rate?.priceList
    ? [rate.priceList]
    : [];

  if (lists.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);

  const activeInRange = lists.find(
    (item: any) =>
      item?.priceListActive === true &&
      (!item?.priceListFromDate ||
        !item?.priceListToDate ||
        (item.priceListFromDate <= today && item.priceListToDate >= today))
  );

  if (activeInRange) return activeInRange;

  const active = lists.find((item: any) => item?.priceListActive === true);
  if (active) return active;

  return lists[0] ?? null;
};

const extractPriceTI = (rate: any) => {
  const selectedPriceList = pickActivePriceList(rate);
  const deepTi = findNumericDeep(
    rate,
    /(priceTI|taxesincluded|withtax|inclu|incluido|roomPriceTI|roomRateTI)/i
  );

  return (
    deepTi ??
    asPositiveNumber(rate?.priceTI) ??
    asPositiveNumber(rate?.roomPriceTaxesIncluded) ??
    asPositiveNumber(rate?.roomRateTaxesIncluded) ??
    asPositiveNumber(rate?.roomSetupPriceTaxesIncluded) ??
    asPositiveNumber(rate?.priceList?.roomPriceTaxesIncluded) ??
    asPositiveNumber(selectedPriceList?.roomPriceTaxesIncluded) ??
    asPositiveNumber(selectedPriceList?.roomRateTaxesIncluded) ??
    null
  );
};

const normalizeRate = (rate: RoomRate): NormalizedRoomRate => {
  const roomId =
    asNumber((rate as any).roomId) ??
    asNumber((rate as any).idRoom) ??
    asNumber((rate as any).room?.idRoom) ??
    asNumber((rate as any).roomSetup?.room?.idRoom) ??
    asNumber((rate as any).idActivityRoom) ??
    null;

  const setupId =
    asNumber((rate as any).idRoomSetup) ??
    asNumber((rate as any).roomSetupId) ??
    asNumber((rate as any).setupId) ??
    asNumber((rate as any).roomSetup?.idRoomSetup) ??
    null;

  const setupName = String(
    (rate as any).roomSetupName ??
      (rate as any).setupName ??
      (rate as any).roomSetup?.roomSetupName ??
      ""
  )
    .trim()
    .toLowerCase();

  const price =
    extractPriceTI(rate as any) ??
    asPositiveNumber((rate as any).rate) ??
    asPositiveNumber((rate as any).price) ??
    asPositiveNumber((rate as any).amount) ??
    asPositiveNumber((rate as any).roomRate) ??
    asPositiveNumber((rate as any).roomPrice) ??
    0;

  const currency =
    String(
      (rate as any).currency ??
        (rate as any).currencyCode ??
        (rate as any).priceList?.currencyCode ??
        (rate as any).priceList?.currency ??
        (rate as any).roomRateCurrency ??
        DEFAULT_CURRENCY
    ) || DEFAULT_CURRENCY;

  return {
    roomId,
    setupId,
    setupName,
    price,
    currency,
  };
};

const normalizeRoomRates = (roomRates: RoomRate[]) =>
  roomRates.map(normalizeRate);

const findBaseRate = (roomId: number, roomRates: NormalizedRoomRate[]) => {
  const roomSpecificRates = roomRates.filter(
    (rate) => rate.roomId !== null && rate.roomId === roomId
  );

  const baseRate = roomSpecificRates.find(
    (rate) => !rate.setupId && !rate.setupName
  );

  return baseRate ?? roomSpecificRates[0] ?? null;
};

const findSetupRate = (
  roomId: number,
  setupId: number,
  setupName: string,
  roomRates: NormalizedRoomRate[]
) => {
  const normalizedSetupName = setupName.trim().toLowerCase();
  const roomSpecificRates = roomRates.filter(
    (rate) => rate.roomId !== null && rate.roomId === roomId
  );

  const byId = roomSpecificRates.find(
    (rate) => rate.setupId !== null && rate.setupId === setupId
  );
  if (byId) return byId;

  if (normalizedSetupName) {
    const byName = roomSpecificRates.find(
      (rate) =>
        rate.setupName &&
        (rate.setupName === normalizedSetupName ||
          rate.setupName.includes(normalizedSetupName) ||
          normalizedSetupName.includes(rate.setupName))
    );

    if (byName) return byName;
  }

  const globalById = roomRates.find(
    (rate) => rate.setupId !== null && rate.setupId === setupId
  );
  if (globalById) return globalById;

  if (normalizedSetupName) {
    const globalByName = roomRates.find(
      (rate) =>
        rate.setupName &&
        (rate.setupName === normalizedSetupName ||
          rate.setupName.includes(normalizedSetupName) ||
          normalizedSetupName.includes(rate.setupName))
    );

    if (globalByName) return globalByName;
  }

  return null;
};

export const getRoomPriceInfo = (room: Room, roomRates: RoomRate[]) => {
  const normalizedRates = normalizeRoomRates(roomRates);
  const baseRate = findBaseRate(Number(room.idRoom), normalizedRates);

  if (baseRate && Number.isFinite(baseRate.price) && baseRate.price > 0) {
    return {
      price: baseRate.price,
      currency: baseRate.currency || DEFAULT_CURRENCY,
    };
  }

  const setupRates = room.roomSetups
    .map((setup) =>
      findSetupRate(
        Number(room.idRoom),
        Number(setup.idRoomSetup),
        setup.roomSetupName || "",
        normalizedRates
      )
    )
    .filter((rate): rate is NormalizedRoomRate =>
      Boolean(rate && Number.isFinite(rate.price) && rate.price > 0)
    );

  if (setupRates.length > 0) {
    const minSetupRate = setupRates.reduce((min, current) =>
      current.price < min.price ? current : min
    );

    return {
      price: minSetupRate.price,
      currency: minSetupRate.currency || DEFAULT_CURRENCY,
    };
  }

  return {
    price: null as number | null,
    currency: DEFAULT_CURRENCY,
  };
};

export async function generateRoomsGeneralExcelReport(
  rooms: Room[],
  roomRates: RoomRate[]
) {
  const reportDate = new Date().toISOString().split("T")[0];

  const rows = rooms.map((room) => {
    const capacity =
      room.roomSetups.length > 0
        ? Math.max(...room.roomSetups.map((setup) => setup.roomSetupPaxsCapacity))
        : null;

    const priceInfo = getRoomPriceInfo(room, roomRates);

    return {
      "ID Salón": room.idRoom,
      "Nombre Salón": room.roomName,
      "Área (m²)": room.roomMt2,
      "Altura (m)": room.roomHeight,
      "Capacidad Máxima": capacity,
      Estado: room.roomActive ? "Activo" : "Inactivo",
      "Precio TI": priceInfo.price ?? "N/D",
      Moneda: priceInfo.currency,
      Comentarios: room.roomComments || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "General Salones");

  XLSX.writeFile(workbook, `Reporte_Salones_General_${reportDate}.xlsx`);
}

export async function generateRoomsTotalsExcelReport(
  rooms: Room[],
  roomRates: RoomRate[]
) {
  const normalizedRates = normalizeRoomRates(roomRates);
  const reportDate = new Date().toISOString().split("T")[0];

  const summaryRows = rooms.map((room) => {
    const baseRate = findBaseRate(Number(room.idRoom), normalizedRates);

    const setupPrices = room.roomSetups.map((setup) => {
      const rate = findSetupRate(
        Number(room.idRoom),
        Number(setup.idRoomSetup),
        setup.roomSetupName || "",
        normalizedRates
      );

      return {
        setupId: setup.idRoomSetup,
        setupName: setup.roomSetupName || "Sin nombre",
        setupCapacity: setup.roomSetupPaxsCapacity,
        setupPrice: rate?.price ?? 0,
        currency: rate?.currency || baseRate?.currency || DEFAULT_CURRENCY,
      };
    });

    const totalSetups = setupPrices.reduce(
      (sum, item) => sum + (Number.isFinite(item.setupPrice) ? item.setupPrice : 0),
      0
    );

    const basePrice = baseRate?.price ?? 0;
    const totalRoom = basePrice + totalSetups;

    const maxCapacity =
      room.roomSetups.length > 0
        ? Math.max(...room.roomSetups.map((setup) => setup.roomSetupPaxsCapacity))
        : null;

    return {
      "ID Salón": room.idRoom,
      "Nombre Salón": room.roomName,
      Montajes: room.roomSetups.length,
      "Capacidad Máxima": maxCapacity,
      "Precio TI Base": basePrice,
      "Total Montajes": totalSetups,
      "Total Salón": totalRoom,
      Moneda: baseRate?.currency || setupPrices[0]?.currency || DEFAULT_CURRENCY,
    };
  });

  const setupRows = rooms.flatMap((room) =>
    room.roomSetups.map((setup) => {
      const rate = findSetupRate(
        Number(room.idRoom),
        Number(setup.idRoomSetup),
        setup.roomSetupName || "",
        normalizedRates
      );

      return {
        "ID Salón": room.idRoom,
        "Nombre Salón": room.roomName,
        "ID Montaje": setup.idRoomSetup,
        Montaje: setup.roomSetupName || "Sin nombre",
        "Capacidad Montaje": setup.roomSetupPaxsCapacity,
        "Precio TI Montaje": rate?.price ?? "N/D",
        Moneda: rate?.currency || DEFAULT_CURRENCY,
      };
    })
  );

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const setupsSheet = XLSX.utils.json_to_sheet(setupRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Totales Salón");
  XLSX.utils.book_append_sheet(workbook, setupsSheet, "Montajes");

  XLSX.writeFile(workbook, `Reporte_Salones_Totales_${reportDate}.xlsx`);
}
