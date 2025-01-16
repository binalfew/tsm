import { Button, Col, Input, Row } from "antd";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

type TechnicianSearchProps = {
  disabled: boolean;
  onExport: () => void;
  onSearch: (locationCode: string) => void;
};

const TechnicianSearch: React.FC<TechnicianSearchProps> = ({
  disabled,
  onExport,
  onSearch,
}) => {
  const [params, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    params.get("locationCode") || ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "");
    setSearchValue(numericValue);
  };

  const handleSearch = () => {
    setSearchParams((params) => {
      params.set("locationCode", searchValue);
      return params;
    });
    onSearch(searchValue);
  };

  return (
    <Row>
      <Col flex={1}>
        <Input.Search
          value={searchValue}
          onChange={handleChange}
          onSearch={handleSearch}
          placeholder="Technician Number"
          disabled={disabled}
        />
      </Col>
      <Col style={{ marginLeft: 10 }}>
        <Button onClick={onExport} disabled={disabled}>
          Export
        </Button>
      </Col>
    </Row>
  );
};

export default TechnicianSearch;
