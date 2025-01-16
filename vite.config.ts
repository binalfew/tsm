import federation from "@originjs/vite-plugin-federation";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default ({ mode }: any) => {
  const env = loadEnv(mode, process.cwd(), "");
  const VITE_REMOTE_UI_MFE_URL =
    env.VITE_REMOTE_UI_MFE_URL || "__VITE_REMOTE_UI_MFE_URL__";

  return defineConfig({
    server: {
      port: 5103,
    },
    plugins: [
      react(),
      federation({
        name: "technicianStockManagementMfe",
        remotes: {
          uiMfe: VITE_REMOTE_UI_MFE_URL,
        },
        exposes: {
          "./Tsm": "./src/components/Tsm",
          "./navItems": "./navItems.json",
        },
        shared: [
          "react",
          "react-dom",
          "react-router-dom",
          "@tanstack/react-query",
          "keycloak-js",
          "antd",
          "zustand",
          "@heroicons/react",
          "dayjs",
        ],
      }),
    ],
    base: "./",
    resolve: {
      alias: {
        "@assets": "/src/assets",
      },
    },
    build: {
      modulePreload: false,
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
    },
  });
};
