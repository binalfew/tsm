import { Input } from "antd";
import React from "react";
import { useTsmStore } from "../../stores/tsmStore";

type SerialNoInputProps = {
  disabled: boolean;
};

const SerialNoInput: React.FC<SerialNoInputProps> = ({ disabled }) => {
  const consumption = useTsmStore((state) => state.consumption);
  const updateConsumption = useTsmStore((state) => state.updateConsumption);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, ""); // Remove non-numeric characters

    updateConsumption({ serialNo: numericValue });
  };

  return (
    <Input
      type="text"
      value={consumption.serialNo !== undefined ? consumption.serialNo : ""}
      onChange={handleChange}
      placeholder="Serial Number"
      disabled={disabled}
    />
  );
};

export default SerialNoInput;
