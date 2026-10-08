// ==UserScript==
// @name         GitHub Downloads → aria2 RPC
// @namespace    https://github.com/oshirinap
// @version      1.0
// @description  Silently sends GitHub file downloads (release assets, archives, attachments, gist files…) to aria2 JSON-RPC instead of the browser. Alt+click downloads normally.
// @author       oshirinap
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-start
// @license      MIT License
// ==/UserScript==

(function () {
  'use strict';

  // ---------- Settings (editable from the userscript manager's menu) ----------
  const DEFAULTS = {
    enabled: true,
    rpcUrl: 'http://localhost:6800/jsonrpc',
    secret: '',          // --rpc-secret, plain text
    dir: '',             // download directory; '' = aria2's default
    interceptRaw: false, // also intercept /raw/ links (off: "Raw" buttons keep opening in the browser)
    fallback: true,      // on aria2 failure, let the browser download the file instead
  };
  const get = (k) => GM_getValue(k, DEFAULTS[k]);
  const set = (k, v) => GM_setValue(k, v);

  // ---------- Which links count as "real files" ----------
  const FILE_PATTERNS = [
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\//,
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/archive\//,
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/(zip|tar)ball\//,
    /^https:\/\/github\.com\/user-attachments\/files\//,
    /^https:\/\/gist\.github\.com\/[^/]+\/[0-9a-f]+\/archive\//,
    /^https:\/\/codeload\.github\.com\//,
    /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/(zip|tar)ball\//,
  ];
  const RAW_PATTERNS = [
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/raw\//,
    /^https:\/\/raw\.githubusercontent\.com\//,
    /^https:\/\/gist\.githubusercontent\.com\//,
  ];

  function isFileLink(url) {
    if (FILE_PATTERNS.some((re) => re.test(url))) return true;
    return get('interceptRaw') && RAW_PATTERNS.some((re) => re.test(url));
  }

  // ---------- Toasts (bottom-right, auto-dismiss) ----------
  let toastBox = null;
  function toast(text, type = 'info', ms = 3500) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.style.cssText =
        'position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;' +
        'flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;';
      document.documentElement.appendChild(toastBox);
    }
    const colors = { info: '#0969da', ok: '#1a7f37', error: '#cf222e' };
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      `background:${colors[type] || colors.info};color:#fff;padding:8px 12px;border-radius:6px;` +
      'font:13px/1.4 system-ui,sans-serif;max-width:360px;word-break:break-all;' +
      'box-shadow:0 4px 12px rgba(0,0,0,.3);opacity:0;transition:opacity .2s;';
    toastBox.appendChild(el);
    requestAnimationFrame(() => (el.style.opacity = '1'));
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, ms);
  }

  // ---------- Helpers ----------
  function fileNameFor(url) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      const last = parts[parts.length - 1] || '';
      // github.com/<owner>/<repo>/archive/refs/(heads|tags)/<ref>.zip -> <repo>-<ref>.zip
      const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/archive\/(?:refs\/(?:heads|tags)\/)?(.+)$/);
      if (m) return `${decodeURIComponent(m[2])}-${decodeURIComponent(m[3]).replace(/\//g, '-')}`;
      return last;
    } catch (e) {
      return '';
    }
  }

  function rpc(method, extraParams, cb) {
    const params = [];
    if (get('secret')) params.push('token:' + get('secret'));
    params.push(...extraParams);
    GM_xmlhttpRequest({
      method: 'POST',
      url: get('rpcUrl'),
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random().toString(36).slice(2, 10),
        method,
        params,
      }),
      timeout: 15000,
      onload: (res) => {
        try {
          const body = JSON.parse(res.responseText);
          if (body.error) cb(new Error(body.error.message || 'RPC error'));
          else cb(null, body.result);
        } catch (e) {
          cb(new Error(`Bad response (HTTP ${res.status})`));
        }
      },
      onerror: () => cb(new Error('Cannot reach aria2 RPC')),
      ontimeout: () => cb(new Error('aria2 RPC timed out')),
    });
  }

  // Programmatic normal download, bypassing our own interceptor
  let bypass = false;
  function browserDownload(url) {
    bypass = true;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.click();
    } finally {
      bypass = false;
    }
  }

  // Avoid double-sends from rapid repeated clicks
  const recent = new Map();

  function send(url) {
    const now = Date.now();
    if (recent.get(url) > now - 1500) return;
    recent.set(url, now);

    const name = fileNameFor(url);
    const options = {};
    if (name) options.out = name;
    if (get('dir')) options.dir = get('dir');

    rpc('aria2.addUri', [[url], options], (err) => {
      if (!err) return toast(`Sent to aria2: ${name || url}`, 'ok');
      if (get('fallback')) {
        toast(`aria2 failed (${err.message}). Downloading in browser.`, 'error', 5000);
        browserDownload(url);
      } else {
        toast(`aria2 error: ${err.message}`, 'error', 5000);
      }
    });
  }

  // ---------- Click interception (delegated, survives Turbo/pjax navigation) ----------
  function onClick(ev) {
    if (bypass || !get('enabled')) return;
    if (ev.type === 'click' && ev.button !== 0) return;
    if (ev.type === 'auxclick' && ev.button !== 1) return; // middle-click
    if (ev.altKey) return; // Alt+click = normal browser download

    const a = ev.composedPath().find((n) => n && n.tagName === 'A' && n.href);
    if (!a || !isFileLink(a.href)) return;

    ev.preventDefault();
    ev.stopImmediatePropagation();
    send(a.href);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  // ---------- Menu commands ----------
  const ask = (label, key) => () => {
    const v = prompt(label, get(key));
    if (v !== null) { set(key, v.trim()); toast('Saved', 'ok', 2000); }
  };
  const flip = (label, key) => () => {
    set(key, !get(key));
    toast(`${label}: ${get(key) ? 'ON' : 'OFF'}`, 'info', 2000);
  };

  GM_registerMenuCommand('Toggle aria2 interception', flip('Interception', 'enabled'));
  GM_registerMenuCommand('Set RPC URL', ask('aria2 RPC URL (include /jsonrpc):', 'rpcUrl'));
  GM_registerMenuCommand('Set RPC secret', ask('aria2 RPC secret (blank for none):', 'secret'));
  GM_registerMenuCommand('Set download directory', ask('Download directory (blank = aria2 default):', 'dir'));
  GM_registerMenuCommand('Toggle intercepting /raw/ links', flip('Raw links', 'interceptRaw'));
  GM_registerMenuCommand('Toggle browser fallback on error', flip('Fallback', 'fallback'));
  GM_registerMenuCommand('Test aria2 connection', () =>
    rpc('aria2.getVersion', [], (err, r) =>
      err ? toast(`Test failed: ${err.message}`, 'error', 5000)
          : toast(`Connected: aria2 ${r.version}`, 'ok')));
})();