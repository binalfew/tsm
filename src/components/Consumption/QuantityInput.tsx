import { Input, Tooltip } from "antd";
import React, { useState } from "react";
import { useTsmStore } from "../../stores/tsmStore";

type QuantityInputProps = {
  disabled: boolean;
};

const QuantityInput: React.FC<QuantityInputProps> = ({ disabled }) => {
  const consumption = useTsmStore((state) => state.consumption);
  const updateConsumption = useTsmStore((state) => state.updateConsumption);
  const [inputValue, setInputValue] = useState<string>(
    consumption.quantity?.toString() || ""
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    const regex = /^\d+$/; // Only allows non-empty strings of digits
    if (value === "") {
      updateConsumption({ quantity: undefined });
      setError(null);
    } else if (regex.test(value)) {
      const intValue = Number(value);
      const maxQuantity = consumption.selectedStockItem?.availableQuantity || 0;
      updateConsumption({ quantity: intValue });
      if (intValue >= 0 && intValue <= maxQuantity) {
        setError(null);
      } else {
        setError("Entered quantity is greater than available stock");
      }
    } else {
      setError("Invalid input");
    }
  };

  return (
    <Tooltip title={error} open={!!error} color="red">
      <Input
        type="text"
        value={inputValue}
        status={error ? "error" : ""}
        onChange={(e) => {
          const value = e.target.value;
          setInputValue(value);
          handleChange(value);
        }}
        onBeforeInput={(
          e: React.FormEvent<HTMLInputElement> & { data: string | null }
        ) => {
          if (!/^\d*$/.test(e.data || "")) {
            e.preventDefault();
          }
        }}
        placeholder="Quantity"
        disabled={disabled}
        inputMode="numeric" // Ensures numeric keyboard on mobile devices
        pattern="\d*" // Ensures only digits are allowed
      />
    </Tooltip>
  );
};

export default QuantityInput;
