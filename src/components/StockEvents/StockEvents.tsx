import {
  Alert,
  Button,
  Col,
  DatePicker,
  Input,
  Result,
  Row,
  Space,
  Spin,
  Table,
} from "antd";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getInvoiceByDateRangeAndLocationId } from "../../queries/invoice";
import { getTickets } from "../../queries/ticket";
import { DEBUG_CIRCUIT_SCRN, IS_DEBUG } from "../../utils/constants";
import {
  getDateString,
  getUserIndexNumber,
  isStrEmptyOrBlank,
  userHasRole,
} from "../../utils/helpers";

import {
  TechnicianStockInfo,
  TechnicianStockItem,
  mapApiInvoice,
  updateTicketInfo,
} from "./DataHandler";

import dayjs from "dayjs";

import Keycloak from "keycloak-js";
import { useToken } from "../../hooks";
import Panel from "../Panel";

const dateFormat = "YYYY-MM-DD";

const __LOG =
  IS_DEBUG && DEBUG_CIRCUIT_SCRN ? console.log.bind(console) : function () {};
const _dTag = "SCRN_BALANCE_HISTORY::";

const MONTH_ENABLED_RANGE = 2;
const TICKET_IDENTIFIER_NITT = "NITT";

const { RangePicker } = DatePicker;
const { Search } = Input;

// +-------------------------------------------------------------------------------------
// | Local models
// +-------------------------------------------------------------------------------------
// defined in DataHandler.ts
// BFF models in \technician-stock-management-fe\src\types.d.ts

// +-------------------------------------------------------------------------------------
// | FUNCTIONAL component
// +-------------------------------------------------------------------------------------

const StockEvents: React.FC<{ auth: Keycloak }> = ({ auth }) => {
  const token = useToken(auth);
  // +-------------------------------------------------------------------------------------
  // | Initialize component state
  // +-------------------------------------------------------------------------------------

  // technician index
  const [stateSearchKey, setStateSearchKey] = useState<string>("");
  // invoice range
  const [stateStartDate, setStateStartDate] = useState<dayjs.Dayjs>(
    dayjs().subtract(1, "w").startOf("day")
  );
  const [stateEndDate, setStateEndDate] = useState<dayjs.Dayjs>(
    dayjs().endOf("day")
  );
  const [stateCanSearchStockEvents, setStateCanSearchStockEvents] =
    useState<boolean>(false);
  const [stateCanView, setStateCanView] = useState<boolean>(false);

  // +-------------------------------------------------------------------------------------
  // | Hooks
  // +-------------------------------------------------------------------------------------

  let { id: urlId } = useParams();
  const navigate = useNavigate();

  // +-------------------------------------------------------------------------------------
  // | Roles  permission
  // +-------------------------------------------------------------------------------------

  // NB: swap these to test technician role.
  const stockEventsRoleSuperUser = "TSM_SEARCH_STOCK_EVENTS_SUPER";
  const stockEventsRoleTechnician = "TSM_VIEW_STOCK_EVENTS";

  const hasSuperUserRole = userHasRole(auth, stockEventsRoleSuperUser);
  const hasTechnicianRole = userHasRole(auth, stockEventsRoleTechnician);
  const userIdx = getUserIndexNumber(auth);

  // +-------------------------------------------------------------------------------------
  // | API CALLs - fetch of data
  // +-------------------------------------------------------------------------------------

  //fetch invoices
  const {
    data: stock,
    isLoading: isStockLoading,
    isFetching: isStockFetching,
    error: stockError,
    isError: isStockError,
  } = getInvoiceByDateRangeAndLocationId(
    token,
    TICKET_IDENTIFIER_NITT,
    urlId,
    stateStartDate.toISOString(),
    stateEndDate.toISOString()
  );

  __LOG(
    `${_dTag}::BFF_CALL:getInvoiceByDateRangeAndLocationId-<stock, isStockLoading, isStockFetching, stockError, isStockError>`,
    stock,
    isStockLoading,
    isStockFetching,
    stockError,
    isStockError
  );

  const loading = isStockLoading || isStockFetching;

  //map invoices
  const mapData = mapApiInvoice(stock);

  const localTechnicianStockInfo: TechnicianStockInfo = {
    stockFetched: !loading,
    stock: mapData.displayInvoices,
  };

  // fetch corresponding access numbers
  const ticketQueriesResp = getTickets(
    token,
    TICKET_IDENTIFIER_NITT,
    Array.from(mapData.accessNumbers.keys())
  );

  if (!ticketQueriesResp.pending) {
    // update invoice data with corresponding access numbers
    updateTicketInfo(mapData, ticketQueriesResp.data);
  }

  const noErrorDetetected = (): boolean => {
    return !isStockError || stockError.message.includes("404");
  };

  // +-------------------------------------------------------------------------------------
  // | LifeCycle hooks
  // +-------------------------------------------------------------------------------------
  useEffect(() => {
    const canSearchStockEvents = hasSuperUserRole;
    let canView = canSearchStockEvents;

    if (!canView && hasTechnicianRole) {
      if (!isStrEmptyOrBlank(userIdx)) {
        if (isStrEmptyOrBlank(urlId)) {
          navigate(
            `/app/technicianstockmanagement/stock/stockevents/${userIdx}`
          );

          urlId = userIdx;
          canView = true;
        } else {
          canView = userIdx === urlId;
        }
      }
    }

    setStateCanSearchStockEvents(canSearchStockEvents);
    setStateCanView(canView);

    if (!isStrEmptyOrBlank(urlId)) {
      setStateSearchKey(urlId ?? "");
    }
  }, []);

  // +-------------------------------------------------------------------------------------
  // | callbacks
  // +-------------------------------------------------------------------------------------

  const onChangeTechIndexInput = (event: any): void => {
    let input = event.target;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    input.value = input.value.toLocaleUpperCase();
    input.setSelectionRange(start, end);
    const searchKey = input.value;

    if (/^[0-9]*$/.test(searchKey)) {
      setStateSearchKey(searchKey);
    }
  };

  const onInvoiceSearch = async (value: string, event: any): Promise<void> => {
    __LOG(`${_dTag}onInvoiceSearch: callback`, value, event);

    if (isStrEmptyOrBlank(value)) {
      navigate(`/app/technicianstockmanagement/stock/stockevents`);
      return;
    }

    // search through url
    navigate(`/app/technicianstockmanagement/stock/stockevents/${value}`);
  };

  const onChangeDate = (_: any, dateStrings: any): void => {
    setStateStartDate(dayjs(dateStrings[0]).startOf("date"));
    setStateEndDate(dayjs(dateStrings[1]).endOf("day"));
  };

  // +-------------------------------------------------------------------------------------
  // | File Export
  // +-------------------------------------------------------------------------------------

  const isStockPresent = (): boolean => {
    if (
      localTechnicianStockInfo.stockFetched &&
      localTechnicianStockInfo.stock &&
      localTechnicianStockInfo.stock.length > 0 &&
      !isStrEmptyOrBlank(urlId)
    )
      return true;

    return false;
  };

  const convertToCSV = (data: any[]) => {
    const header = [
      "Stock Name",
      "Issued Date",
      "Details",
      "Ticket No",
      "Access No",
    ].join(",");
    const rows = data.map((obj) =>
      [
        obj.stockName ?? "N/A",
        obj.date ?? "N/A",
        obj.quantity ?? "N/A",
        obj.ticketNo ?? "N/A",
        obj.accessNo ?? "N/A",
      ].join(",")
    );
    return [header, ...rows].join("\n");
  };

  const handleExport = async () => {
    try {
      const skipExport = !isStockPresent();

      if (skipExport) {
        return undefined;
      }

      const csvContent = convertToCSV(localTechnicianStockInfo.stock ?? []);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `invoice_history_${urlId}_${getDateString()}_${getDateString(
          stateStartDate.toISOString(),
          false
        )}_${getDateString(stateEndDate.toISOString(), false)}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      __LOG(`${_dTag}convertToCSV:export failed:`, error);
    }
  };

  // +-------------------------------------------------------------------------------------
  // | rendering methods
  // +-------------------------------------------------------------------------------------

  const renderAuthenticationError = (): JSX.Element | undefined => {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Result
          status="403"
          title="Sorry, you are not authorized to access this page."
          subTitle="Please contact your system administrator."
        />
      </Space>
    );
  };

  const renderValidationError = (): JSX.Element | undefined => {
    if (noErrorDetetected()) {
      return undefined;
    }

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert message={`${stockError}`} type="error" closable showIcon />
      </Space>
    );
  };

  const renderSearch = (): JSX.Element => {
    return (
      <>
        <Row gutter={[8, 8]} style={{ marginBottom: 20 }}>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 12 }}
            lg={{ span: 7 }}
            xl={{ span: 6 }}
            xxl={{ span: 4 }}
          >
            <RangePicker
              allowClear={false}
              defaultValue={[stateStartDate, stateEndDate]}
              format={dateFormat}
              showNow={true}
              onChange={onChangeDate}
              disabledDate={(current) => {
                const today = dayjs();
                return (
                  current.isAfter(today) ||
                  current.isBefore(today.subtract(MONTH_ENABLED_RANGE, "M"))
                );
              }}
            />
          </Col>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 9 }}
            lg={{ span: 14 }}
            xl={{ span: 16 }}
            xxl={{ span: 18 }}
          >
            <Search
              autoFocus
              placeholder={"input technician index"}
              value={stateSearchKey}
              onChange={onChangeTechIndexInput}
              onSearch={onInvoiceSearch}
              autoComplete="on"
              // disabled={!canSearchStockEvents}
              disabled={!stateCanSearchStockEvents}
            />
          </Col>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 3 }}
            lg={{ span: 3 }}
            xl={{ span: 2 }}
            xxl={{ span: 2 }}
          >
            <Button onClick={handleExport} disabled={!isStockPresent()}>
              Export
            </Button>
          </Col>
        </Row>
        <Row gutter={[10, 20]} style={{ marginTop: 10 }}>
          {renderValidationError()}
        </Row>
      </>
    );
  };

  const renderStockTable = (): JSX.Element | undefined => {
    if (!localTechnicianStockInfo.stockFetched || !noErrorDetetected())
      return undefined;

    const columns = [
      {
        title: "Stock Name",
        dataIndex: "stockname",
        key: "stockname",
      },
      {
        title: "Issued Date",
        dataIndex: "date",
        key: "date",
        render: (text: any): React.ReactNode => {
          const dateText = dayjs(text).format(dateFormat);
          return <>{dateText}</>;
        },
      },
      {
        title: "Details",
        dataIndex: "quantity",
        key: "quantity",
      },
      {
        title: "Ticket No",
        dataIndex: "ticketno",
        key: "ticketno",
      },
      {
        title: "Access No",
        dataIndex: "accessno",
        key: "accessno",
        render: (text: any, record: any): React.ReactNode => {
          if (record.ticketno == "N/A") return record.ticketno;
          const accessNumberRender =
            record.accessNumberPopulated === "true" ? (
              <>{text}</>
            ) : (
              <Spin size="small" />
            );

          return accessNumberRender;
        },
      },
    ];

    let data: any = [];

    if (
      localTechnicianStockInfo.stock &&
      localTechnicianStockInfo.stock.length > 0
    ) {
      data = localTechnicianStockInfo.stock.map(
        (item: TechnicianStockItem, index: any) => {
          return {
            key: `${index}`,
            stockname: `${
              isStrEmptyOrBlank(item.stockName) ? "N/A" : item.stockName
            }`,
            date: `${isStrEmptyOrBlank(item.date) ? "N/A" : item.date}`,
            quantity: `${item.quantity === undefined ? 0 : item.quantity}`,
            ticketno: `${
              isStrEmptyOrBlank(item.ticketNo) ? "N/A" : item.ticketNo
            }`,
            accessno: `${
              isStrEmptyOrBlank(item.accessNo) ? "N/A" : item.accessNo
            }`,
            accessNumberPopulated: `${item.accessNumberPopulated}`,
          };
        }
      );
    }

    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        scroll={{ x: true }}
        style={{ border: "1px solid #d9d9d9", marginBottom: "20px" }}
      />
    );
  };

  const renderTechnicianStockList = (): JSX.Element | undefined => {
    return (
      <Row gutter={16}>
        <Col xs={24} lg={24} style={{ marginBottom: 10 }}>
          {renderStockTable()}
        </Col>
      </Row>
    );
  };

  // +-------------------------------------------------------------------------------------
  // | RENDER
  // +-------------------------------------------------------------------------------------

  // const userAuthenticated = canSearchStockEvents || canView;
  const userAuthenticated = stateCanSearchStockEvents || stateCanView;

  return (
    <>
      {!userAuthenticated && renderAuthenticationError()}
      {userAuthenticated && (
        <Panel title="Stock Events" loading={loading}>
          <Row gutter={[10, 10]}>
            <Col span={24}>{renderSearch()}</Col>
            <Col span={24}>
              {localTechnicianStockInfo.stockFetched &&
                urlId &&
                renderTechnicianStockList()}
            </Col>
          </Row>
        </Panel>
      )}
    </>
  );
};

export default StockEvents;
