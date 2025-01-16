import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { useTsmStore } from "../stores/tsmStore";
import { STOCK_URL } from "../utils/constants";

export function getReturnStockItems(token: string, locationCode: string) {
  const {
    loadReturnStockItems,
    clearReturnStockItems,
    setReturnStockItemsError,
  } = useTsmStore.getState();

  return useQuery<StockItem[], Error>({
    queryKey: ["returnStockItems", locationCode],
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

        loadReturnStockItems(result);
        return result;
      } catch (error) {
        setReturnStockItemsError(`Unable to load return stock items`);
        clearReturnStockItems();
        return [];
      }
    },
    enabled: !!token && !!locationCode,
    staleTime: 0,
  });
}
