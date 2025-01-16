import { Col, Input, Row, Select } from "antd";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

interface TicketSearchProps {
  onSearch: (ticketType: string, ticketIdentifier: string) => void;
}

const TicketSearch: React.FC<TicketSearchProps> = ({ onSearch }) => {
  let [, setSearchParams] = useSearchParams();
  const [ticketType, setTicketType] = useState("NITT");
  const [ticketIdentifier, setTicketIdentifier] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "");
    setTicketIdentifier(numericValue);
  };

  const handleSearch = () => {
    setSearchParams({ ticketType, ticketIdentifier });
    onSearch(ticketType, ticketIdentifier);
  };

  return (
    <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8} md={6} lg={4}>
        <Select
          value={ticketType}
          onChange={setTicketType}
          style={{ width: "100%" }}
        >
          <Select.Option value="NITT">NITT</Select.Option>
        </Select>
      </Col>
      <Col xs={24} sm={16} md={18} lg={20}>
        <Input.Search
          value={ticketIdentifier}
          onChange={handleChange}
          onSearch={handleSearch}
          placeholder="Ticket Identifier"
        />
      </Col>
    </Row>
  );
};

export default TicketSearch;
