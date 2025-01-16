import { Select } from "antd";
import React, { useMemo } from "react";
import { useTsmStore } from "../../stores/tsmStore";

type StockItemSelectProps = {
  stock: Array<StockItem> | undefined;
  disabled: boolean;
  onChange: (value: string | undefined) => void;
};

const StockItemSelect: React.FC<StockItemSelectProps> = ({
  stock,
  disabled,
  onChange,
}) => {
  const consumption = useTsmStore((state) => state.consumption);

  const options = useMemo(
    () =>
      consumption.uniqueStockItems.map((description) => {
        const stockItem = stock?.find(
          (item) => item.stockDescription === description
        );
        return {
          value: description,
          label: (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{description}</span>
              {!stockItem?.serialItem && stockItem?.availableQuantity && (
                <span style={{ marginLeft: "auto" }}>
                  {stockItem.availableQuantity}
                </span>
              )}
            </div>
          ),
          searchLabel: description,
        };
      }),
    [consumption.uniqueStockItems, stock]
  );

  return (
    <Select
      size="middle"
      showSearch
      allowClear
      value={consumption.selectedStockItem?.stockDescription}
      disabled={consumption.noStockUsed || disabled}
      onChange={onChange}
      onClear={() => onChange(undefined)}
      options={options}
      placeholder="Select Equipment"
      style={{ width: "100%" }}
      optionFilterProp="searchLabel"
    />
  );
};

export default StockItemSelect;
