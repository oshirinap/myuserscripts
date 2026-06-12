// ==UserScript==
// @name         Chrome Web Store CRX Downloader
// @namespace    https://github.com/oshirinap
// @version      0.3
// @description  Adds a floating CRX download button (lower right corner)
// @author       oshirinap
// @match        https://chromewebstore.google.com/detail/*
// @exclude      https://chromewebstore.google.com/*/error
// @grant        none
// @license      MIT License
// ==/UserScript==

(function() {
    'use strict';

    function getExtensionId() {
        const parts = window.location.pathname.split('/');
        return parts.find(p => /^[a-z]{32}$/.test(p)) || null;
    }

    function getChromeVersion() {
        const match = navigator.userAgent.match(/Chrome\/([\d.]+)/);
        return match ? match[1] : "114.0";
    }

    function buildCRXUrl(extId, version) {
        return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${extId}%26uc`;
    }

    function createFloatingButton(crxUrl) {
        const btn = document.createElement('div');
        btn.id = 'crx-download-btn';
        btn.innerText = '⬇ CRX';

        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '22px',
            right: '22px',
            zIndex: '9999',
            padding: '14px 22px',
            background: '#4CAF50',
            color: '#fff',
            fontSize: '1.25em',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            borderRadius: '24px',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
        });

        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.background = '#43a047';
        };

        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.background = '#4CAF50';
        };

        btn.onclick = () => {
            window.open(crxUrl, '_blank');
        };

        document.body.appendChild(btn);
    }

    function init() {
        const extId = getExtensionId();

        // Always remove stale button first — ensures SPA navigation gets a fresh URL
        document.getElementById('crx-download-btn')?.remove();

        if (!extId) return;

        const version = getChromeVersion();
        const crxUrl = buildCRXUrl(extId, version);
        createFloatingButton(crxUrl);
    }

    // Lightweight URL-change polling instead of a hot MutationObserver
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(init, 500);
        }
    }, 300);

    window.addEventListener('load', init);

})();
