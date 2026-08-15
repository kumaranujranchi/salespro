/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity_logs from "../activity_logs.js";
import type * as ai from "../ai.js";
import type * as announcements from "../announcements.js";
import type * as departments from "../departments.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as followups from "../followups.js";
import type * as incentives from "../incentives.js";
import type * as init from "../init.js";
import type * as leads from "../leads.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as projects from "../projects.js";
import type * as referrals from "../referrals.js";
import type * as roles from "../roles.js";
import type * as sales from "../sales.js";
import type * as site_visits from "../site_visits.js";
import type * as subscriptions from "../subscriptions.js";
import type * as support from "../support.js";
import type * as targets from "../targets.js";
import type * as tenants from "../tenants.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity_logs: typeof activity_logs;
  ai: typeof ai;
  announcements: typeof announcements;
  departments: typeof departments;
  emails: typeof emails;
  files: typeof files;
  followups: typeof followups;
  incentives: typeof incentives;
  init: typeof init;
  leads: typeof leads;
  notifications: typeof notifications;
  payments: typeof payments;
  profiles: typeof profiles;
  projects: typeof projects;
  referrals: typeof referrals;
  roles: typeof roles;
  sales: typeof sales;
  site_visits: typeof site_visits;
  subscriptions: typeof subscriptions;
  support: typeof support;
  targets: typeof targets;
  tenants: typeof tenants;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
