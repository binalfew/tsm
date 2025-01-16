import { Input } from "antd";
import React from "react";
import { useTsmStore } from "../../stores/tsmStore";

type MsisdnInputProps = {
  disabled: boolean;
};

const MsisdnInput: React.FC<MsisdnInputProps> = ({ disabled }) => {
  const consumption = useTsmStore((state) => state.consumption);
  const updateConsumption = useTsmStore((state) => state.updateConsumption);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, ""); // Remove non-numeric characters

    updateConsumption({ msisdn: numericValue });
  };

  return (
    <Input
      type="text"
      value={consumption.msisdn !== undefined ? consumption.msisdn : ""}
      minLength={8}
      maxLength={10}
      showCount
      onChange={handleChange}
      placeholder="8-10 digits MSISDN"
      disabled={disabled}
    />
  );
};

export default MsisdnInput;
