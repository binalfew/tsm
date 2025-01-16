import { useQueries, useQuery } from "@tanstack/react-query";
import { isSameDay, parseISO } from "date-fns";
import ky from "ky";
import { TICKET_URL } from "../utils/constants";

export function getTicket(
  token: string,
  ticketType: string,
  ticketIdentifier: string
) {
  return useQuery<Ticket, Error>({
    queryKey: ["ticket", ticketIdentifier, ticketType],
    queryFn: async () => {
      return await ky
        .get(TICKET_URL, {
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
    select: (data) => ({
      ...data,
      assignedTechnicians: data.assignedTechnicians
        .sort(
          (a, b) =>
            parseISO(b.dateAssigned).getTime() -
            parseISO(a.dateAssigned).getTime()
        )
        .map((technician) => ({
          ...technician,
          assignedToday: isSameDay(
            parseISO(technician.dateAssigned),
            new Date()
          ),
        })),
    }),
    enabled: !!token && !!ticketType && !!ticketIdentifier,
    staleTime: 0,
  });
}

export function getTickets(
  token: string,
  ticketType: string,
  ticketIdentifiers: string[]
): TicketsCombined {
  const queries = useQueries({
    queries: ticketIdentifiers.map((ticketIdentifier) => {
      return {
        queryKey: ["ticket", ticketIdentifier, ticketType],
        queryFn: async () => {
          return await ky
            .get(TICKET_URL, {
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
      };
    }),
    combine: (results) => {
      return {
        data: results.map((result, index) => {
          return {
            ticketNumber: ticketIdentifiers[index],
            ticketApiInfo: result.data as Ticket,
          };
        }),
        pending: results.some((result) => result.isPending),
      };
    },
  });

  return queries;
}
