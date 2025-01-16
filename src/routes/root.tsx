import { ComponentType, Suspense, lazy } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { MFENavItem, ModalOpenDetail, NavigationProps } from "uiMfe/Navigation";
import { useAuth, useRoles, useUserInfo } from "uiMfe/hooks";
import navItemsJson from "../../navItems.json";
import "../index.css";
import { BASE_URL } from "../utils/constants";

const Navigation = lazy<ComponentType<NavigationProps>>(
  () => import("uiMfe/Navigation")
);

const RootRoute = () => {
  const { keycloak } = useAuth();
  const userInfo = useUserInfo();
  const roles = useRoles("technician-stock-management-fe");
  const navItems: Omit<MFENavItem, "mfeName">[] = (
    navItemsJson as Omit<MFENavItem, "mfeName">[]
  ).map((item) => ({
    ...item,
    noRoleAction: item.noRoleAction ?? undefined,
  }));

  const [searchParams] = useSearchParams();
  const hideNavigation = searchParams.get("mode") === "embedded";

  return (
    <Suspense>
      <div className="min-h-full">
        <Navigation
          mfeConfigs={[]}
          staticNavItems={navItems}
          hidden={hideNavigation}
          menuItems={[
            {
              to: "#",
              label: "Your Profile",
              onClick: () => {
                const detail: ModalOpenDetail = { modalType: "UserProfile" };
                const event = new CustomEvent<ModalOpenDetail>("openModal", {
                  detail,
                });
                window.dispatchEvent(event);
              },
            },
            {
              to: "#",
              label: "Settings",
              onClick: () => console.log("Settings"),
            },
            {
              to: "#",
              label: "Sign out",
              onClick: () => {
                keycloak?.logout({ redirectUri: BASE_URL });
              },
            },
          ]}
          userProfile={{
            ...userInfo,
            roles: [{ appName: "TSM", roles }],
          }}
        />
        <div className="py-4 mx-auto max-w-full px-2">
          <Outlet />
        </div>
      </div>
    </Suspense>
  );
};

export default RootRoute;
