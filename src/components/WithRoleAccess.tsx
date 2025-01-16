import { Result, Space } from "antd";
import Keycloak from "keycloak-js";
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { getUserRoles } from "../utils/helpers";

interface WithRoleAccessProps {
  children: ReactNode;
  auth: Keycloak;
  requiredRoles: string[];
}

const WithRoleAccess: React.FC<WithRoleAccessProps> = ({
  children,
  requiredRoles,
  auth,
}) => {
  const roles = getUserRoles(auth);

  const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));

  if (!hasRequiredRole) {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Result
          status="403"
          title="Unauthorized Access"
          subTitle="You are not authorized to access this page."
          extra={
            <Link
              to="/"
              style={{
                color: "#f5a623",
                textDecoration: "none",
                fontWeight: "bold",
                padding: "8px 16px",
                border: "1px solid #f5a623",
                borderRadius: "4px",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5a623";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#f5a623";
              }}
            >
              Go to Home
            </Link>
          }
        />
      </Space>
    );
  }

  return <>{children}</>;
};

export default WithRoleAccess;
