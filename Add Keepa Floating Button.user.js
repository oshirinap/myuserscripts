// ==UserScript==
// @name         Add Keepa Floating Button
// @namespace    https://github.com/oshirinap
// @version      0.2.3
// @description  Add a floating Keepa price history button to Amazon product pages (Japan, UK, US supported)
// @author       oshirinap
// @match        https://www.amazon.co.jp/*dp/*
// @match        https://www.amazon.co.uk/*dp/*
// @match        https://www.amazon.com/*dp/*
// @grant        none
// @license      MIT License
// ==/UserScript==

(function () {
  'use strict';

  const SHOW_THRESHOLD = 1440; // Show button only when within 1440px from top

  // Exact hostname -> Keepa country code.
  // Exact matching avoids lookalike hosts such as "evilamazon.com".
  const COUNTRY_CODES = {
    'www.amazon.co.jp': '5', // Japan
    'www.amazon.co.uk': '2', // United Kingdom
    'www.amazon.com': '1',   // United States
  };
  const DEFAULT_COUNTRY_CODE = '1'; // Default to US if unknown

  let floatingButton = null;

  init();

  function init() {
    // Only add the button if we can extract a product ID
    const asin = getProduct();
    if (!asin) return;

    insertFloatingButton(asin);
    setupScrollListener();
  }

  function getProduct() {
    const match = location.href.match(/dp\/([0-9A-Z]{10})(?:[/?]|$)/i);
    return match ? match[1] : null;
  }

  function getCountryCode() {
    return COUNTRY_CODES[location.hostname] || DEFAULT_COUNTRY_CODE;
  }

  function createFloatingKeepaButton(asin) {
    const a = document.createElement('a');
    a.href = 'https://keepa.com/#!product/' + getCountryCode() + '-' + asin;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = 'Check price history on Keepa';
    a.innerText = '📉 Keepa';

    // Floating styling
    Object.assign(a.style, {
      position: 'fixed',
      bottom: '22px',
      right: '22px',
      background: '#232f3e',
      color: '#fff',
      padding: '14px 22px',
      borderRadius: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      zIndex: '99999',
      fontSize: '1.25em',
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'background 0.2s, color 0.2s, opacity 0.3s, visibility 0.3s',
      opacity: '1',
      visibility: 'visible',
    });

    // Hover effect
    a.addEventListener('mouseenter', () => {
      a.style.background = '#ff9900';
      a.style.color = '#232f3e';
    });
    a.addEventListener('mouseleave', () => {
      a.style.background = '#232f3e';
      a.style.color = '#fff';
    });

    return a;
  }

  function insertFloatingButton(asin) {
    floatingButton = createFloatingKeepaButton(asin);
    document.body.appendChild(floatingButton);

    // Set initial visibility based on scroll position
    updateButtonVisibility();
  }

  function updateButtonVisibility() {
    if (!floatingButton) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const visible = scrollTop <= SHOW_THRESHOLD;

    floatingButton.style.opacity = visible ? '1' : '0';
    floatingButton.style.visibility = visible ? 'visible' : 'hidden';
  }

  function setupScrollListener() {
    // Throttle scroll events for better performance
    let ticking = false;

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateButtonVisibility();
          ticking = false;
        });
      },
      { passive: true }
    );
  }
})();
