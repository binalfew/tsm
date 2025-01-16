import { Select } from "antd";
import React, { useEffect } from "react";
import { useTsmStore } from "../../stores/tsmStore";

type TechnicianSelectProps = {
  technicians: Array<Technician>;
  disabled?: boolean;
};

const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  technicians,
  disabled,
}) => {
  const { consumption, updateConsumption } = useTsmStore((state) => ({
    consumption: state.consumption,
    updateConsumption: state.updateConsumption,
  }));

  useEffect(() => {
    if (technicians.length > 0) {
      updateConsumption({
        externalLocationId: technicians[0].indexNumber,
        selectedStockItem: undefined,
        serialNo: undefined,
      });
    }
  }, [technicians, updateConsumption]);

  const handleTechnicianChange = (value: string | undefined) => {
    updateConsumption({
      externalLocationId: value,
      selectedStockItem: undefined,
      serialNo: undefined,
    });
  };

  return (
    <Select
      size="middle"
      showSearch
      allowClear
      value={consumption.externalLocationId}
      options={technicians.map((technician) => ({
        value: technician.indexNumber,
        label: technician.jobMovementDescription,
      }))}
      onChange={handleTechnicianChange}
      placeholder="Select Technician"
      style={{ width: "100%" }}
      optionFilterProp="label"
      disabled={disabled || consumption.noStockUsed}
    />
  );
};

export default TechnicianSelect;
