"use strict"

import Cookies from "https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/+esm"
import { checkAuth, getOrders } from "./gateway.js"
import config from "./config.js"

/** 
 * @typedef {import("./typedef.js").Order} Order 
 */

const modals = {}

const init = () => {
    modals.login = new bootstrap.Modal("#login-modal")

    checkCredentials().then(auth => {
        getOrders(auth).then(response => response.json()).then(showOrders)
    })
}

/**
 * Check the saved authentication cookie. 
 * If it is not valid or undefined, ask for credentials by showing a modal. 
 * If the modal form is submitted and the new credentials are valid, resolve. 
 * The authentication cookie is provided when the Promise is resolved.
 * @returns {Promise}
 */
const checkCredentials = () => new Promise((resolve, reject) => {
    const cookie_name = "api-auth"
    const auth_cookie = Cookies.get(cookie_name)
    if (auth_cookie !== undefined) {
        if (checkAuth(auth_cookie)) {
            resolve(auth_cookie)
            return
        }
        
        // If the stored credentials do not work, delete them
        Cookies.remove(cookie_name)
        auth_cookie = undefined
    }

    modals.login.show()

    const form = document.querySelector("#login-modal form")
    form.onsubmit = async event => {
        console.log(event)
        event.preventDefault()
        event.stopPropagation()

        const username = document.getElementById("login-input-username").value
        const password = document.getElementById("login-input-password").value
        const auth = btoa(`${username}:${password}`)

        if (await checkAuth(auth)) {
            Cookies.set(cookie_name, auth)
            modals.login.hide()
            resolve(auth)
            return
        }

        form.querySelectorAll("input").forEach(input => input.classList.add("is-invalid"))
    }
})

const showOrders = orders => {
    console.log(orders)
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init)
else
    init()
