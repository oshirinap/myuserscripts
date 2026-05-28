// ==UserScript==
// @name         Disable Input Suggestions and Interruptions
// @namespace    https://github.com/oshirinap
// @version      0.5
// @description  Aggressively kills autocomplete, autocorrect, autocapitalize, and Google search suggestions.
// @author       oshirinap
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @license      MIT License
// ==/UserScript==

(function () {
    'use strict';

    // *** CONFIGURATION ***
    const ATTRS = {
        'autocomplete':      'off',
        'autocorrect':       'off',
        'autocapitalize':    'off',
        'aria-autocomplete': 'none'
        // spellcheck intentionally omitted - leave it for LanguageTool etc.
    };

    const SELECTORS = 'input, textarea, [contenteditable], [role="textbox"], [role="combobox"], [role="searchbox"]';

    // *** CSS BLOCKING ***
    function injectCSS() {
        const style = document.createElement('style');

        // <datalist> is browser-native autocomplete only - safe to hide everywhere
        let css = `datalist { display: none !important; }`;

        // [role="listbox"] is reused by legitimate UI widgets (Amazon qty dropdowns,
        // custom selects, etc.) so only suppress it on Google where it's suggestions
        if (location.hostname.includes('google.')) {
            css += `
            .aajZCb, .erkvQe, .UUbT9, .G43f7e, [role="listbox"] {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                z-index: -9999 !important;
            }`;
        }

        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    // *** ELEMENT SANITIZATION ***
    function sanitize(el) {
        if (!el || typeof el.setAttribute !== 'function') return;
        for (const [attr, val] of Object.entries(ATTRS)) {
            el.setAttribute(attr, val);
        }
        if ('autocomplete' in el) el.autocomplete = 'off';
        // spellcheck left alone - LanguageTool and browser spell check depend on it
    }

    function sanitizeAll() {
        document.querySelectorAll(SELECTORS).forEach(sanitize);
    }

    // *** INTERCEPT PROGRAMMATIC CHANGES ***
    // Only re-enforce autocomplete=off - don't intercept spellcheck or other
    // attributes that extensions like LanguageTool legitimately set.
    const _setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
        if (name.toLowerCase() === 'autocomplete' && this.matches?.(SELECTORS)) {
            return _setAttribute.call(this, name, 'off');
        }
        return _setAttribute.call(this, name, value);
    };

    // *** NETWORK BLOCKING (Google only) ***
    if (location.hostname.includes('google.')) {
        const _fetch = window.fetch;
        window.fetch = function (input, init) {
            const url = (typeof input === 'string' ? input : input?.url) || '';
            if (url.includes('/complete/search') || url.includes('suggestqueries')) {
                return Promise.resolve(new Response('[]', { status: 200 }));
            }
            return _fetch.apply(this, arguments);
        };

        const _open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            if (typeof url === 'string' &&
                (url.includes('/complete/search') || url.includes('suggestqueries'))) {
                this._blocked = true;
            }
            return _open.call(this, method, url, ...rest);
        };
        const _send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            if (this._blocked) return;
            return _send.apply(this, args);
        };
    }

    // *** OBSERVERS ***
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.matches?.(SELECTORS)) sanitize(node);
                node.querySelectorAll?.(SELECTORS).forEach(sanitize);

                // Hide Google suggestion listboxes as they appear - but only on Google
                if (location.hostname.includes('google.') &&
                    node.matches?.('.aajZCb, [role="listbox"]')) {
                    node.style.display = 'none';
                }
            }
        }
    });

    // *** INITIALIZATION ***
    const init = () => {
        injectCSS();
        sanitizeAll();
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-sanitize on focus for SPAs that lazy-render fields
    document.addEventListener('focusin', e => {
        if (e.target?.matches?.(SELECTORS)) sanitize(e.target);
    }, true);

    // Fail-safe: hide Google suggestion dropdown on keyup
    document.addEventListener('keyup', e => {
        if (location.hostname.includes('google.') && e.target.name === 'q') {
            const dropdown = document.querySelector('.aajZCb, [role="listbox"]');
            if (dropdown) dropdown.style.display = 'none';
        }
    }, true);

})();
