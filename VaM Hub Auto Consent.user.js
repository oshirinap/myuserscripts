// ==UserScript==
// @name         VaM Hub Auto Consent
// @namespace    https://github.com/oshirinap
// @version      0.1
// @description  Automatically sets the vamhubconsent=yes cookie before accessing hub.virtamate.com, skipping the consent prompt.
// @author       oshirinap
// @match        *://hub.virtamate.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const COOKIE_NAME = 'vamhubconsent';
    const COOKIE_VALUE = 'yes';

    /**
     * Returns the current value of a cookie by name, or null if absent.
     */
    function getCookie(name) {
        const match = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='));
        return match ? match.split('=')[1] : null;
    }

    /**
     * Writes the consent cookie with the original attributes.
     * - path  : /        (site-wide)
     * - secure: false    (http + https)
     * - sameSite not forced (browser default)
     */
    function setConsentCookie() {
        document.cookie = [
            `${COOKIE_NAME}=${COOKIE_VALUE}`,
            `path=/`,
            `domain=hub.virtamate.com`
        ].join('; ');
    }

    // Only write the cookie when it isn't already present or has a wrong value.
    if (getCookie(COOKIE_NAME) !== COOKIE_VALUE) {
        setConsentCookie();
        console.log(`[VaM Hub Consent] Cookie "${COOKIE_NAME}" set to "${COOKIE_VALUE}".`);
    } else {
        console.log(`[VaM Hub Consent] Cookie already present – nothing to do.`);
    }

})();
