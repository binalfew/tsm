import { Col, Input, Row } from "antd";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

type TechnicianSearchProps = {
  disabled: boolean;
  onSearch: (locationCode: string) => void;
};

const TechnicianSearch: React.FC<TechnicianSearchProps> = ({
  disabled,
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
    onSearch(`${searchValue}RET`);
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
    </Row>
  );
};

export default TechnicianSearch;
