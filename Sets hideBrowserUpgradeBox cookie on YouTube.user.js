// ==UserScript==
// @name         Sets hideBrowserUpgradeBox cookie on YouTube
// @namespace    https://github.com/oshirinap
// @version      1.1
// @description  Sets cookie on YouTube to suppress upgrade nags, and auto-redirects from supported_browsers page
// @author       oshirinap
// @match        *://*.youtube.com/*
// @match        *://*.youtube-nocookie.com/*
// @match        *://youtu.be/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Sets hideBrowserUpgradeBox cookie on YouTube to suppress upgrade nags
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    document.cookie = "hideBrowserUpgradeBox=true; expires=" + d.toUTCString() + "; path=/; domain=.youtube.com; SameSite=Lax";

    // Regex to match YouTube URLs, extract video id (including Shorts)
    const ytRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    // Get the current URL
    const url = window.location.href;

    // 1. Redirect from supported_browsers page if present and next_url has a video id
    if (location.pathname === '/supported_browsers') {
        const params = new URLSearchParams(location.search);
        const nextUrl = params.get('next_url');
        if (nextUrl) {
            // Try to extract video ID from next_url
            const match = decodeURIComponent(nextUrl).match(ytRegex);
            if (match) {
                const canonicalUrl = 'https://www.youtube.com/watch?v=' + match[1];
                window.location.replace(canonicalUrl);
                return;
            }
        }
    }

    // 2. Try to match and extract the video ID from the current URL and redirect if not canonical
    const match = url.match(ytRegex);
    if (match && !url.startsWith('https://www.youtube.com/watch?v=' + match[1])) {
        const canonicalUrl = 'https://www.youtube.com/watch?v=' + match[1];
        window.location.replace(canonicalUrl);
    }
})();