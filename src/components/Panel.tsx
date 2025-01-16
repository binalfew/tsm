import { Layout } from "antd";
import React from "react";

const { Header, Content } = Layout;

interface PanelProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}

const Panel: React.FC<PanelProps> = ({ title, children }) => (
  <Layout
    style={{
      backgroundColor: "white",
      width: "100%",
      margin: "0 auto",
      position: "relative",
    }}
  >
    {/* {loading && <Overlay />} */}
    <Header
      style={{
        backgroundColor: "#FF6A11",
        color: "white",
        height: "40px",
        lineHeight: "40px",
        padding: "0 20px",
        borderRadius: "10px 10px 0 0",
        fontSize: "16px",
      }}
    >
      {title}
    </Header>
    <Content
      style={{
        padding: "20px",
        backgroundColor: "white",
        border: "1px solid #d9d9d9",
      }}
    >
      {children}
    </Content>
  </Layout>
);

export default Panel;
