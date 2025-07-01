### "YouTube URL Normalizer.user.js"
 Greasemonkey/Tampermonkey userscript that normalizes any YouTube URLs into the canonical _https://www.youtube.com/watch?v=[VIDEO_ID]_ format. Works on **outside** of YouTube.
 1. Matches regex _/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/_
 2. Redirects navigation in the browser (window location).
 3. Rewrites URLs in AJAX requests (XMLHttpRequest and fetch).

### "Sets hideBrowserUpgradeBox cookie on YouTube.user.js"
 Greasemonkey/Tampermonkey userscript, **especially for outdated browsers**. Sets the _hideBrowserUpgradeBox=true_ cookie on _.youtube.com_ to supress 
_"https://www.youtube.com/supported_browsers?next_url="_ nag pages.
 Also, automatically redirect to the _next_url=[VIDEO_URL]_.
