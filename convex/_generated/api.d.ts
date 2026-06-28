/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as battles from "../battles.js";
import type * as categories from "../categories.js";
import type * as email from "../email.js";
import type * as judge from "../judge.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_elo from "../lib/elo.js";
import type * as lib_enrich from "../lib/enrich.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_ranking from "../lib/ranking.js";
import type * as lib_stats from "../lib/stats.js";
import type * as ping from "../ping.js";
import type * as races from "../races.js";
import type * as rankings from "../rankings.js";
import type * as recommend from "../recommend.js";
import type * as research from "../research.js";
import type * as seed from "../seed.js";
import type * as submissions from "../submissions.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  battles: typeof battles;
  categories: typeof categories;
  email: typeof email;
  judge: typeof judge;
  leaderboard: typeof leaderboard;
  "lib/elo": typeof lib_elo;
  "lib/enrich": typeof lib_enrich;
  "lib/openai": typeof lib_openai;
  "lib/ranking": typeof lib_ranking;
  "lib/stats": typeof lib_stats;
  ping: typeof ping;
  races: typeof races;
  rankings: typeof rankings;
  recommend: typeof recommend;
  research: typeof research;
  seed: typeof seed;
  submissions: typeof submissions;
  tools: typeof tools;
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
