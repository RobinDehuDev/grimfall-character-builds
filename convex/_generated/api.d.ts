/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abilities from "../abilities.js";
import type * as bugReports from "../bugReports.js";
import type * as buildItems from "../buildItems.js";
import type * as builds from "../builds.js";
import type * as capstones from "../capstones.js";
import type * as lib_abilityFields from "../lib/abilityFields.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_itemSearch from "../lib/itemSearch.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_slots from "../lib/slots.js";
import type * as lib_tags from "../lib/tags.js";
import type * as lib_talentGridType from "../lib/talentGridType.js";
import type * as lib_wotlkClass from "../lib/wotlkClass.js";
import type * as lib_wotlkClasses from "../lib/wotlkClasses.js";
import type * as runicEnhancements from "../runicEnhancements.js";
import type * as seed_legendaryRes from "../seed/legendaryRes.js";
import type * as seed_migrateRemoveClasses from "../seed/migrateRemoveClasses.js";
import type * as seed_migrateTalentAbilities from "../seed/migrateTalentAbilities.js";
import type * as seed_reseedAll from "../seed/reseedAll.js";
import type * as seed_tableCounts from "../seed/tableCounts.js";
import type * as seed_wotlkAbilities from "../seed/wotlkAbilities.js";
import type * as seed_wotlkTalents from "../seed/wotlkTalents.js";
import type * as slotPicker from "../slotPicker.js";
import type * as talents from "../talents.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abilities: typeof abilities;
  bugReports: typeof bugReports;
  buildItems: typeof buildItems;
  builds: typeof builds;
  capstones: typeof capstones;
  "lib/abilityFields": typeof lib_abilityFields;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/itemSearch": typeof lib_itemSearch;
  "lib/roles": typeof lib_roles;
  "lib/slots": typeof lib_slots;
  "lib/tags": typeof lib_tags;
  "lib/talentGridType": typeof lib_talentGridType;
  "lib/wotlkClass": typeof lib_wotlkClass;
  "lib/wotlkClasses": typeof lib_wotlkClasses;
  runicEnhancements: typeof runicEnhancements;
  "seed/legendaryRes": typeof seed_legendaryRes;
  "seed/migrateRemoveClasses": typeof seed_migrateRemoveClasses;
  "seed/migrateTalentAbilities": typeof seed_migrateTalentAbilities;
  "seed/reseedAll": typeof seed_reseedAll;
  "seed/tableCounts": typeof seed_tableCounts;
  "seed/wotlkAbilities": typeof seed_wotlkAbilities;
  "seed/wotlkTalents": typeof seed_wotlkTalents;
  slotPicker: typeof slotPicker;
  talents: typeof talents;
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
