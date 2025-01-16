export const DEBUG = import.meta.env.VITE_DEBUG || false;
export const BASE_URL = import.meta.env.VITE_BASE_URL || "__VITE_BASE_URL__";
export const KEYCLOAK_URL =
  import.meta.env.VITE_KEYCLOAK_URL || "__VITE_KEYCLOAK_URL__";
export const KEYCLOAK_REALM =
  import.meta.env.VITE_KEYCLOAK_REALM || "__VITE_KEYCLOAK_REALM__";
export const KEYCLOAK_CLIENT_ID =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "__VITE_KEYCLOAK_CLIENT_ID__";
export const REMOTE_UI_MFE_URL =
  import.meta.env.VITE_REMOTE_UI_MFE_URL || "__VITE_REMOTE_UI_MFE_URL__";
export const BFF_BASE_URL =
  import.meta.env.VITE_BFF_BASE_URL || "__VITE_BFF_BASE_URL__";
export const BFF_BASE_PATH =
  import.meta.env.VITE_BFF_BASE_PATH || "__VITE_BFF_BASE_PATH__";
export const BASKET_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/basket`;
export const ITEM_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/item`;
export const TICKET_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/ticket`;
export const TICKETS_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/tickets`;
export const INVOICE_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/invoice`;
export const CREDITMEMO_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/creditmemo`;
export const STOCK_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/stock`;
export const RETURNABLE_STOCK_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/returnable-stock`;
export const TRANSFER_ORDER_URL = `${BFF_BASE_URL}${BFF_BASE_PATH}/transferorder`;

// logging constants
export const IS_DEBUG = false;
export const DEBUG_CIRCUIT_SCRN = false;
