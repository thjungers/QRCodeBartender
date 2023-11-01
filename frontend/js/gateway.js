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
 * Perform a GET API call with the given string
 * @param {string} uri the URI of the API call, relative to the root API URL
 * @param {string} auth the base64-encoded username and password for Basic Auth
 * @returns the fetch Promise
 */
export const request = async (uri, auth) => {
    const headers = {}
    if (auth !== undefined)
        headers.Authorization = `Basic ${auth}`

    return fetch(config.backend_url + uri, {headers: headers})
    .then(throwNotOkResponse)
}

/**
 * Perform a POST API call with the given string
 * @param {string} uri the URI of the API call, relative to the root API URL
 * @param {string} body the request body
 * @param {string} auth the base64-encoded username and password for Basic Auth
 * @returns the fetch Promise
 */
const requestPost = async (uri, body) => {
    const headers = {"Content-Type": "application/json"}
    if (auth !== undefined)
        headers.Authorization = `Basic ${auth}`

    return fetch(config.backend_url + uri, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    })
    .then(throwNotOkResponse)
}

/**
 * Check the given credentials are valid, against the /auth/ API route
 * @param {string} auth the base64-encoded username and password for Basic Auth
 * @returns {bool}
 */
export const checkAuth = async auth => request("/auth/", auth).then(() => true).catch(() => false)

/**
 * Get the menu from the API
 * @returns the fetch Promise
 */
export const getMenu = async () => request("/menu/")

/**
 * Get the orders from the API
 * @returns the fetch Promise
 */
export const getOrders = async auth => request("/orders/", auth)

/**
 * Post a new order
 * @param order
 * @returns the fetch Promise
 */
export const postOrder = async order => requestPost("/orders/", order)