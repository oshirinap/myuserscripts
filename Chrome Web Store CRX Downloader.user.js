// ==UserScript==
// @name         Chrome Web Store CRX Downloader
// @namespace    https://github.com/oshirinap
// @version      0.2
// @description  Adds a floating CRX download button (lower right corner)
// @author       oshirinap
// @match        https://chromewebstore.google.com/detail/*
// @grant        none
// @license      MIT License
// ==/UserScript==

(function() {
    'use strict';

    function getExtensionId() {
        const parts = window.location.pathname.split('/');
        return parts.pop() || parts.pop();
    }

    function getChromeVersion() {
        const match = navigator.userAgent.match(/Chrome\/([\d.]+)/);
        return match ? match[1] : "114.0";
    }

    function buildCRXUrl(extId, version) {
        return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${extId}%26uc`;
    }

    function createFloatingButton(crxUrl) {
        if (document.getElementById('crx-download-btn')) return;

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
            fontFamily: "sans-serif",
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
        if (!extId) return;

        const version = getChromeVersion();
        const crxUrl = buildCRXUrl(extId, version);

        createFloatingButton(crxUrl);
    }

    // Handle SPA navigation (Chrome Web Store uses client-side routing)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(init, 500);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run
    window.addEventListener('load', init);

})();