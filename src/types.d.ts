declare global {
  type ApiError = {
    errorType:
      | "StockItemNotFoundException"
      | "UnsoldStockItemCollectionException"
      | "InvalidBasketItemException"
      | "UnknownError";
    errorMessage: string;
  };

  interface StockItem {
    availableQuantity: number;
    basePrice: number | null;
    locationCode: string;
    locationDescription: string | null;
    serialItem: boolean;
    serialNo: string;
    sold: boolean;
    stockCode: string;
    stockDescription: string;
  }

  type TicketType = {
    id: number;
    description: string;
  };

  type ActionType = {
    id: number;
    description: string;
  };

  type BasketItem = {
    id: number;
    stockCode: string;
    stockDescription: string;
    serialised: boolean;
    serialNumber: string | null;
    msisdn: string | null;
    quantityUsed: number;
    externalLocationId: string;
    addedDate: string;
    addedBy: string;
    submittedDate: string | null;
    actionType: ActionType;
  };

  type Basket = {
    id: number;
    ticketType: TicketType;
    ticketIdentifier: string;
    createdDate: string;
    createdBy: string;
    basketItems: Array<BasketItem>;
  };

  type AddBasketItemModel = {
    ticketType: string;
    ticketIdentifier: string;
    stockCode: string;
    stockDescription: string;
    serialized: boolean;
    serialNumber: string | null;
    msisdn: string | null;
    quantityUsed: number;
    externalLocationId: string;
    actionType: "ISSUE" | "COLLECT";
  };

  type SubmitBasketModel = {
    id: number;
  };

  type TransferOrderModel = {
    locationCode: string;
    items: {
      stockCode: string;
      serialNo: string | null;
      quantity: number;
      serialised: boolean;
    }[];
    comments: string;
  };

  type Technician = {
    indexNumber: string;
    dateAssigned: string;
    jobMovementDescription: string;
    assignedToday: boolean;
  };

  type Ticket = {
    accessNumber: string;
    isClosed: boolean;
    assignedTechnicians: Technician[];
  };

  type TicketToAccess = {
    ticketNumber: string;
    ticketApiInfo: Ticket;
  };

  type TicketsCombined = {
    data: Array<TicketToAccess>;
    pending: boolean;
  };

  type ErrorResponse = {
    errorType: string | null;
    errorCode: string;
    errorMessage: string;
  };

  type ConsumptionState = {
    selectedStockItem: StockItem | undefined;
    selectedStockItemType: string | undefined;
    quantity: number | undefined;
    noStockUsed: boolean;
    itemSelected: boolean;
    serialNo: string | undefined;
    externalLocationId: string | undefined;
  };

  type Invoice = {
    transactionId: string;
    createdDate: string;
    lastModifiedDate: string;
    toLocation: string;
    comments: string;
    externalReference: string;
    items: Array<InvoiceItem>;
  };

  type InvoiceItem = {
    stockName: string;
    quantity: number;
    serialNo?: string;
    fromLocation: string;
  };

  type RolesFromAccessToken = {
    realm_access?: {
      roles?: string[];
    };
    resource_access?: Record<string, { roles: string[] }>;
  };
}

export {};

declare module "uiMfe/Navigation" {
  import { ComponentType } from "react";

  export type NavItem = {
    to: string;
    label: string;
    component?: React.ComponentType<any>;
    children?: NavItem[];
  };

  export type MenuItem = {
    to: string;
    label: string;
    onClick: () => void;
  };

  export type MFEConfig = {
    name: string;
    loadNavItems: () => Promise<Omit<MFENavItem, "mfeName">[]>;
  };

  export type MFENavItem = {
    mfeName: string;
    to: string;
    label: string;
    children?: Omit<MFENavItem, "mfeName">[];
    roles?: string[];
    noRoleAction?: "hide" | "disable";
  };

  export type UserRole = {
    appName: string;
    roles: string[];
  };

  export type UserProfile = {
    name: string;
    email: string;
    username: string;
    employee_id: string;
    roles: UserRole[];
  };

  export type NavigationProps = {
    mfeConfigs?: MFEConfig[];
    staticNavItems: Omit<MFENavItem, "mfeName">[];
    menuItems: MenuItem[];
    logo?: React.ReactNode;
    userProfile: UserProfile;
    hidden?: boolean;
  };

  export type ModalOpenDetail = {
    modalType: "UserProfile";
  };
  export type ModalOpenEvent = CustomEvent<ModalOpenDetail>;

  const Navigation: ComponentType<NavigationProps>;
  export default Navigation;
}

declare module "uiMfe/Sidebar" {
  import { ComponentType } from "react";

  export type SidebarItem = {
    name: string;
    href: string;
    icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  };

  export type SidebarProps = {
    items: SidebarItem[];
    hidden?: boolean;
  };

  const Sidebar: ComponentType<SidebarProps>;
  export default Sidebar;
}

declare module "uiMfe/MfeProvider" {
  import { QueryClient } from "@tanstack/react-query";
  import Keycloak from "keycloak-js";
  import { ComponentType, Context } from "react";
  import { RouteObject } from "react-router-dom";

  export interface RouterConfig {
    routes: RouteObject[];
  }

  export type KeycloakConfig = {
    url: string;
    realm: string;
    clientId: string;
  };

  export interface MfeProviderProps {
    routerConfig: RouterConfig;
    keycloakConfig: KeycloakConfig;
    queryClient: QueryClient;
    showDevTools?: boolean;
    onAuthError?: (error: string) => void;
    onAuthSuccess?: () => void;
    onTokenRefresh?: () => void;
    onTokenRefreshError?: (error: string) => void;
  }

  export interface AuthContextProps {
    keycloak?: Keycloak;
    initialized: boolean;
    authenticated: boolean;
    error?: string;
    roles?: string[];
    groups?: string[];
  }

  export const AuthContext: Context<AuthContextProps>;

  const MfeProvider: ComponentType<MfeProviderProps>;
  export default MfeProvider;
}

declare module "uiMfe/hooks" {
  import Keycloak from "keycloak-js";
  import { MenuItem, NavItem } from "uiMfe/Navigation";

  export interface AuthContextProps {
    keycloak?: Keycloak;
    initialized: boolean;
    authenticated: boolean;
    error?: string;
    roles?: string[];
    groups?: string[];
  }

  interface UserInfo {
    name: string;
    email: string;
    username: string;
    employee_id: string;
  }

  interface UseNavItemsParams {
    baseUrl: string;
    navItems: NavItem[];
    menuItems: MenuItem[];
  }

  type NavItems = {
    navItems: NavItem[];
    menuItems: MenuItem[];
    userInfo: UserInfo;
  };

  const useAuth: () => AuthContextProps;
  const useNavigationLink: () => (path: string) => string;
  const useRoles: (appName?: string) => string[];
  const useHasRole: (requiredRoles: string[], appName?: string) => boolean;
  const useLogout: (url: string) => () => void;
  const useUserInfo: () => UserInfo;
  const useNavItems: (params: UseNavItemsParams) => NavItems;
  const useToken: () => string;

  export {
    NavItems,
    useAuth,
    useHasRole,
    useLogout,
    useNavItems,
    useNavigationLink,
    useRoles,
    useToken,
    useUserInfo,
  };
}
