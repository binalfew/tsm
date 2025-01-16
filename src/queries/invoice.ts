import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { INVOICE_URL } from "../utils/constants";

export function getInvoice(
  token: string,
  ticketType: string,
  ticketIdentifier: string
) {
  return useQuery<Invoice[], Error>({
    queryKey: ["invoice", ticketIdentifier, ticketType],
    queryFn: async () => {
      return await ky
        .get(INVOICE_URL, {
          retry: {
            statusCodes: [500],
          },
          searchParams: {
            ticketType,
            ticketIdentifier,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json();
    },
    enabled: !!token && !!ticketType && !!ticketIdentifier,
    staleTime: 0,
  });
}

export function getInvoiceByDateRangeAndLocationId(
  token: string,
  ticketType: string,
  locationExternalId?: string,
  startDate?: string,
  endDate?: string
) {
  const callEnabled =
    !!token && !!ticketType && !!locationExternalId && !!startDate && !!endDate;

  return useQuery<Invoice[], Error>({
    queryKey: ["invoice", ticketType, locationExternalId, startDate, endDate],
    queryFn: async () => {
      return await ky
        .get(INVOICE_URL, {
          retry: {
            statusCodes: [500],
          },
          searchParams: {
            ticketType,
            locationExternalId: locationExternalId ?? "",
            startDate: startDate ?? "",
            endDate: endDate ?? "",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json();
    },
    enabled: callEnabled,
    staleTime: 0,
  });
}
