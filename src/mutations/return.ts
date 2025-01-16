import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRANSFER_ORDER_URL } from "../utils/constants";

const handleError = async (response: Response) => {
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(
      errorResponse.errorMessage || "Network response was not ok"
    );
  }
};

const getFetchOptions = (method: string, token: string, body?: any) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: body ? JSON.stringify(body) : undefined,
});

export function useTransferOrder(token: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TransferOrderModel>({
    mutationFn: async (transferOrder) => {
      const response = await fetch(
        `${TRANSFER_ORDER_URL}`,
        getFetchOptions("POST", token, transferOrder)
      );
      await handleError(response);

      if (response.status === 207) {
        throw new Error("Transfer order submission failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returnStockItems"] });
    },
  });
}
