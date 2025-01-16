import Keycloak from "keycloak-js";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ErrorState {
  message: string;
  code?: string;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError({ message: error.message });
    } else if (typeof error === "string") {
      setError({ message: error });
    } else {
      setError({ message: "An unknown error occurred" });
    }

    // You can add additional error handling logic here, such as logging to a service
    console.error("Global error:", error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export function useRoles(auth: Keycloak, appName?: string) {
  const token: RolesFromAccessToken | undefined = auth?.tokenParsed;

  const roles = useMemo(() => {
    if (appName) {
      // Return roles for the specific app
      return token?.resource_access?.[appName]?.roles || [];
    } else {
      // Return all combined roles
      const realmRoles = token?.realm_access?.roles || [];
      const resourceRoles = Object.values(token?.resource_access || {}).flatMap(
        (resource) => resource.roles
      );

      return Array.from(new Set([...realmRoles, ...resourceRoles]));
    }
  }, [token, appName]);

  return roles;
}

export function useHasRole(
  auth: Keycloak,
  requiredRoles: string[],
  appName?: string
) {
  const roles = useRoles(auth, appName);

  const hasRole = useMemo(
    () => requiredRoles.some((role) => roles.includes(role)),
    [requiredRoles, roles]
  );

  return hasRole;
}

export function useUserInfo(auth: Keycloak) {
  const token = auth.tokenParsed;

  const userInfo = useMemo(
    () => ({
      name: token?.name || "",
      email: token?.email || "",
      username: token?.preferred_username || "",
      employee_id: token?.employee_id || "",
    }),
    [token]
  );

  return userInfo;
}

export function useToken(auth: Keycloak) {
  const [token, setToken] = useState("");

  useEffect(() => {
    const updateToken = async () => {
      if (auth.isTokenExpired()) {
        try {
          await auth.updateToken(30); // Attempt to refresh the token
        } catch (error) {
          console.error("Error updating token:", error);
          // Handle token update failure, e.g., by logging out the user or showing an error message
        }
      }
      // Use the token if available, or fallback to an empty string
      setToken(auth.token || "");
    };

    updateToken();
  }, [auth]);

  return token;
}
