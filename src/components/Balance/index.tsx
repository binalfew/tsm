import { Spin, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import Keycloak from "keycloak-js";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useHasRole, useToken, useUserInfo } from "../../hooks";
import { getStockItems } from "../../queries/stock";
import { useTsmStore } from "../../stores/tsmStore";
import Panel from "../Panel";
import TechnicianSearch from "./TechnicianSearch";

const Balance: React.FC<{ auth: Keycloak }> = ({ auth }) => {
  const [searchParams] = useSearchParams();
  const token = useToken(auth);
  const { employee_id: defaultExternalLocationId } = useUserInfo(auth);

  const { balance, isBusy, setBalanceSearchParams } = useTsmStore(
    (state) => state
  );

  const externalLocationId = balance.searchParams.locationCode;

  const isSuperUser = useHasRole(
    auth,
    ["TSM_DELETE_BASKET_ITEM_SUPER"],
    "technician-stock-management-fe"
  );

  const shouldFetchStockItems = Boolean(externalLocationId || !isSuperUser);

  const {
    data: stock,
    isLoading: isStockLoading,
    isFetching: isStockFetching,
  } = getStockItems(
    token,
    shouldFetchStockItems ? externalLocationId || defaultExternalLocationId : ""
  );

  const loading = isStockLoading || isStockFetching || isBusy;

  const columns: ColumnsType<StockItem> = [
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
      title: "Total Quantity",
      key: "availableQuantity",
      dataIndex: "availableQuantity",
    },
  ];

  const handleExport = async () => {
    try {
      if (!stock || stock.length === 0) {
        return;
      }

      const csvContent = convertToCSV(stock);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `stock_balance_${balance.searchParams.locationCode}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleSearch = (locationCode: string) => {
    setBalanceSearchParams({ locationCode });
  };

  const convertToCSV = (data: any[]) => {
    const header = [
      "Stock Code",
      "Description",
      "Total Quantity",
      "Serial Number",
    ].join(",");
    const rows = data.map((obj) =>
      [
        obj.stockCode,
        obj.stockDescription,
        obj.availableQuantity,
        obj.serialItem ? obj.serialNo : "N/A",
      ].join(",")
    );
    return [header, ...rows].join("\n");
  };

  const aggregateStockItems = (stockItems: StockItem[]): StockItem[] => {
    const aggregatedStock = stockItems.reduce((acc, item) => {
      if (!acc[item.stockCode]) {
        acc[item.stockCode] = { ...item, availableQuantity: 0 };
      }
      acc[item.stockCode].availableQuantity += item.availableQuantity;
      return acc;
    }, {} as Record<string, StockItem>);

    return Object.values(aggregatedStock);
  };

  useEffect(() => {
    const locationCode = searchParams.get("locationCode");
    if (locationCode) {
      setBalanceSearchParams({ locationCode });
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      setBalanceSearchParams({
        locationCode: "",
      });
    };
  }, []);

  return (
    <Spin spinning={loading} size="small" tip="Loading...">
      <Panel title="Stock Balance">
        {isSuperUser && (
          <TechnicianSearch
            disabled={loading}
            onExport={handleExport}
            onSearch={handleSearch}
          />
        )}

        {stock && stock.length > 0 ? (
          <Table
            dataSource={aggregateStockItems(stock)
              .map((item) => ({
                ...item,
                id: uuidv4(),
              }))
              .sort((a, b) => {
                return a.stockCode.localeCompare(b.stockCode);
              })}
            columns={columns}
            rowKey="id"
            size="small"
            style={{
              border: "1px solid #d9d9d9",
              marginBottom: "20px",
              marginTop: "20px",
            }}
            scroll={{
              x: "max-content",
            }}
          />
        ) : (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            No stock items to display.
          </div>
        )}
      </Panel>
    </Spin>
  );
};

export default Balance;
