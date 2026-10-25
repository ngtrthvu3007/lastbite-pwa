import { SAME_SITE_PATH_PATTERN } from "~/constants/auth";
import { ROUTE } from "~/constants/routes";

export const toSafeRedirectPath = (value: unknown, fallback: string = ROUTE.HOME) =>
  typeof value === "string" && SAME_SITE_PATH_PATTERN.test(value) ? value : fallback;
