// ==UserScript==
// @name         Bilibili Rocket Everywhere
// @namespace    https://github.com/oshirinap
// @version      0.2.3
// @description  Adds the bilibili (哔哩哔哩) 22 and 33 rocket scroll-to-top button with a pre-launch animation to every page
// @author       oshirinap
// @match        *://*/*
// @exclude      *bilibili.com/*
// @grant        none
// @license      MIT License
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // *** Sprite data ***
  const SPRITE_URL = 'https://i0.hdslb.com/bfs/static/jinkela/space/asserts/space-to-top.png';
  const FRAMES = [
    '-40px -44px',    // 0 idle
    '-182px -44px',   // 1 ignition
    '-326px -44px',   // 2 peak flame
    '-469px -44px',   // 3 burn-a
    '-611px -44px',   // 4 burn-b
    '-754px -44px',   // 5 burn-c
    '-897px -44px',   // 6 exhaust / coda
  ];

  // Animation sequence for pre-launch (plays once till full thrust)
  const SEQ_IGNITE = [1, 2, 3, 4, 5];
  const FRAME_MS_LAUNCH = 70;   // ms per frame during launch

  const SHOW_AFTER    = 1440;   // px scrolled before button appears
  const BOTTOM_OFFSET = 96;
  const RIGHT_OFFSET  = 24;

  // *** Styles ***
  const style = document.createElement('style');
  style.textContent = `
    #bili-rocket-btn {
      position: fixed;
      bottom: ${BOTTOM_OFFSET}px;
      right: ${RIGHT_OFFSET}px;
      width: 62px;
      height: 85px;
      cursor: pointer;
      background-image: url("${SPRITE_URL}");
      background-position: ${FRAMES[0]};
      background-repeat: no-repeat;
      opacity: 0;
      pointer-events: none;
      z-index: 2147483647;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
      transition: opacity 0.25s ease;
    }
    #bili-rocket-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }
    #bili-rocket-btn.launching {
      transition: transform 0.45s ease-in, opacity 0.45s ease-in !important;
      transform: translateY(-115vh) !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  // *** Element ***
  const btn = document.createElement('div');
  btn.id    = 'bili-rocket-btn';
  btn.title = '回到顶部';
  document.body.appendChild(btn);

  // *** Frame animator ***
  let animTimer   = null;
  let animIdx     = 0;
  let animSeq     = null;
  let loopSeq     = null;

  function stopAnim() {
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    animSeq = null;
    loopSeq = null;
  }

  function setFrame(f) {
    btn.style.backgroundPosition = FRAMES[f];
  }

  function stepAnim(ms) {
    if (!animSeq) return;
    const frame = animSeq[animIdx];
    setFrame(frame);
    animIdx++;
    if (animIdx >= animSeq.length) {
      if (loopSeq) {
        animSeq = loopSeq;
        animIdx = 0;
      } else {
        animTimer = null;
        return;
      }
    }
    animTimer = setTimeout(() => stepAnim(ms), ms);
  }

  function playSeq(seq, ms, loop) {
    stopAnim();
    animSeq  = seq;
    loopSeq  = loop || null;
    animIdx  = 0;
    stepAnim(ms);
  }

  // *** Scroll visibility ***
  let ticking   = false;
  let isVisible = false;
  let launching = false; // Moved up to be accessible by onScroll

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const shouldShow = scrollY > SHOW_AFTER;

        if (shouldShow !== isVisible) {
          // CRITICAL: Prevent the button from reappearing mid-launch/smooth-scroll
          if (shouldShow && launching) {
            ticking = false;
            return;
          }

          isVisible = shouldShow;
          if (shouldShow) {
            btn.classList.add('visible');
          } else {
            btn.classList.remove('visible');
            stopAnim();
            setFrame(0);
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // *** Click: Ignite and launch! ***
  btn.addEventListener('click', () => {
    if (launching) return;
    launching = true;

    // 1. Play the pre-delay thrust animation once
    playSeq(SEQ_IGNITE, FRAME_MS_LAUNCH, null);
    const preLaunchDelay = SEQ_IGNITE.length * FRAME_MS_LAUNCH;

    // 2. Wait for ignition, then fly off
    setTimeout(() => {
      btn.classList.add('launching');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 3. Reset the button visually after it flies off-screen
      setTimeout(() => {
        btn.classList.remove('visible');
        isVisible = false;
        btn.classList.remove('launching');
        setFrame(0);

        // 4. Wait until the smooth scroll finishes reaching the top before allowing it to reappear
        const checkScrollInterval = setInterval(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          if (scrollY <= SHOW_AFTER) {
            clearInterval(checkScrollInterval);
            launching = false;
          }
        }, 100);

        // Fallback: If user interrupts the scroll and stays down the page, reset after 2 seconds
        setTimeout(() => {
          clearInterval(checkScrollInterval);
          if (launching) {
            launching = false;
            onScroll(); // Manually check if it needs to be shown again
          }
        }, 2000);

      }, 550);

    }, preLaunchDelay);
  });

})();