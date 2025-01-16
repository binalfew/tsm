import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTsmStore } from "../stores/tsmStore";
import { BASKET_URL, ITEM_URL } from "../utils/constants";

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

export function useAddItemToBasket(token: string) {
  const queryClient = useQueryClient();

  return useMutation<Basket, ApiError, AddBasketItemModel>({
    mutationFn: async (item) => {
      const response = await fetch(
        `${ITEM_URL}`,
        getFetchOptions("POST", token, item)
      );
      if (!response.ok) {
        const errorResponse = await response.json();
        const error: ApiError = {
          errorType: errorResponse.errorType || "UnknownError",
          errorMessage:
            errorResponse.errorMessage || "An unknown error occurred",
        };
        throw error;
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basket"] });
    },
    onError: (error) => {
      console.error("Error adding item to basket", error);
    },
  });
}

export function useDeleteItemFromBasket(token: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (itemId) => {
      const response = await fetch(
        `${ITEM_URL}?basketItemId=${encodeURIComponent(itemId)}`,
        getFetchOptions("DELETE", token)
      );
      await handleError(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basket"] });
    },
  });
}

export function useSubmitBasket(token: string) {
  const queryClient = useQueryClient();
  const { addBasketErrors } = useTsmStore();

  return useMutation<void, Error, SubmitBasketModel>({
    mutationFn: async (submission) => {
      const response = await fetch(
        `${BASKET_URL}`,
        getFetchOptions("POST", token, submission)
      );
      await handleError(response);

      if (response.status === 207) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.errorMessage;
        const parsedErrorMessage = JSON.parse(errorMessage) as {
          itemId: string;
          error: string;
        }[];
        parsedErrorMessage.forEach((error) => {
          addBasketErrors(error.itemId, error.error);
        });

        throw new Error("Basket submission failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basket"] });
    },
  });
}
