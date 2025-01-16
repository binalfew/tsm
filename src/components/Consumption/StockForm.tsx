import { Alert, Button, Card, Modal, Radio, Space, Tooltip } from "antd";
import { RoleEnforcer } from "common-react-components";
import React from "react";
import { useAddItemToBasket } from "../../mutations/basket";
import { getReturnableStockItems } from "../../queries/stock";
import { useTsmStore } from "../../stores/tsmStore";
import RetunableStockItemSelect from "./RetunableStockItemSelect";
import StockItemSelect from "./StockItemSelect";
import TechnicianSelect from "./TechnicianSelect";

interface StockFormProps {
  stock: any[];
  disabled: boolean;
  roles: string[];
  isSuperUser: boolean;
  ticket: any;
  ticketType: string;
  ticketIdentifier: string;
  externalLocationId: string;
  token: string;
  renderInput: () => JSX.Element;
  onComplete?: () => void;
}

const StockForm: React.FC<StockFormProps> = ({
  stock,
  disabled,
  roles,
  isSuperUser,
  ticket,
  ticketType,
  ticketIdentifier,
  externalLocationId,
  token,
  renderInput,
  onComplete,
}) => {
  const [error, setError] = React.useState<string | null>(null);
  const { consumption, updateConsumption, clearBasketErrors } = useTsmStore(
    (state) => state
  );
  const { mutate: addItemToBasket } = useAddItemToBasket(token);
  const [modal, contextHolder] = Modal.useModal();
  const [isLoading, setIsLoading] = React.useState(false);

  const isValidQuantity = (quantity: number, availableQuantity: number) =>
    Number.isInteger(quantity) && quantity > 0 && quantity <= availableQuantity;

  const { data: returnableStock } = getReturnableStockItems(
    token,
    consumption.showReturnableStockItems
  );

  const showError = (content: string) => {
    modal.error({ title: "Error", content });
  };

  const handleAddToBasket = (newItem: AddBasketItemModel) => {
    clearBasketErrors();
    setError(null);
    setIsLoading(true);
    addItemToBasket(newItem, {
      onSuccess: () => {
        updateConsumption({
          selectedStockItem: undefined,
          quantity: 0,
          noStockUsed: false,
          itemSelected: false,
          serialNo: undefined,
          msisdn: undefined,
          type: "Issue",
          isValid: false,
          showReturnableStockItems: false,
        });
        setIsLoading(false);
        setError(null);
        onComplete?.();

        const channel = new BroadcastChannel("basket_channel");
        channel.postMessage({
          type: "basket-updated",
          url: window.location.href,
        });
        channel.close();
      },
      onError: (error) => {
        setIsLoading(false);

        const errorHandlers = {
          StockItemNotFoundException: () => {
            updateConsumption({ showReturnableStockItems: true });
          },
          UnsoldStockItemCollectionException: () => {
            setError(error.errorMessage);
          },
          InvalidBasketItemException: () => {
            setError(error.errorMessage);
          },
        };

        try {
          // Handle known error types
          const handler =
            errorHandlers[error.errorType as keyof typeof errorHandlers];
          if (handler) {
            handler();
          } else {
            // Handle unknown error types
            showError(
              `Failed to add item to basket: ${
                error.errorMessage || "Unknown error"
              }`
            );
          }
        } catch (e) {
          // Handle unexpected errors during error processing
          console.error("Error while processing error response:", e);
          showError(
            `Failed to add item to basket: ${
              error.errorMessage || "Unexpected error"
            }`
          );
        }
      },
    });
  };

  const handleIssueStockItem = () => {
    if (!consumption.selectedStockItem) {
      showError("No stock item selected");
      return;
    }

    const predicate = consumption.selectedStockItem.serialItem
      ? (item: StockItem) =>
          item.serialNo === consumption.selectedStockItem?.serialNo
      : (item: StockItem) =>
          item.stockDescription ===
          consumption.selectedStockItem?.stockDescription;

    const selectedStockItem = stock?.find(predicate);

    if (!selectedStockItem) {
      showError("No stock item found for the selected equipment");
      return;
    }

    const createBasketItem = (isSerialItem: boolean): AddBasketItemModel => ({
      ticketType,
      ticketIdentifier,
      serialized: isSerialItem,
      serialNumber: isSerialItem ? selectedStockItem.serialNo : "",
      msisdn: isSerialItem ? consumption.msisdn ?? "" : "",
      quantityUsed: isSerialItem ? 1 : consumption.quantity,
      stockCode: selectedStockItem.stockCode,
      stockDescription: selectedStockItem.stockDescription,
      externalLocationId: externalLocationId,
      actionType: "ISSUE",
    });

    const validateSerialItem = (): boolean => {
      const matchingStockItem = stock?.find(
        (item) =>
          item.stockDescription ===
            consumption.selectedStockItem?.stockDescription &&
          item.serialNo === consumption.serialNo
      );

      if (!matchingStockItem) {
        showError("No matching stock item found for the selected equipment");
        return false;
      }
      return true;
    };

    const validateNonSerialItem = (): boolean => {
      if (
        !isValidQuantity(
          consumption.quantity,
          selectedStockItem.availableQuantity
        )
      ) {
        showError(
          "Quantity must be an integer greater than 0 and not exceed available quantity"
        );
        return false;
      }
      return true;
    };

    const newItem = selectedStockItem.serialItem
      ? validateSerialItem() && createBasketItem(true)
      : validateNonSerialItem() && createBasketItem(false);

    if (newItem) {
      handleAddToBasket(newItem);
    }
  };

  const handleCollectStockItem = () => {
    if (consumption.type !== "Collect") {
      return;
    }

    const newItem: AddBasketItemModel = {
      ticketType,
      ticketIdentifier,
      serialized: true,
      serialNumber: consumption.serialNo ?? "",
      msisdn: consumption.msisdn ?? "",
      quantityUsed: 1,
      stockCode: consumption.selectedStockItem?.stockCode ?? "",
      stockDescription: consumption.selectedStockItem?.stockDescription ?? "",
      externalLocationId: externalLocationId,
      actionType: "COLLECT",
    };

    handleAddToBasket(newItem);
  };

  return (
    <Card
      style={{
        backgroundColor: "white",
        border: "1px solid #d9d9d9",
      }}
    >
      {contextHolder}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <div style={{ marginBottom: "20px" }}>
        <Radio.Group
          value={consumption.type}
          disabled={consumption.noStockUsed || disabled}
          onChange={(e) => {
            updateConsumption({
              type: e.target.value,
              selectedStockItem: undefined,
              quantity: 0,
              serialNo: undefined,
              msisdn: undefined,
              isValid: false,
              itemSelected: false,
            });
          }}
        >
          <Radio value="Issue">Issue</Radio>
          <Radio value="Collect">Collect</Radio>
        </Radio.Group>
      </div>

      {isSuperUser && (
        <TechnicianSelect
          technicians={ticket?.assignedTechnicians || []}
          disabled={disabled}
        />
      )}

      <div style={{ marginTop: "20px" }}>
        {consumption.type === "Issue" && (
          <div style={{ marginBottom: "20px" }}>
            <RoleEnforcer
              roles={roles}
              permittedRoles={["TSM_ADD_STOCK_TECH", "TSM_ADD_STOCK_SUPER"]}
              matchAll={false}
              deniedRender={<div>Access Denied</div>}
              deniedProps={{ disabled: true }}
              deniedPropsPassingType="Shallow"
              deniedShowPermittedRoles={true}
            >
              <Tooltip
                title={"You have not been assigned to handle this ticket"}
                trigger={disabled ? ["hover"] : []}
                color="red"
              >
                <span style={{ display: "inline-block", width: "100%" }}>
                  <StockItemSelect
                    stock={stock}
                    disabled={consumption.noStockUsed || disabled}
                    onChange={(value) => {
                      const stockItem = stock?.find(
                        (item) => item.stockDescription === value
                      );
                      updateConsumption({
                        selectedStockItem: stockItem,
                        itemSelected: !!value,
                        quantity: !stockItem?.serialItem ? 1 : undefined,
                      });
                    }}
                  />
                </span>
              </Tooltip>
            </RoleEnforcer>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <RoleEnforcer
            roles={roles}
            permittedRoles={["TSM_ADD_STOCK_TECH", "TSM_ADD_STOCK_SUPER"]}
            matchAll={false}
            deniedRender={<div>Access Denied</div>}
            deniedProps={{ disabled: true }}
            deniedPropsPassingType="Shallow"
            deniedShowPermittedRoles={true}
          >
            <Tooltip
              title={"You have not been assigned to handle this ticket"}
              trigger={disabled ? ["hover"] : []}
              color="red"
            >
              <span style={{ display: "inline-block", width: "100%" }}>
                {renderInput()}
              </span>
            </Tooltip>
          </RoleEnforcer>
        </div>

        <div style={{ marginBottom: "20px" }}>
          {consumption.showReturnableStockItems && (
            <>
              <Alert
                message="Could not find a stock item matching the serial number you entered."
                description="You may select a returnable stock item from the list below."
                type="warning"
                showIcon
                style={{
                  marginBottom: "15px",
                  border: "2px solid #faad14",
                  borderRadius: "8px",
                }}
              />
              <span
                style={{
                  display: "inline-block",
                  width: "100%",
                  marginTop: 10,
                }}
              >
                <RetunableStockItemSelect
                  stock={returnableStock}
                  disabled={disabled}
                  onChange={(value) => {
                    const stockItem = returnableStock
                      ?.map((item) => ({
                        ...item,
                        serialItem: true,
                      }))
                      .find((item) => item.stockDescription === value);

                    updateConsumption({
                      selectedStockItem: stockItem,
                      itemSelected: !!value,
                    });
                  }}
                />
              </span>
            </>
          )}
        </div>

        {consumption.isValid && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <RoleEnforcer
              roles={roles}
              permittedRoles={["TSM_ADD_STOCK_TECH", "TSM_ADD_STOCK_SUPER"]}
              matchAll={false}
              deniedRender={<div>Access Denied</div>}
              deniedProps={{ disabled: true }}
              deniedPropsPassingType="Shallow"
              deniedShowPermittedRoles={true}
            >
              <Space size="small">
                <Button
                  type="primary"
                  onClick={
                    consumption.type === "Issue"
                      ? handleIssueStockItem
                      : handleCollectStockItem
                  }
                  disabled={disabled}
                  loading={isLoading}
                >
                  Add to Basket
                </Button>
              </Space>
            </RoleEnforcer>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StockForm;
