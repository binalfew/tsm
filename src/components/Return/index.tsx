import { Button, Modal, Spin, Table, Tooltip } from "antd";
import { ColumnsType, TableProps } from "antd/es/table";
import Keycloak from "keycloak-js";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToken, useUserInfo } from "../../hooks";
import { useTransferOrder } from "../../mutations/return";
import { getReturnStockItems } from "../../queries/return";
import { useTsmStore } from "../../stores/tsmStore";
import { userHasRoles } from "../../utils/helpers";
import Panel from "../Panel";
import TechnicianSearch from "./TechnicianSearch";

type GroupedStockItem = {
  stockCode: string;
  stockDescription: string;
  totalQuantity: number;
  serialItems: StockItem[];
  nonSerialItems: StockItem[];
  uniqueKey: string;
};

const Return: React.FC<{ auth: Keycloak }> = ({ auth }) => {
  const [searchParams] = useSearchParams();
  const token = useToken(auth);
  const { employee_id: defaultExternalLocationId } = useUserInfo(auth);

  const { transfer, isBusy, setIsBusy, setTransferSearchParams } = useTsmStore(
    (state) => state
  );

  const externalLocationId = transfer.searchParams.locationCode;

  const isSuperUser = userHasRoles(auth, [
    "TSM_ADD_STOCK_SUPER",
    "TSM_DELETE_BASKET_ITEM_SUPER",
  ]);

  const shouldFetchStockItems = Boolean(externalLocationId || !isSuperUser);

  const [modal, contextHolder] = Modal.useModal();

  const {
    data: stock,
    isLoading: isStockLoading,
    isFetching: isStockFetching,
  } = getReturnStockItems(
    token,
    shouldFetchStockItems
      ? externalLocationId || defaultExternalLocationId + "RET"
      : ""
  );

  const loading = isStockLoading || isStockFetching || isBusy;

  const { mutate: transferOrder } = useTransferOrder(token);

  const columns: ColumnsType<GroupedStockItem> = [
    {
      title: "Stock Code",
      key: "stockCode",
      dataIndex: "stockCode",
    },
    {
      title: "Description",
      key: "stockDescription",
      dataIndex: "stockDescription",
    },
    {
      title: "Quantity",
      key: "quantity",
      dataIndex: "totalQuantity",
    },
  ];

  const handleSearch = (locationCode: string) => {
    setTransferSearchParams({ locationCode });
  };

  useEffect(() => {
    const locationCode = searchParams.get("locationCode");
    if (locationCode) {
      setTransferSearchParams({ locationCode: `${locationCode}RET` });
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      setTransferSearchParams({
        locationCode: "",
      });
    };
  }, []);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSerialKeys, setSelectedSerialKeys] = useState<React.Key[]>([]);

  const groupedStockItems = useMemo(() => {
    if (!stock) return [];

    const grouped = stock.reduce((acc, item) => {
      const key = item.stockCode;
      if (!acc[key]) {
        acc[key] = {
          stockCode: item.stockCode,
          stockDescription: item.stockDescription,
          totalQuantity: 0,
          serialItems: [],
          nonSerialItems: [],
          uniqueKey: key,
        };
      }

      acc[key].totalQuantity += item.availableQuantity;
      if (item.serialItem) {
        acc[key].serialItems.push(item);
      } else {
        acc[key].nonSerialItems.push(item);
      }

      return acc;
    }, {} as Record<string, GroupedStockItem>);

    return Object.values(grouped).sort((a, b) =>
      a.stockCode.localeCompare(b.stockCode)
    );
  }, [stock]);

  const getSerialKeys = (record: GroupedStockItem): string[] => {
    return record.serialItems.map(
      (item) => `${record.stockCode}-${item.serialNo}`
    );
  };

  const rowSelection: TableProps<GroupedStockItem>["rowSelection"] = {
    selectedRowKeys,
    onChange: (selectedKeys, selectedRows) => {
      setSelectedRowKeys(selectedKeys);

      // When a parent row is selected, select all its serial items
      const newSerialKeys = new Set(selectedSerialKeys);
      selectedRows.forEach((row) => {
        getSerialKeys(row).forEach((key) => newSerialKeys.add(key));
      });

      // When a parent row is deselected, remove all its serial items
      const deselectedRows = groupedStockItems.filter(
        (item) => !selectedKeys.includes(item.uniqueKey)
      );
      deselectedRows.forEach((row) => {
        getSerialKeys(row).forEach((key) => newSerialKeys.delete(key));
      });

      setSelectedSerialKeys(Array.from(newSerialKeys));
    },
    getCheckboxProps: (record) => ({
      name: record.stockCode,
    }),
  };

  const showError = (content: string) => {
    modal.error({ title: "Error", content });
  };

  // Add expandable configuration
  const expandableConfig = {
    expandedRowRender: (record: GroupedStockItem) => {
      if (record.serialItems.length === 0) return null;

      const serialRowSelection: TableProps<StockItem>["rowSelection"] = {
        selectedRowKeys: selectedSerialKeys,
        onChange: (selectedKeys) => {
          setSelectedSerialKeys(selectedKeys);

          const currentSerialKeys = getSerialKeys(record);
          const isAllSerialsSelected = currentSerialKeys.every((key) =>
            selectedKeys.includes(key)
          );

          if (
            isAllSerialsSelected &&
            !selectedRowKeys.includes(record.uniqueKey)
          ) {
            setSelectedRowKeys([...selectedRowKeys, record.uniqueKey]);
          } else if (
            !isAllSerialsSelected &&
            selectedRowKeys.includes(record.uniqueKey)
          ) {
            setSelectedRowKeys(
              selectedRowKeys.filter((key) => key !== record.uniqueKey)
            );
          }
        },
      };

      return (
        <div style={{ marginLeft: "-32px" }}>
          <Table
            rowSelection={serialRowSelection}
            columns={[
              {
                dataIndex: "serialNo",
                key: "serialNo",
                width: "100%",
              },
            ]}
            dataSource={record.serialItems}
            pagination={false}
            size="small"
            showHeader={false}
            rowKey={(record) => `${record.stockCode}-${record.serialNo}`}
            style={{ margin: 0 }}
          />
        </div>
      );
    },
    rowExpandable: (record: GroupedStockItem) => record.serialItems.length > 0,
    columnWidth: 50,
    fixed: true,
    expandIconColumnIndex: 4,
  };

  // Update the transfer order logic to handle both serial and non-serial items
  const getSelectedItems = () => {
    const items: StockItem[] = [];

    groupedStockItems.forEach((group) => {
      // Add non-serial items if parent is selected
      if (selectedRowKeys.includes(group.uniqueKey)) {
        items.push(...group.nonSerialItems);
      }

      // Add selected serial items
      group.serialItems.forEach((serialItem) => {
        if (
          selectedSerialKeys.includes(
            `${group.stockCode}-${serialItem.serialNo}`
          )
        ) {
          items.push(serialItem);
        }
      });
    });

    return items;
  };

  // Update the transfer button click handler
  const handleTransfer = () => {
    modal.confirm({
      title: "Are you sure you want to return these selected items?",
      onOk: () => {
        setIsBusy(true);
        const selectedItems = getSelectedItems();
        const transferOrderData = {
          locationCode: (
            externalLocationId || defaultExternalLocationId
          ).replace(/RET$/, ""),
          items: selectedItems.map((item) => ({
            serialised: item.serialItem,
            stockCode: item.stockCode,
            serialNo: item.serialItem ? item.serialNo : null,
            quantity: item.availableQuantity,
          })),
          comments: "Return to stores",
        };

        transferOrder(transferOrderData, {
          onSuccess: () => {
            setIsBusy(false);
            setSelectedRowKeys([]);
            setSelectedSerialKeys([]);
          },
          onError: (error) => {
            showError(`Failed to create transfer order: ${error.message}`);
            setIsBusy(false);
          },
        });
      },
    });
  };

  return (
    <Spin spinning={loading} size="small" tip="Loading...">
      <Panel title="Return to Stores">
        {contextHolder}

        {isSuperUser && (
          <TechnicianSearch disabled={loading} onSearch={handleSearch} />
        )}

        {groupedStockItems.length > 0 ? (
          <Table<GroupedStockItem>
            rowSelection={rowSelection}
            dataSource={groupedStockItems}
            columns={columns}
            expandable={expandableConfig}
            rowKey="uniqueKey"
            pagination={false}
            size="small"
            style={{
              border: "1px solid #d9d9d9",
              marginBottom: "20px",
              marginTop: "20px",
            }}
            scroll={{
              x: "max-content",
            }}
            sticky={true}
          />
        ) : (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            No stock items to display.
          </div>
        )}

        {selectedRowKeys.length > 0 || selectedSerialKeys.length > 0 ? (
          <Tooltip title="Return to stores">
            <Button type="primary" onClick={handleTransfer}>
              Return
            </Button>
          </Tooltip>
        ) : null}
      </Panel>
    </Spin>
  );
};

export default Return;
