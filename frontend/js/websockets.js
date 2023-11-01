"use strict"

import { v4 as uuid} from "https://cdn.jsdelivr.net/npm/uuid@9.0.1/+esm"
import Cookies from "https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/+esm"
import config from "./config.js"
import { request } from "./gateway.js"

/** Get the client_id or admin_id from the cookies; if not, create a new UUID and store it in the cookies 
 * @param {"client" | "admin"} user_type
 * @returns {string} The user id, a UUID
*/
export const getUserId = user_type => {
    if (!["client", "admin"].includes(user_type))
        throw new Error("Unexpected user_type: " + user_type)

    const cookie_name = user_type + "_id"

    let user_id = Cookies.get(cookie_name)

    if (user_id === undefined) {
        user_id = uuid()
        Cookies.set(cookie_name, user_id, {path: ""})
    }

    return user_id
}

/** Create a websocket for the given user type and setup the event listener
 * @param {"client" | "admin"} user_type
 * @param {string} auth the authentication cookie for Basic Auth, if required
 * @returns {WebSocket}
 */
export const connectWebSocket = async (user_type, auth) => {
    if (!["client", "admin"].includes(user_type))
        throw new Error("Unexpected user_type: " + user_type)

    const userId = getUserId(user_type)

    let wsTokenQuery = ""
    if (auth !== undefined) {
        // Get an authorization token by HTTP (to use the HTTP Basic Auth)
        const response = await request(`/ws-auth/${userId}`, auth)
        const json = await response.json()
        wsTokenQuery = `?token=${json.token}`
    }
    
    const ws = new WebSocket(`${config.websocket_url}/ws/${user_type}/${userId}/${wsTokenQuery}`)

    ws.onmessage = event => {
        /** @type {{"name": string, "detail": {}}} */
        const apiEvent = JSON.parse(event.data)
        document.dispatchEvent(
            new CustomEvent(apiEvent.name, {detail: apiEvent.detail})
        )
    }
}