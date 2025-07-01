// ==UserScript==
// @name         YouTube URL Normalizer
// @namespace    https://github.com/oshirinap
// @version      1.0
// @description  Normalizes YouTube URLs everywhere, including Ajax (XMLHttpRequest/fetch), outside of YouTube itself
// @author       oshirinap
// @include      *
// @exclude      *://*.youtube.com/*
// @exclude      *://*.youtube-nocookie.com/*
// @exclude      *://youtu.be/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Regex to match YouTube URLs, extract video id (including Shorts)
    const ytRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    // Canonicalizer
    function canonicalize(url) {
        const m = url.match(ytRegex);
        if (m) {
            return 'https://www.youtube.com/watch?v=' + m[1];
        }
        return url;
    }

    // 1. Redirect navigation if necessary
    if (ytRegex.test(window.location.href)) {
        const canon = canonicalize(window.location.href);
        if (window.location.href !== canon) {
            window.location.replace(canon);
        }
    }

    // 2. Monkey-patch XMLHttpRequest
    (function(open) {
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            arguments[1] = canonicalize(url);
            return open.apply(this, arguments);
        };
    })(XMLHttpRequest.prototype.open);

    // 3. Monkey-patch fetch
    const origFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string') {
            input = canonicalize(input);
        } else if (input && input.url) {
            // For Request object
            const newUrl = canonicalize(input.url);
            if (newUrl !== input.url) {
                input = new Request(newUrl, input);
            }
        }
        return origFetch.call(this, input, init);
    };

    // 4. Optional: fix <a> tags pointing to non-canonical YouTube URLs
    function fixLinks() {
        for (const a of document.querySelectorAll('a[href]')) {
            const canon = canonicalize(a.href);
            if (a.href !== canon) {
                a.href = canon;
            }
        }
    }
    fixLinks();
    // Watch DOM for dynamically added links
    new MutationObserver(fixLinks).observe(document.body, { childList: true, subtree: true });

})();