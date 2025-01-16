import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type BasketError = {
  id: string;
  itemId: string;
  error: string;
};

export type Consumption = {
  externalLocationId: string | undefined;
  uniqueStockItems: string[];
  basketErrors: BasketError[];
  stockItemsError: string | null;
  selectedStockItem: StockItem | undefined;
  quantity: number;
  noStockUsed: boolean;
  itemSelected: boolean;
  serialNo: string | undefined;
  msisdn: string | undefined;
  type: "Issue" | "Collect" | undefined;
  isValid: boolean;
  showReturnableStockItems: boolean;
  errors: string[];
  searchParams: {
    ticketType: string;
    ticketIdentifier: string;
  };
};

export type Balance = {
  searchParams: {
    locationCode: string;
  };
};

export type Transfer = {
  searchParams: {
    locationCode: string;
  };
  returnStockItems: StockItem[];
};

type State = {
  isBusy: boolean;
  consumption: Consumption;
  balance: Balance;
  transfer: Transfer;
  ticket: Ticket | undefined;
  msisdnItemCode: string;
};

type Action = {
  setIsBusy: (isBusy: boolean) => void;
  updateConsumption: (updates: Partial<Consumption>) => void;
  resetConsumption: () => void;
  setTicket: (ticket: Ticket) => void;
  loadStockItems: (stockItems: StockItem[]) => void;
  loadReturnStockItems: (stockItems: StockItem[]) => void;
  clearStockItems: () => void;
  clearReturnStockItems: () => void;
  setStockItemsError: (error: string | null) => void;
  setReturnStockItemsError: (error: string | null) => void;
  addBasketErrors: (itemId: string, error: string) => void;
  clearBasketErrors: () => void;
  addError: (error: string) => void;
  setConsumptionSearchParams: (searchParams: {
    ticketType: string;
    ticketIdentifier: string;
  }) => void;
  setBalanceSearchParams: (searchParams: { locationCode: string }) => void;
  setTransferSearchParams: (searchParams: { locationCode: string }) => void;
};

export const useTsmStore = create<State & Action>()(
  devtools((set) => ({
    isBusy: false,
    consumption: {
      externalLocationId: undefined,
      uniqueStockItems: [],
      basketErrors: [],
      stockItemsError: null,
      selectedStockItem: undefined,
      quantity: 0,
      noStockUsed: false,
      itemSelected: false,
      serialNo: undefined,
      msisdn: undefined,
      type: "Issue",
      isValid: false,
      showReturnableStockItems: false,
      errors: [],
      searchParams: {
        ticketType: "",
        ticketIdentifier: "",
      },
    },
    balance: {
      searchParams: {
        locationCode: "",
      },
    },
    transfer: {
      searchParams: {
        locationCode: "",
      },
      returnStockItems: [],
    },
    ticket: undefined,
    msisdnItemCode: "SAG-5370-4P",

    setIsBusy: (isBusy) => set({ isBusy }),

    updateConsumption: (updates) =>
      set((state) => {
        const newState = { ...state.consumption, ...updates };

        //The logic checks the type property and applies different conditions based on whether it's "Issue" or "Collect".
        // For the "Collect" type, it only checks if serialNo has a value, without considering the stockCode comparison.
        const hasValidSerialItem =
          newState.type === "Collect"
            ? !!newState.serialNo
            : !!newState.selectedStockItem &&
              newState.selectedStockItem?.serialItem &&
              !!newState.serialNo &&
              newState.selectedStockItem?.stockCode !== state.msisdnItemCode;

        const hasValidNonSerialItem =
          !!newState.selectedStockItem &&
          !newState.selectedStockItem?.serialItem &&
          newState.quantity > 0 &&
          newState.quantity <=
            (newState.selectedStockItem?.availableQuantity || 0);

        const hasValidMsisdnItem =
          !!newState.selectedStockItem &&
          newState.selectedStockItem?.stockCode === state.msisdnItemCode &&
          !!newState.msisdn &&
          (newState.msisdn.length === 8 || newState.msisdn.length === 10) &&
          !!newState.serialNo;

        newState.isValid =
          hasValidSerialItem || hasValidNonSerialItem || hasValidMsisdnItem;

        return { consumption: newState };
      }),

    resetConsumption: () =>
      set((state) => ({
        consumption: {
          externalLocationId: undefined,
          uniqueStockItems: [],
          basketErrors: [],
          stockItemsError: null,
          selectedStockItem: undefined,
          quantity: 0,
          noStockUsed: false,
          itemSelected: false,
          serialNo: undefined,
          msisdn: undefined,
          type: "Issue",
          isValid: false,
          showReturnableStockItems: false,
          errors: [],
          searchParams: state.consumption.searchParams,
        },
      })),

    setTicket: (ticket) => set({ ticket }),

    loadStockItems: (stockItems) =>
      set((state) => ({
        consumption: {
          ...state.consumption,
          uniqueStockItems: Array.from(
            new Set(stockItems.map((item) => item.stockDescription))
          ),
          stockItemsError: null,
        },
      })),

    loadReturnStockItems: (stockItems) =>
      set(
        (state) => ({
          transfer: { ...state.transfer, returnStockItems: stockItems },
        }),
        undefined,
        "loadReturnStockItems"
      ),

    clearStockItems: () =>
      set((state) => ({
        consumption: { ...state.consumption, uniqueStockItems: [] },
      })),

    clearReturnStockItems: () =>
      set((state) => ({
        transfer: { ...state.transfer, returnStockItems: [] },
      })),

    setStockItemsError: (error) =>
      set((state) => ({
        consumption: { ...state.consumption, stockItemsError: error },
      })),

    setReturnStockItemsError: (error) =>
      set((state) => ({
        transfer: { ...state.transfer, returnStockItemsError: error },
      })),

    addBasketErrors: (itemId, error) =>
      set((state) => ({
        consumption: {
          ...state.consumption,
          basketErrors: [
            ...state.consumption.basketErrors,
            { id: uuidv4(), itemId, error },
          ],
        },
      })),

    clearBasketErrors: () =>
      set((state) => ({
        consumption: { ...state.consumption, basketErrors: [] },
      })),

    addError: (error) =>
      set((state) => ({
        consumption: {
          ...state.consumption,
          errors: [...state.consumption.errors, error],
        },
      })),

    setConsumptionSearchParams: (searchParams) =>
      set((state) => ({
        consumption: { ...state.consumption, searchParams },
      })),

    setBalanceSearchParams: (searchParams) =>
      set((state) => ({
        balance: { ...state.balance, searchParams },
      })),

    setTransferSearchParams: (searchParams) =>
      set((state) => ({
        transfer: { ...state.transfer, searchParams },
      })),
  }))
);
