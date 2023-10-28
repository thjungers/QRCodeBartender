"use strict"

let config

await fetch("/config.json")
.then(response => response.json())
.then(json => config = json)

export default config