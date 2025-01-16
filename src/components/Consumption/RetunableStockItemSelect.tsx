import { Select } from "antd";
import React, { useMemo } from "react";
import { useTsmStore } from "../../stores/tsmStore";

type RetunableStockItemSelectProps = {
  stock: Array<StockItem> | undefined;
  disabled: boolean;
  onChange: (value: string | undefined) => void;
};

const StockItemSelect: React.FC<RetunableStockItemSelectProps> = ({
  stock,
  disabled,
  onChange,
}) => {
  const consumption = useTsmStore((state) => state.consumption);

  const options = useMemo(
    () =>
      stock?.map((item) => {
        return {
          value: item.stockDescription,
          label: item.stockDescription,
          searchLabel: item.stockDescription,
        };
      }),
    [stock]
  );

  return (
    <Select
      size="middle"
      showSearch
      allowClear
      value={consumption.selectedStockItem?.stockDescription}
      disabled={disabled}
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
