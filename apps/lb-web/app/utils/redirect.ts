import { PATTERN } from "~/constants/common";
import { ROUTE } from "~/constants/routes";

export const toSafeRedirectPath = (value: unknown, fallback: string = ROUTE.HOME) =>
  typeof value === "string" && PATTERN.SAME_SITE_PATH.test(value) ? value : fallback;
