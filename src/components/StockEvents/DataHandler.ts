import { isStrEmptyOrBlank } from "../../utils/helpers";

export interface TechnicianStockItem {
  stockName: string;
  date?: string;
  quantity?: number;
  ticketNo?: string;
  accessNo?: string;
  accessNumberPopulated: boolean;
}

export interface TechnicianStockInfo {
  stockFetched: boolean;
  stock?: Array<TechnicianStockItem>;
}

export interface IMapData {
  displayInvoices: Array<TechnicianStockItem>;
  accessNumbers: Map<string, Array<TechnicianStockItem>>;
}

export const mapApiInvoice = (apiInvoices: any): IMapData => {
  let accessNumbers: Map<string, Array<TechnicianStockItem>> = new Map();

  let displayInvoices: Array<TechnicianStockItem> = [];
  if (apiInvoices) {
    for (let i = 0; i < apiInvoices.length; i++) {
      const inv = apiInvoices.at(i);
      if (inv && inv.items) {
        for (let j = 0; j < inv.items.length; j++) {
          const invItem = inv.items.at(j);
          let tsi: TechnicianStockItem = {
            stockName: invItem.stockName,
            date: inv.createdDate,
            quantity: isStrEmptyOrBlank(invItem.serialNo)
              ? invItem?.quantity
              : invItem.serialNo,
            ticketNo: inv.externalReference,
            accessNo: undefined, // will be populated with a call to ticket api
            accessNumberPopulated: false,
          };

          displayInvoices.push(tsi);

          // map accessNumbers to their invoices - this will be used to fetch corresponding access numbers
          if (tsi.ticketNo && !isStrEmptyOrBlank(tsi.ticketNo)) {
            let associatedInvoices = accessNumbers.get(tsi.ticketNo);
            if (associatedInvoices === undefined) {
              accessNumbers.set(tsi.ticketNo, [tsi]);
            } else {
              associatedInvoices.push(tsi);
            }
          }
        }
      }
    }
  }

  return { displayInvoices, accessNumbers };
};

export const updateTicketInfo = (
  map: IMapData,
  ticketToAccess: Array<TicketToAccess>
): void => {
  if (
    map.accessNumbers.size === 0 ||
    !ticketToAccess ||
    ticketToAccess.length === 0
  ) {
    return; // nothing to update
  }

  for (let [key, value] of map.accessNumbers) {
    const resp = ticketToAccess.find((tta) => tta.ticketNumber === key);

    const accessNumber = resp ? resp.ticketApiInfo.accessNumber : undefined;

    for (let tsi of value) {
      tsi.accessNo = accessNumber;
      tsi.accessNumberPopulated = true;
    }
  }
};
