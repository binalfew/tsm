import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { BASKET_URL } from "../utils/constants";

export function getBasket(
  token: string,
  ticketType: string,
  ticketIdentifier: string
) {
  return useQuery<Basket, Error>({
    queryKey: ["basket", ticketIdentifier, ticketType],
    queryFn: async () => {
      if (!token || !ticketType || !ticketIdentifier) {
        throw new Error("Missing required parameters");
      }

      return await ky
        .get(BASKET_URL, {
          retry: {
            statusCodes: [500],
          },
          searchParams: {
            ticketType: ticketType,
            ticketIdentifier: ticketIdentifier,
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
