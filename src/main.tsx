import { StyleProvider } from "@ant-design/cssinjs";
import { QueryClient } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { ComponentType, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { Navigate } from "react-router-dom";
import { MfeProviderProps } from "uiMfe/MfeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorPage from "./error-page";
import RootRoute from "./routes/root";
import StockRoute from "./routes/stock";
import {
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM,
  KEYCLOAK_URL,
} from "./utils/constants";

const MfeProvider = lazy<ComponentType<MfeProviderProps>>(
  () => import("uiMfe/MfeProvider")
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    },
  },
});

const routes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootRoute />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            path: "/app/technicianstockmanagement/stock/*",
            element: <StockRoute />,
          },
          {
            path: "*",
            element: <Navigate to="/" />,
          },
        ],
      },
    ],
  },
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Suspense>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ff6a13",
        },
        components: {
          Card: {
            headerBg: "#ff6a13",
          },
        },
      }}
    >
      <StyleProvider hashPriority="high">
        <MfeProvider
          routerConfig={{
            routes,
          }}
          keycloakConfig={{
            url: KEYCLOAK_URL,
            realm: KEYCLOAK_REALM,
            clientId: KEYCLOAK_CLIENT_ID,
          }}
          queryClient={queryClient}
          showDevTools={false}
          onAuthError={(error: any) => console.error(error)}
          onAuthSuccess={() => console.log("Authenticated!")}
          onTokenRefresh={() => console.log("Token refreshed!")}
          onTokenRefreshError={(error: any) => console.error(error)}
        />
      </StyleProvider>
    </ConfigProvider>
  </Suspense>
);
