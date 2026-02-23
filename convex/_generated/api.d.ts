/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as courses from "../courses.js";
import type * as events from "../events.js";
import type * as helpers from "../helpers.js";
import type * as history from "../history.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as players from "../players.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushNotificationsHelpers from "../pushNotificationsHelpers.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rounds from "../rounds.js";
import type * as scores from "../scores.js";
import type * as seasons from "../seasons.js";
import type * as seed from "../seed.js";
import type * as standings from "../standings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  courses: typeof courses;
  events: typeof events;
  helpers: typeof helpers;
  history: typeof history;
  http: typeof http;
  notifications: typeof notifications;
  players: typeof players;
  pushNotifications: typeof pushNotifications;
  pushNotificationsHelpers: typeof pushNotificationsHelpers;
  pushSubscriptions: typeof pushSubscriptions;
  rounds: typeof rounds;
  scores: typeof scores;
  seasons: typeof seasons;
  seed: typeof seed;
  standings: typeof standings;
  users: typeof users;
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
