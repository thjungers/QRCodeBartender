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
 * @returns the fetch Promise
 */
const request = async uri => {
    return fetch(config.backend_url + uri)
    .then(throwNotOkResponse)
}

/**
 * Perform a POST API call with the given string
 * @param {string} uri the URI of the API call, relative to the root API URL
 * @param {string} body the request body
 * @returns the fetch Promise
 */
const requestPost = async (uri, body) => {
    console.log(body)
    return fetch(config.backend_url + uri, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    .then(throwNotOkResponse)
}

/**
 * Get the menu from the API
 * @returns the fetch Promise
 */
export const getMenu = async () => request("/menu/")

/**
 * Post a new order
 * @param order
 * @returns the fetch Promise
 */
export const postOrder = async order => requestPost("/orders/", order)