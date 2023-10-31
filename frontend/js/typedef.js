/**
 * @typedef Table
 * @prop {number} id
 * @prop {string} name
 * @prop {string} slug
 */

/**
 * @typedef MenuCategory
 * @prop {number} id
 * @prop {string} name
 * @prop {string} slug
 */

/**
 * @typedef Option
 * @prop {number} id
 * @prop {string} name
 * @prop {string} slug
 * @prop {string} type
 */

/**
 * @typedef MenuItem
 * @prop {number} id
 * @prop {string} name
 * @prop {string} description
 * @prop {string} image
 * @prop {boolean} available
 * @prop {MenuCategory} category
 * @prop {Option[]} options
 */

/**
 * @typedef OrderOption
 * @prop {number} id
 * @prop {string | boolean} value
 * @prop {Option} option
 */

/**
 * @typedef OrderItem
 * @prop {number} id
 * @prop {MenuItem} menu_item
 * @prop {number} quantity
 * @prop {OrderOption[]} options
 */

/** 
 * @typedef Order
 * @prop {number} id
 * @prop {string} client_name
 * @prop {boolean} started
 * @prop {boolean} served
 * @prop {Table} table
 * @prop {MenuItem[]} items
 */

export const Types = {}