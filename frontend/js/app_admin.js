"use strict"

import Cookies from "https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/+esm"
import { checkAuth, getOrders, setOrderStarted } from "./gateway.js"
import config from "./config.js"
import { connectWebSocket } from "./websockets.js"
import { localize, t } from "./i18n.js"
import { formatOption } from "./app_shared.js"

/** 
 * @typedef {import("./typedef.js").Order} Order 
 * @typedef {import("./typedef.js").OrderItem} OrderItem 
 */

const modals = {}

const init = () => {
    modals.login = new bootstrap.Modal("#login-modal")
    localize("body")

    checkCredentials().then(auth => {
        connectWebSocket("admin", auth).then()
        
        const orderDiv = document.getElementById("admin-orders")
        getOrders(auth).then(response => response.json()).then(orders => orders.forEach(order => showOrder(order, orderDiv, auth)))
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

/** Show an order in the UI 
 * @param {Order} order
 * @param {HTMLElement} root the root element in the UI
 * @param {string} auth the authentication cookie, for API calls
*/
const showOrder = (order, root, auth) => {
    const orderTemplate = document.getElementById("order-template")
    /** @type {HTMLElement} */
    const clone = orderTemplate.content.cloneNode(true)

    clone.querySelector(".order-number").textContent = order.id
    clone.querySelector(".order-client-name").textContent = order.client_name
    clone.querySelector(".order-table-name").textContent = order.table.name

    for (const item of order.items) {
        const itemElement = createOrderItemElement(order, item)
        clone.querySelector(".order-items").appendChild(itemElement)
    }

    const card = clone.querySelector(".order-card")
    showOrderStatus(order, card)
    document.addEventListener("app-order-started", event => {
        if (event.detail.order_id == order.id) {
            order.started = event.detail.started
            showOrderStatus(order, card)
        }
    })

    clone.querySelector(".order-start-btn").addEventListener("click", event => {
        // Button clicked: update the order through the API
        setOrderStarted(order.id, auth)
    })
    
    root.appendChild(clone)
    localize("#admin-orders")
}

/** Set the styles of the order card to show its status: pending or started 
 * @param {Order} order
 * @param {HTMLElement} card
*/
const showOrderStatus = (order, card) => {
    if (order.started) {
        // If order started:
        // Set the card header style 
        card.querySelector(".card-header").classList.add("preparing-order")
        // Enable checkboxes
        card.querySelectorAll("input[type='checkbox']").forEach(checkbox => checkbox.removeAttribute("disabled"))
    }
    else {
        // If order not started:
        // Remove the header style
        card.querySelector(".card-header").classList.remove("preparing-order")
        // Disable checkboxes
        card.querySelectorAll("input[type='checkbox']").forEach(checkbox => checkbox.setAttribute("disabled", ""))
    }
    
}

/** Create an HTML element for an item of an order
 * @param {Order} order the order this item belongs to
 * @param {OrderItem} item the item to show
 * @returns {HTMLElement}
 */
const createOrderItemElement = (order, item) => {
    const itemTemplate = document.getElementById("order-item-template")
    /** @type {HTMLElement} */
    const itemClone = itemTemplate.content.cloneNode(true)

    const checkboxId = `order_${order.id}_item_${item.id}_id`
    itemClone.querySelector("input").setAttribute("id", checkboxId)
    itemClone.querySelector("label").setAttribute("for", checkboxId)
    itemClone.querySelector(".order-item-name").textContent = item.menu_item.name
    itemClone.querySelector(".order-item-quantity").textContent = item.quantity
    
    const label = itemClone.querySelector("label")
    showOrderItemAvailability(item, label)
    document.addEventListener("app-menu-item-availability", event => {
        if (event.detail.item_id == item.menu_item.id) {
            item.menu_item.available = event.detail.available
            showOrderItemAvailability(item, label)
        }
    })

    const optionTemplate = document.getElementById("order-item-option-template")
    for (const option of item.options) {
        /** @type {HTMLElement} */
        const optionClone = optionTemplate.content.cloneNode(true)

        optionClone.querySelector(".order-item-option").textContent = formatOption(option.option, option.value)

        itemClone.querySelector(".order-item-options").appendChild(optionClone)
    }

    return itemClone
}

/** Set the styles of an order item to show its availability
 * @param {OrderItem} orderItem
 * @param {HTMLElement} label
 */
const showOrderItemAvailability = (orderItem, label) => {
    const currentStyle = orderItem.menu_item.available ? "secondary" : "danger"
    const oppositeStyle = !orderItem.menu_item.available ? "secondary" : "danger"
    
    label.classList.remove(`btn-outline-${oppositeStyle}`)
    label.classList.add(`btn-outline-${currentStyle}`)

    const quantity = label.querySelector(".order-item-header > div")
    quantity.classList.remove(`bg-${oppositeStyle}`, `text-bg-${oppositeStyle}`)
    quantity.classList.add(`bg-${currentStyle}`, `text-bg-${currentStyle}`)
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init)
else
    init()
