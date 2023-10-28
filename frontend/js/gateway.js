"use strict"

import config from "./config.js"

/**
 * Check the return code of the response and throw an error if it is not OK
 * @param {Response} res the fetch Response
 * @returns the response
 */
const throwNotOkResponse = res => {
    if (!res.ok)
        throw new Error("Not 2xx response", { cause: res })
    return res
}

/**
 * Perform an API call with the given string
 * @param {string} uri the URI of the API call, relative to the root API URL
 * @returns the fetch Promise
 */
const request = async uri => {
    return fetch(config.backend_url + uri)
    .then(throwNotOkResponse)
}

/**
 * Get the menu from the API
 * @returns the fetch Promise
 */
export const getMenu = async () => request("/menu/")