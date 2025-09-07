#### "Add Keepa Floating Button.user.js" [![Install directly with a userscript manager](https://img.shields.io/badge/install-userscript-brightgreen)](https://github.com/oshirinap/myuserscripts/raw/main/Add%20Keepa%20Floating%20Button.user.js)
 Greasemonkey/Tampermonkey userscript that add a floating Keepa price history button to Amazon product pages. Japan, UK, US supported.
#### "YouTube URL Normalizer.user.js" [![Install directly with a userscript manager](https://img.shields.io/badge/install-userscript-brightgreen)](https://github.com/oshirinap/myuserscripts/raw/main/YouTube%20URL%20Normalizer.user.js)
 Greasemonkey/Tampermonkey userscript that normalizes any YouTube _[VIDEO_URL]_ into the canonical _https://www.youtube.com/watch?v=[VIDEO_ID]_ format. Works on **outside** of YouTube.
 1. If matches regex: `(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})`
 2. Redirects navigation in the browser (window location).
 3. Rewrites URLs in AJAX requests (XMLHttpRequest and fetch).
 4. Rewrites \<A\> tags too, very aggressive behavior.
#### "Sets hideBrowserUpgradeBox cookie on YouTube.user.js" [![Install directly with a userscript manager](https://img.shields.io/badge/install-userscript-brightgreen)](https://github.com/oshirinap/myuserscripts/raw/main/Sets%20hideBrowserUpgradeBox%20cookie%20on%20YouTube.user.js)
 Greasemonkey/Tampermonkey userscript, especially **for non-supported browsers** by YouTube. Sets the _hideBrowserUpgradeBox=true_ cookie on _.youtube.com_ to supress 
_"https://www.youtube.com/supported_browsers?next_url=[VIDEO_URL]"_ nags.
 Also, automatically redirects to the _[VIDEO_URL]_. It may useful if you frequently delete cookies.
#### License
This repository is licensed under the [MIT License](LICENSE).
Feel free to use, modify, and redistribute. No warranty is provided.
