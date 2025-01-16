import Keycloak from "keycloak-js";
import { useHasRole, useRoles, useUserInfo } from "../hooks";

export const appName = "technician-stock-management-fe";

export type StringWithAutocomplete<T extends string> = (string & {}) | T;

type TSMRole =
  | "TSM_ADD_STOCK_SUPER"
  | "TSM_DELETE_BASKET_ITEM_SUPER"
  | "TSM_ADD_STOCK_TECH"
  | "TSM_DELETE_BASKET_ITEM_TECH"
  | "TSM_SEARCH_STOCK_EVENTS_SUPER"
  | "TSM_VIEW_STOCK_EVENTS";

export function userHasRole(auth: Keycloak, role: TSMRole): boolean {
  return useHasRole(auth, [role], appName);
}

export function userHasRoles(auth: Keycloak, roles: TSMRole[]): boolean {
  return useHasRole(auth, roles, appName);
}

export function getUserRoles(auth: Keycloak) {
  const roles = useRoles(auth, appName);
  return roles;
}

export function getUserIndexNumber(auth: Keycloak) {
  const { employee_id } = useUserInfo(auth);

  return employee_id;
}

export const getDateString = (
  dateInput: string | undefined = undefined,
  timeIncluded: boolean = true
): string => {
  // ISO 8601 format (2013-04-01T13:01:02)
  let date = dateInput ? new Date(dateInput) : new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  let timeStr = "";
  if (timeIncluded) {
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    const seconds = `${date.getSeconds()}`.padStart(2, "0");

    timeStr = `T${hours}${minutes}${seconds}`;
  }

  return `${year}${month}${day}${timeStr}`;
};

export const isStrEmptyOrBlank = (str?: string): boolean => {
  return !str || str.length === 0 || !str.trim();
};

export const isMobileDevice = (): boolean => {
  // ref: https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3
  //      http://net-informations.com/js/progs/mobile.htm

  let isMobileDevice = window.matchMedia(
    "only screen and (max-width: 760px)"
  ).matches;
  if (isMobileDevice) {
    // The viewport is less than 768 pixels wide
    return true;
  } else {
    // The viewport is greater than 700 pixels wide
    // This is not a mobile device
    return false;
  }
};

export async function catchError<T, E extends Error = Error>(
  promise: Promise<T>,
  errorsToCatch?: (new (...args: any[]) => E)[]
): Promise<[E | null, T | null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (error: unknown) {
    if (!(error instanceof Error)) {
      return [new Error("Unknown error occurred") as E, null];
    }

    if (!errorsToCatch || errorsToCatch.length === 0) {
      return [error as E, null];
    }

    if (errorsToCatch.some((ErrorClass) => error instanceof ErrorClass)) {
      return [error as E, null];
    }

    throw error;
  }
}
