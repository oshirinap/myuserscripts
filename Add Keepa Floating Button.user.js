// ==UserScript==
// @name         Add Keepa Floating Button
// @namespace    https://github.com/oshirinap
// @version      0.2.1
// @description  Add a floating Keepa price history button to Amazon product pages (Japan, UK, US supported)
// @author       oshirinap
// @match        https://www.amazon.co.jp/*dp/*
// @match        https://www.amazon.co.uk/*dp/*
// @match        https://www.amazon.com/*dp/*
// @grant        none
// @license      MIT License
// ==/UserScript==

(function() {
  'use strict';

  let floatingButton = null;
  const SHOW_THRESHOLD = 1440; // Show button only when within 1440px from top

  // Main entry
  init();

  function init() {
    // Only add if we can extract a product ID
    if (getProduct()) {
      insertFloatingButton();
      setupScrollListener();
    }
  }

  function getProduct() {
    const url = location.href;
    const patternList = [
      /dp\/([0-9,A-Z]{10})(?:[/?]|$)/i,
    ];
    let product = null;
    patternList.forEach(pattern => {
      const match = url.match(pattern);
      if (match) {
        product = match[1];
        return;
      }
    });
    return product;
  }

  function getCountryCode() {
    if (location.hostname.endsWith('amazon.co.jp')) {
      return '5'; // Japan
    } else if (location.hostname.endsWith('amazon.co.uk')) {
      return '2'; // United Kingdom
    } else if (location.hostname.endsWith('amazon.com')) {
      return '1'; // United States
    }
    // Default to US if unknown
    return '1';
  }

  function createFloatingKeepaButton() {
    const a = document.createElement("a");
    const keepaUrl = "https://keepa.com/#!product/" + getCountryCode() + "-" + getProduct();
    a.setAttribute("href", keepaUrl);
    a.setAttribute("target", "_blank");
    a.setAttribute("title", "Check price history on Keepa");
    a.innerText = "📉 Keepa";

    // Floating styling
    Object.assign(a.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#232f3e",
      color: "#fff",
      padding: "14px 22px",
      borderRadius: "28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      zIndex: "99999",
      fontSize: "1.25em",
      fontFamily: "sans-serif",
      fontWeight: "bold",
      textDecoration: "none",
      cursor: "pointer",
      transition: "background 0.2s, color 0.2s, opacity 0.3s, visibility 0.3s",
      opacity: "1",
      visibility: "visible"
    });

    // Hover effect
    a.addEventListener("mouseenter", () => {
      a.style.background = "#ff9900";
      a.style.color = "#232f3e";
    });
    a.addEventListener("mouseleave", () => {
      a.style.background = "#232f3e";
      a.style.color = "#fff";
    });

    return a;
  }

  function insertFloatingButton() {
    floatingButton = createFloatingKeepaButton();
    document.body.appendChild(floatingButton);

    // Set initial visibility based on scroll position
    updateButtonVisibility();
  }

  function updateButtonVisibility() {
    if (!floatingButton) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop <= SHOW_THRESHOLD) {
      // Show button
      floatingButton.style.opacity = "1";
      floatingButton.style.visibility = "visible";
    } else {
      // Hide button
      floatingButton.style.opacity = "0";
      floatingButton.style.visibility = "hidden";
    }
  }

  function setupScrollListener() {
    // Throttle scroll events for better performance
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateButtonVisibility();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
})();