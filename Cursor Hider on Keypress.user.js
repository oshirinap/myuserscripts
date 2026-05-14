// ==UserScript==
// @name         Cursor Hider on Keypress
// @namespace    https://github.com/oshirinap
// @version      0.2
// @description  Hides the cursor on key input and spoofs mouse coordinates. Cursor reappears on mouse movement or click, page loads or is refreshed.
// @author       oshirinap
// @match        *://*/*
// @match        *://claude.ai/*
// @grant        none
// @run-at       document-start
// @license      MIT License
// ==/UserScript==

(function () {
    'use strict';

    // --- State ---
    let cursorHidden = false;
    let spoofActive = false;

    // Last real mouse position (updated only when cursor is visible)
    let realX = -1;
    let realY = -1;

    // Spoofed position — frozen at the position cursor was when hiding started
    let frozenX = -1;
    let frozenY = -1;

    // --- Style injection ---
    const styleEl = document.createElement('style');
    styleEl.id = '__cursor_hider_style__';
    styleEl.textContent = '';

    function injectStyle() {
        if (!document.head) {
            document.addEventListener('DOMContentLoaded', injectStyle, { once: true });
            return;
        }
        document.head.appendChild(styleEl);
    }
    injectStyle();

    function hideCursor() {
        if (cursorHidden) return;
        cursorHidden = true;
        spoofActive = true;
        frozenX = realX;
        frozenY = realY;
        styleEl.textContent = '*, *::before, *::after { cursor: none !important; }';
    }

    function showCursor() {
        if (!cursorHidden) return;
        cursorHidden = false;
        spoofActive = false;
        styleEl.textContent = '';
    }

    // --- Mouse coordinate spoofing ---
    // We intercept mousemove/mouseenter/mouseover/mouseout/mouseleave events
    // and replace clientX/clientY/screenX/screenY/pageX/pageY with frozen values
    // while the cursor is hidden. This prevents sites from detecting cursor position
    // via JS event listeners.

    const SPOOF_EVENTS = [
        'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
        'pointermove', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave'
    ];

    function makeSpoofedEvent(originalEvent) {
        // Clone the event but override coordinate properties
        const props = {};
        for (const key in originalEvent) {
            try { props[key] = originalEvent[key]; } catch (_) {}
        }

        // Override coordinate properties with frozen values
        const overrides = {
            clientX: frozenX,
            clientY: frozenY,
            screenX: frozenX,
            screenY: frozenY,
            pageX: frozenX + (window.scrollX || 0),
            pageY: frozenY + (window.scrollY || 0),
            x: frozenX,
            y: frozenY,
            movementX: 0,
            movementY: 0,
            offsetX: frozenX,
            offsetY: frozenY,
        };

        // Create a new event of the same type
        const newEvent = new originalEvent.constructor(originalEvent.type, {
            ...originalEvent,
            bubbles: originalEvent.bubbles,
            cancelable: originalEvent.cancelable,
            composed: originalEvent.composed,
            clientX: overrides.clientX,
            clientY: overrides.clientY,
            screenX: overrides.screenX,
            screenY: overrides.screenY,
            movementX: overrides.movementX,
            movementY: overrides.movementY,
        });

        return newEvent;
    }

    // Intercept at capture phase on window — this fires before any document/element listener.
    // Reveal logic MUST live here; any separate document.addEventListener for mousemove
    // never fires because stopImmediatePropagation() below kills the event first.
    for (const evtName of SPOOF_EVENTS) {
        window.addEventListener(evtName, function (e) {
            const isMove = e.type === 'mousemove' || e.type === 'pointermove';

            if (!spoofActive) {
                // Track real position while cursor is visible
                if (isMove) {
                    realX = e.clientX;
                    realY = e.clientY;
                }
                return;
            }

            // --- Reveal check (must happen before stopImmediatePropagation) ---
            if (isMove) {
                const dx = e.clientX - frozenX;
                const dy = e.clientY - frozenY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    realX = e.clientX;
                    realY = e.clientY;
                    showCursor();
                    // Cursor is now visible; let this event through normally
                    return;
                }
                // Tiny movement while hidden — suppress entirely
                e.stopImmediatePropagation();
                return;
            }

            // For non-move events (hover enter/leave) while hidden:
            // suppress the real event and re-dispatch a spoofed copy with frozen coords
            e.stopImmediatePropagation();
            const spoofed = makeSpoofedEvent(e);
            e.target.dispatchEvent(spoofed);

        }, true /* capture */);
    }

    // Also spoof document.elementFromPoint when cursor is hidden
    const _originalElementFromPoint = document.elementFromPoint.bind(document);
    Object.defineProperty(document, 'elementFromPoint', {
        value: function (x, y) {
            if (spoofActive) {
                return _originalElementFromPoint(frozenX, frozenY);
            }
            return _originalElementFromPoint(x, y);
        },
        writable: true,
        configurable: true,
    });

    // --- Key detection ---
    // Hide cursor on any keydown that isn't a modifier-only press
    const IGNORED_KEYS = new Set([
        'Shift', 'Control', 'Alt', 'Meta',
        'CapsLock', 'NumLock', 'ScrollLock',
        'OS', 'Win'
    ]);

    document.addEventListener('keydown', function (e) {
        if (IGNORED_KEYS.has(e.key)) return;
        hideCursor();
    }, true);

    // --- Reveal on click ---
    // Movement reveal is handled inside the SPOOF_EVENTS window capture loop above.
    // Clicks are not in SPOOF_EVENTS so they get their own handler here.
    const REVEAL_CLICKS = ['mousedown', 'pointerdown'];
    for (const evtName of REVEAL_CLICKS) {
        window.addEventListener(evtName, function (e) {
            if (cursorHidden) {
                realX = e.clientX;
                realY = e.clientY;
                showCursor();
                // Let the click through normally — don't suppress it
            }
        }, true);
    }

})();
