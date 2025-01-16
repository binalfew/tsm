import { DeleteOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Modal, Table, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { RoleEnforcer } from "common-react-components";
import React from "react";
import { useDeleteItemFromBasket } from "../../mutations/basket";
import { useTsmStore } from "../../stores/tsmStore";

type BasketProps = {
  basket: Basket | undefined;
  disabled: boolean;
  roles: string[];
  token: string;
};

const Basket: React.FC<BasketProps> = ({ basket, disabled, roles, token }) => {
  const queryClient = useQueryClient();
  const { mutate: deleteBasketItem } = useDeleteItemFromBasket(token);
  const setIsBusy = useTsmStore((state) => state.setIsBusy);
  const consumption = useTsmStore((state) => state.consumption);
  const [modal, contextHolder] = Modal.useModal();

  const handleDeleteStockItem = (id: number) => {
    const stockItem = basket?.basketItems.find((item) => item.id === id);
    const itemDescription = stockItem?.serialNumber
      ? stockItem.serialNumber
      : stockItem?.stockDescription;
    modal.confirm({
      title: `Are you sure you want to delete this item? ${itemDescription}`,
      onOk: () => {
        setIsBusy(true);
        deleteBasketItem(id, {
          onSuccess: () => {
            queryClient.invalidateQueries();
            setIsBusy(false);

            const channel = new BroadcastChannel("basket_channel");
            channel.postMessage({
              type: "basket-updated",
              url: window.location.href,
            });
            channel.close();
          },
          onError: (error) => {
            console.error("Error deleting item:", error);
            setIsBusy(false);
          },
        });
      },
    });
  };

  const columns: ColumnsType<BasketItem> = [
    {
      title: "Equipment",
      key: "stockDescription",
      dataIndex: "stockDescription",
    },
    {
      title: "State",
      key: "actionType",
      render: (_, record) => record.actionType.description,
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) =>
        record.serialNumber ? record.serialNumber : record.quantityUsed,
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => {
        if (record.submittedDate) return null;
        return (
          <RoleEnforcer
            roles={roles}
            permittedRoles={[
              "TSM_DELETE_BASKET_ITEM_TECH",
              "TSM_DELETE_BASKET_ITEM_SUPER",
            ]}
            matchAll={false}
            deniedRender={<div>Access Denied</div>}
            deniedProps={{ disabled: true }}
            deniedPropsPassingType="Shallow"
            deniedShowPermittedRoles={true}
          >
            <Tooltip
              title={
                disabled
                  ? "Not assigned to you or was assigned in the past"
                  : "Delete"
              }
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteStockItem(record.id)}
                disabled={disabled}
              />
            </Tooltip>
          </RoleEnforcer>
        );
      },
    },
  ];

  // if (!basket || basket.basketItems.length === 0) return null;

  return (
    <>
      {contextHolder}
      {consumption.basketErrors.length > 0 && (
        <div className="mb-5">
          <Alert
            message="An error occurred while submitting the basket items. Please review
            the following errors and try again."
            type="error"
            showIcon
            style={{ marginBottom: "20px" }}
          />
          <Table
            dataSource={consumption.basketErrors}
            columns={[
              {
                title: "Equpment",
                render: (_, record) => {
                  const basketItem = basket?.basketItems.find(
                    (item) => item.id === Number(record.itemId)
                  );
                  return basketItem?.stockDescription ?? record.itemId;
                },
              },
              {
                title: "Error",
                dataIndex: "error",
              },
            ]}
            rowKey="id"
            size="small"
            pagination={false}
            className="border border-red-300 rounded"
            rowClassName="bg-red-50"
          />
        </div>
      )}

      <Table
        dataSource={basket?.basketItems.sort((a, b) => {
          return a.actionType.description.localeCompare(
            b.actionType.description
          );
        })}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ border: "1px solid #d9d9d9", marginBottom: "20px" }}
        scroll={{ x: true }}
        locale={{
          emptyText: "No items in basket",
        }}
      />
    </>
  );
};

export default Basket;
