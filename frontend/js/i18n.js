"use strict"

import i18next from "https://cdn.jsdelivr.net/npm/i18next@22.4.11/+esm"
import httpBackend from "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.2.0/+esm"
import browserLanguagedetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@7.0.1/+esm'
import locI18next from 'https://cdn.jsdelivr.net/npm/loc-i18next@0.1.5/+esm'

await i18next
    .use(httpBackend)
    .use(browserLanguagedetector)
    .init({
        backend: {
            loadPath: "locales/{{lng}}/{{ns}}.json"
        },
        fallbackLng: "fr",
        supportedLngs: ["fr"],
        load: "languageOnly",
        ns: ["common"],
        defaultNS: "common",
    })

document.documentElement.lang = i18next.language

export const localize = locI18next.init(i18next)
export const t = i18next.t