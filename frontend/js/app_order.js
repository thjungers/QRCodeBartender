"use strict"

import { localize, t } from "./i18n.js"
import config from "./config.js"
import { getMenu } from "./gateway.js"

const menuItems = []
const itemsPerCategory = {}
const cart = []
const modals = {}

const init = () => {
    getMenu().then(response => response.json()).then(createMenu)
    localize("body")
    modals.addItem = new bootstrap.Modal("#add-item-modal")
    modals.showCart = new bootstrap.Modal("#show-cart-modal")
    document.getElementById("show-cart-modal").addEventListener("show.bs.modal", updateCartModal)
}

const createMenu = menuData => {
    for (const item of menuData) {
        menuItems.push(item)
        if (!(item.category in itemsPerCategory))
            itemsPerCategory[item.category] = []
        itemsPerCategory[item.category].push(item)
    }

    const menuDiv = document.getElementById("menu")
    const menuCategoryTemplate = document.getElementById("menu-category-template")
    const menuItemTemplate = document.getElementById("menu-item-template")

    for (const category in itemsPerCategory) {
        const items = itemsPerCategory[category]

        /** @type {HTMLElement} */
        const menuCategoryClone = menuCategoryTemplate.content.cloneNode(true)

        const accordionId = `accordion-${category}`
        menuCategoryClone.querySelector(".menu-category-header > button").setAttribute("data-bs-target", "#" + accordionId)
        menuCategoryClone.querySelector(".menu-category-header > button").textContent = category
        menuCategoryClone.querySelector(".menu-category-block").setAttribute("id", accordionId)

        const menuCategoryContent = menuCategoryClone.querySelector(".accordion-body")

        for (const item of items) {
            /** @type {HTMLElement} */
            const itemElm = menuItemTemplate.content.cloneNode(true)
            itemElm.querySelector(".card-title").textContent = item.name
            itemElm.querySelector(".card-text").textContent = item.description
            itemElm.querySelector("img").setAttribute("src", item.image)

            const addItemCallback = "options" in item ? showAddItemModal : addItemToCart
            itemElm.querySelector(".add-to-cart-btn").addEventListener("click", event => addItemCallback(item))

            menuCategoryContent.appendChild(itemElm)
        }
        menuDiv.appendChild(menuCategoryClone)
    }
}

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

const getOptionInputId = option => `modal-option_${option.slug}`

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

            if (optionCat.type == "bool") {
                const with_or_without = value ? t("with") : t("without")
                p.textContent = `${with_or_without} ${optionCat.name.toLowerCase()}`
            }
            else if (optionCat.type[0] == "[") {
                p.textContent = `${optionCat.name}: ${value}`
            }

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

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init)
else
    init()
