"YouTube URL Normalizer.user.js"
Greasemonkey/Tampermonkey userscript that normalizes any YouTube URLs (*) into the canonical https://www.youtube.com/watch?v=[VIDEO_ID] format. Works on outside of YouTube.
1. Redirects navigation in the browser (window location).
2. Rewrites URLs in AJAX requests (XMLHttpRequest and fetch).
* Matches regex (?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})

"Sets hideBrowserUpgradeBox cookie on YouTube.user.js"
Greasemonkey/Tampermonkey userscript especially for outdated browsers. Sets the hideBrowserUpgradeBox=true cookie on .youtube.com to supress "https://www.youtube.com/supported_browsers?next_url=*" nag pages.
Also, automatically redirect to the next_url=[VIDEO_URL].
