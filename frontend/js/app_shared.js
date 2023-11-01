"use strict"

import { localize, t } from "./i18n.js"

/** 
 * @typedef {import("./typedef.js").Option} Option 
 */

/** Format an option for displaying in the UI
 * @param {Option} option
 * @param {string | boolean} value
 * @returns {string}
 */
export const formatOption = (option, value) => {
    if (option.type == "bool") {
        const with_or_without = value ? t("with") : t("without")
        return `${with_or_without} ${option.name.toLowerCase()}`
    }

    if (option.type[0] == "[") {
        return `${option.name}: ${value}`
    }

    throw new Error ("Unexpected option type: " + option.type)
}