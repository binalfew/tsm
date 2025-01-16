import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { CREDITMEMO_URL } from "../utils/constants";

export function getCreditMemo(
  token: string,
  ticketType: string,
  ticketIdentifier: string
) {
  return useQuery<Invoice[], Error>({
    queryKey: ["creditmemo", ticketIdentifier, ticketType],
    queryFn: async () => {
      return await ky
        .get(CREDITMEMO_URL, {
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
