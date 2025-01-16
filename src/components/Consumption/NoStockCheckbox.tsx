import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import React from "react";
import { useTsmStore } from "../../stores/tsmStore";

type NoStockCheckboxProps = {
  disabled: boolean;
};

const NoStockCheckbox: React.FC<NoStockCheckboxProps> = ({ disabled }) => {
  const consumption = useTsmStore((state) => state.consumption);
  const updateConsumption = useTsmStore((state) => state.updateConsumption);

  const handleNoStockUsedCheck = (e: CheckboxChangeEvent) => {
    updateConsumption({ noStockUsed: e.target.checked });
  };

  return (
    <Checkbox
      checked={consumption.noStockUsed}
      onChange={handleNoStockUsedCheck}
      disabled={disabled}
    >
      No Stock Consumed/Collected
    </Checkbox>
  );
};

export default NoStockCheckbox;
