import {
  CalendarDateRangeIcon,
  HomeIcon,
  Square3Stack3DIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

import { Grid } from "antd";
import Keycloak from "keycloak-js";
import React, { ComponentType, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SidebarProps } from "uiMfe/Sidebar";
import Balance from "./Balance";
import Consumption from "./Consumption";
import Return from "./Return";
import { StockEvents } from "./StockEvents";
import WithRoleAccess from "./WithRoleAccess";

const { useBreakpoint } = Grid;

const Sidebar = lazy<ComponentType<SidebarProps>>(
  () => import("uiMfe/Sidebar")
);

const navigation = [
  {
    name: "Stock Updates",
    href: "/app/technicianstockmanagement/stock/consumption",
    icon: Square3Stack3DIcon,
  },
  {
    name: "Balance",
    href: "/app/technicianstockmanagement/stock/balance",
    icon: TruckIcon,
  },
  {
    name: "Stock Events",
    href: "/app/technicianstockmanagement/stock/stockevents",
    icon: CalendarDateRangeIcon,
  },
  {
    name: "Return to Stores",
    href: "/app/technicianstockmanagement/stock/return",
    icon: HomeIcon,
  },
];

const Tsm: React.FC<{
  auth: Keycloak;
  hideSidebar?: boolean;
}> = ({ auth, hideSidebar = false }) => {
  const screens = useBreakpoint();

  const gridColumns = hideSidebar
    ? "grid-cols-1"
    : "md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]";

  return (
    <WithRoleAccess requiredRoles={["TSM_VIEW"]} auth={auth}>
      <div className={`w-full grid gap-4 ${gridColumns}`}>
        {!hideSidebar && screens.md && <Sidebar items={navigation} />}

        <div className="col-span-1">
          <Routes>
            <Route
              index
              element={
                <Navigate
                  to="/app/technicianstockmanagement/stock/consumption"
                  replace
                />
              }
            />
            <Route path="consumption" element={<Consumption auth={auth} />} />
            <Route path="balance" element={<Balance auth={auth} />} />
            <Route
              path="stockevents/:id?"
              element={<StockEvents auth={auth} />}
            />
            <Route path="return" element={<Return auth={auth} />} />
          </Routes>
          <Outlet />
        </div>
      </div>
    </WithRoleAccess>
  );
};

export default Tsm;
