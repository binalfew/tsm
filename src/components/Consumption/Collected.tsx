import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format, parseISO } from "date-fns";
import React from "react";
import { v4 as uuidv4 } from "uuid";

interface InvoiceProps {
  invoices: Invoice[];
  loading?: boolean;
}

const Collected: React.FC<InvoiceProps> = ({ invoices }) => {
  const columns: ColumnsType<
    InvoiceItem & { transactionId: string; createdDate: string }
  > = [
    {
      title: "Stock Name",
      dataIndex: "stockName",
      key: "stockName",
    },
    {
      title: "Technician",
      render: (item: InvoiceItem) => {
        const fromLocation = item.fromLocation;
        const locationItems = fromLocation.split(":");
        const technician =
          locationItems[locationItems.length - 1]?.trim() ?? "";
        return technician;
      },
    },
    {
      title: "Created Date",
      render: (
        item: InvoiceItem & { transactionId: string; createdDate: string }
      ) => format(parseISO(item.createdDate), "MM/dd/yyyy"),
    },
    {
      title: "Details",
      render: (item: InvoiceItem) =>
        item.serialNo ? item.serialNo : item.quantity,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={invoices.flatMap((invoice) => {
        return invoice.items.map((item) => ({
          ...item,
          fromLocation: invoice.toLocation,
          transactionId: invoice.transactionId,
          createdDate: invoice.createdDate,
          _id: uuidv4(),
        }));
      })}
      rowKey="_id"
      style={{ border: "1px solid #d9d9d9", marginBottom: "20px" }}
      size="small"
      pagination={false}
      scroll={{ x: true }}
    />
  );
};

export default Collected;
