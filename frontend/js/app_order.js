"use strict"

import { localize, t } from "./i18n.js"
import { getMenu, postOrder, getClientOrders } from "./gateway.js"
import { connectWebSocket, getUserId } from "./websockets.js"
import { formatOption } from "./app_shared.js"
import config from "./config.js"

/** @typedef {import("./typedef.js").MenuCategory} MenuCategory */
/** @typedef {import("./typedef.js").Option} Option */
/** @typedef {import("./typedef.js").MenuItem} MenuItem */
/** @typedef {import("./typedef.js").Order} Order */
/** @typedef {{item: MenuItem, options: {}, quantity: number}} CartItem */

/** @type {MenuItem[]} */
const menuItems = []
/** @type {MenuCategory[]} */
const categories = []
/** @type {CartItem[]} */
const cart = []
const modals = {}
let numOrders = 0

const init = () => {
    getMenu().then(response => response.json()).then(createMenu)
    getClientOrders(getUserId("client")).then(response => response.json()).then(createOrderNotifications)

    localize("body")
    connectWebSocket("client").then()

    modals.addItem = new bootstrap.Modal("#add-item-modal")
    modals.showCart = new bootstrap.Modal("#show-cart-modal")
    document.getElementById("show-cart-modal").addEventListener("show.bs.modal", updateCartModal)
    document.querySelector("#show-cart-modal-submit").addEventListener("click", submitCart)
}

/** Populate the UI with the menu
 * @param {MenuItem[]} menuData */
const createMenu = menuData => {
    for (const item of menuData) {
        menuItems.push(item)
        if (!categories.find(category => category.slug === item.category.slug)) {
            categories.push(item.category)
        }
    }
    // Sort categories by id
    categories.sort((a, b) => a.id - b.id)

    const menuDiv = document.getElementById("menu")
    const menuCategoryTemplate = document.getElementById("menu-category-template")
    const menuItemTemplate = document.getElementById("menu-item-template")

    for (const category of categories) {
        const items = menuItems.filter(item => item.category.slug === category.slug)

        /** @type {HTMLElement} */
        const menuCategoryClone = menuCategoryTemplate.content.cloneNode(true)

        const accordionId = `accordion-${category.slug}`
        menuCategoryClone.querySelector(".menu-category-header > button").setAttribute("data-bs-target", "#" + accordionId)
        menuCategoryClone.querySelector(".menu-category-header > button").textContent = category.name
        menuCategoryClone.querySelector(".menu-category-block").setAttribute("id", accordionId)

        const menuCategoryContent = menuCategoryClone.querySelector(".accordion-body")

        for (const item of items) {
            /** @type {HTMLElement} */
            const itemElm = menuItemTemplate.content.cloneNode(true)
            const card = itemElm.querySelector(".card")
            itemElm.querySelector(".card-title").textContent = item.name
            itemElm.querySelector(".card-text").textContent = item.description
            itemElm.querySelector("img").setAttribute("src", item.image)
            if (!item.available) {
                showItemAvailability(item, card)
            }

            const addItemCallback = item.options.length ? showAddItemModal : addItemToCart
            itemElm.querySelector(".add-to-cart-btn").addEventListener("click", event => addItemCallback(item))
            document.addEventListener("app-menu-item-availability", event => {
                // Each card listens for this event on the document. If it is concerned, it changes its status
                if (event.detail.item_id === item.id) {
                    item.available = event.detail.available
                    showItemAvailability(item, card)
                }
            })

            menuCategoryContent.appendChild(itemElm)
        }
        menuDiv.appendChild(menuCategoryClone)
    }
}

/** Show the modal to add this item to the cart, letting the user choose options
 * @param {MenuItem} item */
const showAddItemModal = item => {
    const modalDiv = document.getElementById("add-item-modal")
    const modal = modals.addItem

    modalDiv.querySelector(".modal-title").textContent = item.name
    modalDiv.querySelector("#add-item-modal-img").setAttribute("src", item.image)
    modalDiv.querySelector("#add-item-modal-description").textContent = item.description
    
    const modalOpts = modalDiv.querySelector("#add-item-modal-options")
    modalOpts.innerHTML = ""

    for (const option of item.options) {
        let optionElm
        if (option.type == "bool") {
            // Display a switch checkbox
            /** @type {HTMLElement} */
            optionElm = document.getElementById("switch-template").content.cloneNode(true)
            const input = optionElm.querySelector("input")
            const label = optionElm.querySelector("label")
            input.setAttribute("id", getOptionInputId(option))
            label.setAttribute("for", getOptionInputId(option))
            label.textContent = option.name
        }
        else if (option.type[0] == "[") {
            // This is a list of options
            const listElms = JSON.parse(option.type)
            // Display a select
            /** @type {HTMLElement} */
            optionElm = document.getElementById("select-template").content.cloneNode(true)
            const select = optionElm.querySelector("select")
            select.setAttribute("id", getOptionInputId(option))

            const defaultOptionElm = document.createElement("option")
            defaultOptionElm.textContent = t(`order:choose-your-${option.slug}`)
            defaultOptionElm.value = ""
            select.appendChild(defaultOptionElm)

            for (const listElm of listElms) {
                const optionElm = document.createElement("option")
                optionElm.value = listElm
                optionElm.textContent = listElm
                select.appendChild(optionElm)
            }
        }
        else {
            throw new Error("Unknown option type: " + option.type)
        }
        modalOpts.appendChild(optionElm)
    }
    
    modal.show()

    document.getElementById("add-item-modal-submit").onclick = event => {
        if (!checkValidity(modalOpts))
            return

        const options = {}
        for (const option of item.options) {
            const input = modalDiv.querySelector(`#${getOptionInputId(option)}`)

            let value
            if (option.type == "bool") {
                value = input.checked
            }
            else if (option.type[0] == "[") {
                value = input.value
            }

            options[option.slug] = value
        }
        addItemToCart(item, options)
        modal.hide()
    }
}

/** Create the input ID for the given option 
 * @param {MenuItemOption} option
*/
const getOptionInputId = option => `modal-option_${option.slug}`

/** Add an item and the chosen options to the cart
 * @param {MenuItem} item
 * @param options A mapping of the option slugs and the chosen value (this is easier to check for identical options)
 */
const addItemToCart = (item, options) => {
    // Check if this item, with the same options, is already in the cart
    const itemInCart = cart.find(elm => {
        if (elm.item.id != item.id)
            return false
        for (const option in options) {
            if (elm.options[option] != options[option])
                return false
        }
        return true
    })
    if (itemInCart !== undefined) {
        // If so, increase the quantity
        itemInCart.quantity ++
    }
    else {
        // Else, add it to the cart
        cart.push({
            item: item,
            options: options || {},
            quantity: 1
        })
    }

    updateCartBar()
}

/** Update the text in the cart bar, at the bottom of the UI */
const updateCartBar = () => {
    const cartBar = document.getElementById("cart-bar")
    if (cart.length === 0) {
        cartBar.classList.add("d-none")
    }
    else {
        cartBar.classList.remove("d-none")
        cartBar.querySelector("#cart-quantity").textContent = cart.reduce((acc, item) => acc + item.quantity, 0)
        // Flash once
        const badge = cartBar.querySelector(".badge")
        badge.classList.add("cart-bar-badge-flash")
        setTimeout(() => badge.classList.remove("cart-bar-badge-flash"), 250)
    }
}

/** Update the contents of the cart modal */
const updateCartModal = () => {
    const modalBody = document.querySelector("#show-cart-modal .list-cart-items")
    const template = document.getElementById("cart-item-template")
    modalBody.innerHTML = ""

    for (const cartItem of cart) {
        /** @type {HTMLElement} */
        const clone = template.content.cloneNode(true)
        const root = clone.children[0]
        clone.querySelector(".cart-item-name").textContent = cartItem.item.name
        clone.querySelector(".cart-item-quantity").textContent = cartItem.quantity
        const optionsDiv = clone.querySelector(".cart-item-options")
        for (const option in cartItem.options) {
            const p = document.createElement("p")
            const optionCat = cartItem.item.options.find(opt => opt.slug == option)
            const value = cartItem.options[option]

            p.textContent = formatOption(optionCat, value)
            optionsDiv.appendChild(p)
        }

        setDashOrTrash(clone, cartItem)

        clone.querySelector(".remove-one-cart-item-btn").addEventListener("click", event => {
            if (cartItem.quantity <= 1) {
                root.remove()
                const index = cart.indexOf(cartItem)
                cart.splice(index, 1)
                // If that was the last item in the basket, close the modal
                if (!cart.length)
                    modals.showCart.hide()
            }
            else {
                cartItem.quantity --
                root.querySelector(".cart-item-quantity").textContent = cartItem.quantity
                setDashOrTrash(root, cartItem)
            }
            updateCartBar()
        })
        clone.querySelector(".add-one-cart-item-btn").addEventListener("click", event => {
            cartItem.quantity ++
            root.querySelector(".cart-item-quantity").textContent = cartItem.quantity
            setDashOrTrash(root, cartItem)
            updateCartBar()
        })

        modalBody.appendChild(clone)
    }
}

/** Save the cart as a new order to the API */
const submitCart = () => {
    if (config.max_concurrent_orders > 0 && numOrders >= config.max_concurrent_orders) {
        alert(t("order:you-ve-already-made-n-orders-prepend") + numOrders + t("order:you-ve-already-made-n-orders-append"))
        return false
    }

    postOrder({
        client_name: "Thomas", // TODO ask the user
        client_uuid: getUserId("client"),
        table_slug: "salon", // TODO ask the user
        items: cart.map(elm => ({
            menu_item_id: elm.item.id,
            quantity: elm.quantity,
            options: Object.keys(elm.options).map(slug => ({
                option_slug: slug,
                value: elm.options[slug]
            }))
        }))
    })
    .then(response => response.json())
    .then(order => {
        cart.length = 0
        modals.showCart.hide()
        updateCartBar()
        showOrderNotification(order)
        numOrders += 1
    })
}

/** 
 * Set the "minus" button in a button group to the "trash" icon if removing 
 * one item would delete it, otherwise set it to the "dash" icon
 * @param {HTMLElement} root The button group
 * @param {CartItem} item 
 */
const setDashOrTrash = (root, item) => {
    const btn = root.querySelector(".remove-one-cart-item-btn")
    const icon = btn.querySelector(".bi")
    const qty = item.quantity

    if (qty < 1)
        throw new Error("The quantity of an item in the cart must be at least 1")

    if (qty === 1) {
        icon.classList.remove("bi-dash-lg")
        btn.classList.add("text-danger")
        icon.classList.add("bi-trash")
    }
    else {
        icon.classList.add("bi-dash-lg")
        btn.classList.remove("text-danger")
        icon.classList.remove("bi-trash")
    }
}

/** Show the availability of an item in the UI
 * @param {MenuItem} item 
 * @param {HTMLElement} element The root card element (with class "card")
*/
const showItemAvailability = (item, element) => {
    if (item.available) {
        element.classList.remove("disabled")
        element.querySelector("button").classList.remove("disabled")
        element.querySelector(".card-text").textContent = item.description
    }
    else {
        element.classList.add("disabled")
        element.querySelector("button").classList.add("disabled")
        element.querySelector(".card-text").textContent = t("order:item-not-available")
    }

}

/** @param {HTMLElement} form  */
const checkValidity = form => {
    for (const select of form.querySelectorAll("select[required]")) {
        if (select.value === "")
            select.setCustomValidity(t("select-required"))
        else
            select.setCustomValidity("")
        select.reportValidity()
    }
    return form.checkValidity()
}

/** @param {Order[]} orders */
const createOrderNotifications = orders => {
    for (const order of orders) {
        numOrders += 1
        showOrderNotification(order)
    }
}

/** @param {Order} order */
const showOrderNotification = order => {
    const toastContainer = document.querySelector("#toast-container")
    const template = document.getElementById("toast-template")

    const clone = template.content.cloneNode(true)
    const toast = clone.querySelector(".toast")

    clone.querySelector(".toast-order-number").textContent = order.id
    clone.querySelector(".toast-order-table").textContent = order.table.name
    const toastBody = clone.querySelector(".toast-body")
    setNotificationBody(order, toastBody)

    toastContainer.appendChild(clone)
    localize("#toast-container")
    const toastObj = new bootstrap.Toast(toast, {autohide: order.served})
    toastObj.show()

    document.addEventListener("app-order-started", event => {
        if (event.detail.order_id == order.id) {
            order.started = event.detail.started
            setNotificationBody(order, toastBody)
        }
    })
    document.addEventListener("app-order-served", event => {
        if (event.detail.order_id == order.id) {
            order.served = event.detail.served
            setNotificationBody(order, toastBody)
            if (order.served) {
                setTimeout(() => toastObj.hide(), 5000)
                numOrders -= 1
            }
        }
    })
}

/**
 * Set the contents of the notification body
 * @param {Order} order 
 * @param {HTMLElement} body 
 */
const setNotificationBody = (order, body) => {
    if (order.served) {
        body.textContent = t("order:served")
    }
    else if (order.started) {
        body.textContent = t("order:started")
    }
    else {
        body.textContent = t("order:waiting")
    }
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init)
else
    init()
