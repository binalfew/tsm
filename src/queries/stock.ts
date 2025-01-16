import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { useTsmStore } from "../stores/tsmStore";
import { RETURNABLE_STOCK_URL, STOCK_URL } from "../utils/constants";

export function getStockItems(token: string, locationCode: string) {
  const { loadStockItems, clearStockItems, setStockItemsError } =
    useTsmStore.getState();

  return useQuery<StockItem[], Error>({
    queryKey: ["stockItems", locationCode],
    queryFn: async () => {
      try {
        const result = await ky
          .get(STOCK_URL, {
            retry: {
              statusCodes: [500],
            },
            searchParams: {
              locationCode: encodeURIComponent(locationCode),
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json<StockItem[]>();

        loadStockItems(result);
        return result;
      } catch (error) {
        setStockItemsError(`Unable to load stock items for user`);
        clearStockItems();
        return [];
      }
    },
    enabled: !!token && !!locationCode,
    staleTime: 0,
  });
}

export function getReturnableStockItems(token: string, shouldFetch: boolean) {
  const { loadStockItems, clearStockItems, setStockItemsError } =
    useTsmStore.getState();

  return useQuery<StockItem[], Error>({
    queryKey: ["returnableStockItems"],
    queryFn: async () => {
      try {
        const result = await ky
          .get(RETURNABLE_STOCK_URL, {
            retry: {
              statusCodes: [500],
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json<StockItem[]>();

        loadStockItems(result);
        return result;
      } catch (error) {
        setStockItemsError(`Unable to load returnable stock items`);
        clearStockItems();
        return [];
      }
    },
    enabled: !!token && shouldFetch,
    staleTime: 0,
  });
}
