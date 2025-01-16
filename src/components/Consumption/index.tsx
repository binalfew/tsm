import { useQueryClient } from "@tanstack/react-query";
import { Alert, Col, Modal, Row, Spin, Tabs } from "antd";
import { QrCode, RoleEnforcer } from "common-react-components";
import Keycloak from "keycloak-js";
import React, { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { useSearchParams } from "react-router-dom";
import { useToken } from "../../hooks";
import { getBasket } from "../../queries/basket";
import { getCreditMemo } from "../../queries/creditmemo";
import { getInvoice } from "../../queries/invoice";
import { getStockItems } from "../../queries/stock";
import { getTicket } from "../../queries/ticket";
import { useTsmStore } from "../../stores/tsmStore";
import {
  getUserIndexNumber,
  getUserRoles,
  isStrEmptyOrBlank,
  userHasRole,
  userHasRoles,
} from "../../utils/helpers";
import Panel from "../Panel";
import Basket from "./Basket";
import Collected from "./Collected";
import Invoice from "./Invoice";
import MsisdnInput from "./MsisdnInput";
import NoStockCheckbox from "./NoStockCheckbox";
import QuantityInput from "./QuantityInput";
import SerialNoInput from "./SerialNoInput";
import StockForm from "./StockForm";
import SubmitButton from "./SubmitButton";
import TicketSearch from "./TicketSearch";

interface BasketMessage extends MessageEvent {
  data: {
    type: "basket-updated";
    url: string;
  };
}

/**
 * Consumption Component
 *
 * This component manages the stock consumption process for technicians.
 * It handles ticket search, stock item selection, quantity input, and basket management.
 *
 * Key features:
 * - Ticket search and display
 * - Stock item selection and validation
 * - Quantity input for non-serialized items
 * - MSISDN input for specific items
 * - QR code scanning for serialized items
 * - Basket management (add items, view, submit)
 * - Role-based access control
 * - Support for super users with additional permissions
 *
 * The component uses various custom hooks and utilities from the TSM (Technician Stock Management) system.
 * It integrates with external APIs for fetching ticket, stock, and basket data.
 */
const Consumption: React.FC<{ auth: Keycloak }> = ({ auth }) => {
  const [, contextHolder] = Modal.useModal();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const queryClient = useQueryClient();

  const token = useToken(auth);
  /**
   * Retrieves the URL search parameters.
   * These are used to fetch and display the relevant ticket information.
   */
  const [searchParams] = useSearchParams();

  /**
   * Retrieves the consumption state from the TSM store based on zustand
   */
  const {
    consumption,
    updateConsumption,
    setConsumptionSearchParams,
    resetConsumption,
    isBusy,
    msisdnItemCode,
  } = useTsmStore((state) => state);

  /**
   * Retrieves the default external location ID from the user's information.
   * This is used as a fallback for the external location ID if it's not provided in the consumption state.
   */
  const defaultExternalLocationId = getUserIndexNumber(auth);

  /**
   * Retrieves the user's roles from the the access token issued by the SSO service.
   * This is used to determine if the user has the necessary permissions to perform certain actions.
   */
  const roles = getUserRoles(auth);

  /**
   * Retrieves the ticket type and ticket identifier from the URL search parameters.
   * These are used to fetch and display the relevant ticket information.
   */
  const { ticketType, ticketIdentifier } = consumption.searchParams;

  /**
   * Retrieves the external location ID from the consumption state.
   * This is used to fetch and display the relevant stock items for the selected location.
   */
  const externalLocationId = consumption.externalLocationId;

  /**
   * Determines if the user has the "TSM_DELETE_BASKET_ITEM_SUPER" role.
   * This is used to determine if the user is a super user and has the necessary permissions to perform certain actions.
   */
  const isSuperUser = userHasRoles(auth, [
    "TSM_ADD_STOCK_SUPER",
    "TSM_DELETE_BASKET_ITEM_SUPER",
  ]);

  /**
   * Determines if the user has the "TSM_ADD_STOCK_TECH" role.
   * This is used to determine if the user is a technician and has the necessary permissions to perform certain actions.
   */
  const canAddStock = userHasRole(auth, "TSM_ADD_STOCK_TECH");

  /**
   * Retrieves the ticket information for the ticket type and ticket identifier.
   * This is used to display the relevant ticket information and to validate the ticket assignment.
   */
  const { data: ticket } = getTicket(token, ticketType, ticketIdentifier);

  /**
   * Determines if the user has an assigned ticket for today.
   * This is used to determine if the user can consume stock for the selected ticket.
   */
  const hasAssignedTicket = ticket?.assignedTechnicians.some(
    (technician) =>
      technician.indexNumber === defaultExternalLocationId &&
      technician.assignedToday
  );

  /**
   * Retrieves the invoice data for the ticket.
   * This is used to display the relevant invoice information.
   */
  const {
    data: invoice,
    isLoading: isInvoiceLoading,
    isFetching: isInvoiceFetching,
  } = getInvoice(token, ticketType, ticketIdentifier);

  /**
   * Retrieves the invoice data for the ticket.
   * This is used to display the relevant invoice information.
   */
  const {
    data: creditmemo,
    isLoading: isCreditmemoLoading,
    isFetching: isCreditmemoFetching,
  } = getCreditMemo(token, ticketType, ticketIdentifier);

  /**
   * Retrieves the basket data for the ticket.
   * This is used to display the relevant basket information.
   */
  const {
    data: basket,
    isLoading: isBasketLoading,
    isFetching: isBasketFetching,
    error: basketError,
  } = getBasket(token, ticketType, ticketIdentifier);

  /**
   * Determines if the stock items should be fetched based on the external location ID and super user status.
   * This is used to fetch the relevant stock items for the selected location or all locations if the user is a super user.
   */
  const shouldFetchStockItems = Boolean(
    externalLocationId || (!isSuperUser && canAddStock && hasAssignedTicket)
  );

  /**
   * Retrieves the stock items for the selected location.
   * This is used to display the relevant stock items and to validate the selected stock item.
   */
  const {
    data: stock,
    isLoading: isStockLoading,
    isFetching: isStockFetching,
  } = getStockItems(
    token,
    shouldFetchStockItems ? externalLocationId || defaultExternalLocationId : ""
  );

  /**
   * Determines if the consumption functionality should be disabled.
   * It is disabled when:
   * - The user doesn't have an assigned ticket for today
   * AND
   * - The user is not a super user
   *
   * This ensures that:
   * - Regular users can only consume stock for tickets assigned to them for the current day
   * - Super users can access the consumption functionality regardless of ticket assignment
   * - Prevents unauthorized stock consumption by users without proper assignments or permissions
   */
  const disabled = !hasAssignedTicket && !isSuperUser;

  /**
   * Determines if the component is in a loading state.
   * It is true if any of the following conditions are met:
   * - Invoice data is loading or being fetched
   * - Basket data is loading or being fetched
   * - Stock data is loading or being fetched
   * - The component is in a busy state (e.g., processing an action)
   *
   * This consolidated loading state is used to control the display of loading indicators
   * and to disable user interactions while data is being processed or fetched.
   */
  const loading =
    isInvoiceLoading ||
    isInvoiceFetching ||
    isCreditmemoLoading ||
    isCreditmemoFetching ||
    isBasketLoading ||
    isStockLoading ||
    isBasketFetching ||
    isStockFetching ||
    isBusy;

  /**
   * Determines if the MSISDN input should be displayed.
   * It should be shown when:
   * - The selected stock item's stock code matches the MSISDN item code
   *
   * This ensures that:
   * - The MSISDN input is only shown for specific items (typically SIM cards or mobile numbers)
   * - Users can enter the MSISDN (Mobile Station International Subscriber Directory Number)
   *   when it's relevant to the selected item
   * - The input is hidden for non-MSISDN related items to simplify the interface
   */
  const shouldShowMsisdnInput =
    consumption.selectedStockItem?.stockCode === msisdnItemCode;

  /**
   * Determines whether to show the QR code scanner input.
   * It should be shown when:
   * 1. No stock item is selected OR the selected stock item is a serialized item
   * AND
   * 2. The user is not a super user OR the user is a super user and an external location ID is set
   *
   * This ensures that:
   * - The QR code is available for selecting serialized items
   * - Regular users always see the QR code option when appropriate
   * - Super users only see the QR code when they've selected a specific location (to prevent scanning items from any location)
   */
  const shouldShowQrCode =
    (!consumption.selectedStockItem ||
      consumption.selectedStockItem.serialItem) &&
    (!isSuperUser || (isSuperUser && consumption.externalLocationId));

  /**
   * Determines whether to show the quantity input field.
   * It should be shown when:
   * 1. A stock item is selected (consumption.selectedStockItem is truthy)
   * AND
   * 2. The selected stock item is not a serialized item
   *
   * This ensures that:
   * - Quantity input is only displayed for non-serialized items
   * - Users can specify the quantity of items to be added
   * - Serialized items (which are unique) don't require a quantity input
   */
  const shouldShowQuantityInput =
    consumption.selectedStockItem && !consumption.selectedStockItem.serialItem;

  /**
   * Determines whether to show the "No Stock" checkbox.
   * It should be shown when:
   * 1. No item is currently selected (consumption.itemSelected is false)
   * AND
   * 2. The basket is either undefined or empty (no items in basketItems)
   * AND
   * 3. No serial number is currently entered (consumption.serialNo is falsy)
   *
   * This ensures that:
   * - The "No Stock" option is only available when no items are being added or have been added
   * - Users can indicate that no stock is used only when it's appropriate (i.e., at the beginning of the process)
   * - The checkbox is hidden once any items are selected or added to the basket
   */
  const shouldShowNoStockCheckbox =
    !consumption.itemSelected &&
    (basket === undefined || basket?.basketItems.length === 0) &&
    !consumption.serialNo;

  /**
   * Renders the appropriate input component based on the current state and selected stock item.
   *
   * This function determines which input component to render based on the following conditions:
   *
   * 1. If shouldShowMsisdnInput is true:
   *    - Renders both SerialNoInput and MsisdnInput components side by side
   *    - Used for items that require both a serial number and an MSISDN (e.g., SIM cards)
   *
   * 2. If shouldShowQrCode is true:
   *    - Renders the QrCode component for scanning serialized items
   *    - Provides options for all serialized items in the stock
   *    - Disabled when no stock is used or when the user doesn't have permission
   *
   * 3. If shouldShowQuantityInput is true:
   *    - Renders the QuantityInput component for non-serialized items
   *    - Allows users to specify the quantity of items to be added
   *
   * 4. If none of the above conditions are met:
   *    - Returns an empty fragment
   *
   * The function uses the 'disabled' prop to control the interactivity of the inputs
   * based on the user's permissions and the current state of the consumption process.
   */
  const renderInput = () => {
    if (shouldShowMsisdnInput) {
      return (
        <div className="flex flex-row gap-2">
          <SerialNoInput disabled={disabled} />
          <MsisdnInput disabled={disabled} />
        </div>
      );
    }

    if (shouldShowQrCode) {
      return (
        <>
          <QrCode
            value={consumption.serialNo}
            disabled={consumption.noStockUsed || disabled}
            options={
              consumption.type === "Collect"
                ? []
                : stock
                    ?.filter((item) => item.serialItem)
                    .map((item) => ({
                      value: item.serialNo,
                      label: item.serialNo,
                    }))
            }
            dependencies={{
              externalLocationId: consumption.externalLocationId,
            }}
            onScanResult={handleValueSelected}
          />
        </>
      );
    }

    if (shouldShowQuantityInput) {
      return <QuantityInput disabled={disabled} />;
    }

    return <></>;
  };

  /**
   * Determines if valid search parameters for a ticket are present.
   *
   * This constant checks if both the ticketType and ticketIdentifier
   * in the consumption search parameters are non-empty strings.
   *
   * It's used to decide whether to display the ticket search interface
   * or the main consumption component. When true, it indicates that
   * a specific ticket has been selected or searched for, allowing
   * the component to display ticket-specific consumption options.
   */
  const hasSearchParams =
    !isStrEmptyOrBlank(consumption.searchParams.ticketType) &&
    !isStrEmptyOrBlank(consumption.searchParams.ticketIdentifier);

  /**
   * Handles the selection of a stock item value, typically from a QR code scan.
   *
   * This function performs the following actions:
   * 1. Searches for a stock item that matches the provided serial number.
   * 2. Updates the consumption state with the found stock item and its details:
   *    - selectedStockItem: Set to the found stock item object
   *    - serialNo: Set to the serial number of the found item
   *    - itemSelected: Set to true if an item was found, false otherwise
   *
   * This function is typically used as a callback for the QR code scanner or
   * when a user manually selects a serialized item. It ensures that the
   * component state is updated to reflect the newly selected item, preparing
   * it for potential addition to the basket.
   *
   * Note: If no matching stock item is found, the selectedStockItem will be undefined,
   * but the serialNo will still be updated. This allows for error handling or
   * further processing if needed.
   */
  const handleValueSelected = (value: string) => {
    if (consumption.type === "Collect") {
      updateConsumption({ serialNo: value, showReturnableStockItems: false });
      return;
    }

    const selectedStockItem = stock?.find((item) => item.serialNo === value);

    updateConsumption({
      selectedStockItem,
      serialNo: selectedStockItem?.serialNo,
      itemSelected: !!selectedStockItem,
    });
  };

  /**
   * Effect hook to handle URL search parameters for ticket information.
   *
   * It performs the following actions:
   * 1. Extracts 'ticketType' and 'ticketIdentifier' from the URL search parameters.
   * 2. If both parameters are present, it updates the consumption search params in the store.
   *
   * This allows the component to react to changes in the URL, such as when a user
   * navigates directly to a specific ticket or when the URL is updated programmatically.
   * By updating the store, it ensures that the component's state reflects the current URL,
   * maintaining consistency between the URL and the displayed ticket information.
   */
  useEffect(() => {
    const ticketType = searchParams.get("ticketType");
    const ticketIdentifier = searchParams.get("ticketIdentifier");
    if (ticketType && ticketIdentifier) {
      setConsumptionSearchParams({ ticketType, ticketIdentifier });
    }
  }, [searchParams]);

  /**
   * Cleanup effect for the Consumption component.
   *
   * This useEffect hook is responsible for cleaning up the component's state
   * when it unmounts. It performs two main actions:
   *
   * 1. Resets the consumption state to its initial values.
   * 2. Clears the ticket search parameters.
   *
   * The effect has no dependencies ([]), which means it will only run when the
   * component mounts and unmounts. The return function within the effect serves
   * as the cleanup function, which React will call when the component unmounts.
   *
   * This ensures that if a user navigates away from the Consumption component,
   * the state is reset, preventing any stale data from persisting when they
   * return to this component later.
   */
  useEffect(() => {
    return () => {
      resetConsumption();
      setConsumptionSearchParams({
        ticketType: "",
        ticketIdentifier: "",
      });
    };
  }, []);

  /**
   * Effect hook to handle the basket update message from the basket channel.
   * This is used to ensure that the basket is updated in real-time when a user
   * adds or removes items from the basket.
   * However, it only updates the basket if the URL matches exactly to avoid
   * unnecessary updates brrowser tabs/windows of other urls.
   */
  useEffect(() => {
    const channel = new BroadcastChannel("basket_channel");

    const handleBasketMessage = (msg: BasketMessage) => {
      if (msg.data.type === "basket-updated") {
        // Only invalidate if URLs match exactly
        const currentUrl = window.location.href;
        if (msg.data.url === currentUrl) {
          queryClient.invalidateQueries({ queryKey: ["basket"] });
        }
      }
    };

    channel.addEventListener("message", handleBasketMessage);

    return () => {
      channel.removeEventListener("message", handleBasketMessage);
      channel.close();
    };
  }, [queryClient]);

  if (consumption.errors.length > 0) {
    return (
      <Panel title="Error" loading={loading}>
        {consumption.errors.map((error) => (
          <Alert
            key={error}
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: "20px" }}
          />
        ))}
      </Panel>
    );
  }

  const handleSearch = (ticketType: string, ticketIdentifier: string) => {
    setConsumptionSearchParams({ ticketType, ticketIdentifier });
  };

  if (!hasSearchParams) {
    return (
      <Panel title="Search Ticket" loading={loading}>
        <TicketSearch onSearch={handleSearch} />
      </Panel>
    );
  }

  return (
    <Spin spinning={loading} size="small">
      {(isMobile || isTablet) && (
        <div className="flex flex-col gap-4">
          {contextHolder}
          <StockForm
            stock={stock || []}
            disabled={disabled}
            roles={roles}
            isSuperUser={isSuperUser}
            ticket={ticket}
            ticketType={ticketType}
            ticketIdentifier={ticketIdentifier}
            externalLocationId={externalLocationId || defaultExternalLocationId}
            token={token}
            renderInput={renderInput}
          />

          {basket && basket?.basketItems?.length > 0 && (
            <Panel
              title={`Basket - ${
                ticket?.accessNumber ?? ""
              } (Ticket: ${ticketIdentifier})`}
            >
              <Basket
                basket={basketError ? undefined : basket}
                disabled={disabled}
                roles={roles}
                token={token}
              />
            </Panel>
          )}
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={24}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  {shouldShowNoStockCheckbox && (
                    <RoleEnforcer
                      roles={roles}
                      permittedRoles={[
                        "TSM_ADD_STOCK_TECH",
                        "TSM_ADD_STOCK_SUPER",
                      ]}
                      matchAll={false}
                      deniedRender={<div>Access Denied</div>}
                      deniedProps={{ disabled: true }}
                      deniedPropsPassingType="Shallow"
                      deniedShowPermittedRoles={true}
                    >
                      <NoStockCheckbox disabled={disabled} />
                    </RoleEnforcer>
                  )}
                </div>
                <div>
                  <SubmitButton
                    basket={basket}
                    disabled={loading}
                    auth={auth}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Panel
            title={`Invoiced - ${
              ticket?.accessNumber ?? ""
            } (Ticket: ${ticketIdentifier})`}
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: `Issued (${
                    invoice?.flatMap((inv) => inv.items).length || 0
                  })`,
                  key: "1",
                  children: invoice && invoice.length > 0 && (
                    <Invoice invoices={invoice} />
                  ),
                },
                {
                  label: `Collected (${
                    creditmemo?.flatMap((memo) => memo.items).length || 0
                  })`,
                  key: "2",
                  children: creditmemo && creditmemo.length > 0 && (
                    <Collected invoices={creditmemo} />
                  ),
                },
              ]}
            />
          </Panel>
        </div>
      )}

      {isDesktop && (
        <div className="flex flex-col gap-4">
          {contextHolder}

          <Panel
            title={`Invoiced - ${
              ticket?.accessNumber ?? ""
            } (Ticket: ${ticketIdentifier})`}
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  label: `Issued (${
                    invoice?.flatMap((inv) => inv.items).length || 0
                  })`,
                  key: "1",
                  children: invoice && invoice.length > 0 && (
                    <Invoice invoices={invoice} />
                  ),
                },
                {
                  label: `Collected (${
                    creditmemo?.flatMap((memo) => memo.items).length || 0
                  })`,
                  key: "2",
                  children: creditmemo && creditmemo.length > 0 && (
                    <Collected invoices={creditmemo} />
                  ),
                },
              ]}
            />
          </Panel>

          {basket && basket?.basketItems?.length > 0 && (
            <Panel
              title={`Basket - ${
                ticket?.accessNumber ?? ""
              } (Ticket: ${ticketIdentifier})`}
            >
              <Basket
                basket={basketError ? undefined : basket}
                disabled={disabled}
                roles={roles}
                token={token}
              />
            </Panel>
          )}

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={24}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  {shouldShowNoStockCheckbox && (
                    <RoleEnforcer
                      roles={roles}
                      permittedRoles={[
                        "TSM_ADD_STOCK_TECH",
                        "TSM_ADD_STOCK_SUPER",
                      ]}
                      matchAll={false}
                      deniedRender={<div>Access Denied</div>}
                      deniedProps={{ disabled: true }}
                      deniedPropsPassingType="Shallow"
                      deniedShowPermittedRoles={true}
                    >
                      <NoStockCheckbox disabled={disabled} />
                    </RoleEnforcer>
                  )}
                </div>
                <div>
                  <SubmitButton
                    basket={basket}
                    disabled={loading}
                    auth={auth}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <StockForm
            stock={stock || []}
            disabled={disabled}
            roles={roles}
            isSuperUser={isSuperUser}
            ticket={ticket}
            ticketType={ticketType}
            ticketIdentifier={ticketIdentifier}
            externalLocationId={externalLocationId || defaultExternalLocationId}
            token={token}
            renderInput={renderInput}
          />
        </div>
      )}
    </Spin>
  );
};

export default Consumption;
