// Post view tracking: reports one view per post per browser session to Metamix
// (POST /api/v1/post_views) and shows the live count in the post meta
// (GET /api/v1/post_views?ids=). Loaded only on post pages; the post is identified by the
// script tag's data-post-id (pbb_post_id frontmatter) and data-path
// (e.g. "_posts/2026-10-03-foo.md"). Unique visitors are worked out server-side.
(function () {
  var script = document.currentScript;
  if (!script) return;

  var postId = parseInt(script.getAttribute('data-post-id'), 10) || null;
  var path = script.getAttribute('data-path') || null;
  if (!postId && !path) return;

  // Skip automated browsers and crawlers that execute JS.
  if (navigator.webdriver || /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse/i.test(navigator.userAgent)) return;

  var h = window.location.hostname;
  var API_BASE = window.API_BASE || (
    h.includes('localhost') || h.includes('pbb.local') || h.startsWith('192.168.')
      ? 'http://localhost:3000'
      : 'https://metamix.app'
  );
  var ENDPOINT = API_BASE + '/api/v1/post_views';
  var SESSION_KEY = 'pbb_viewed_' + (postId || path);

  function alreadyCounted() {
    try { return !!sessionStorage.getItem(SESSION_KEY); } catch (e) { return false; }
  }
  function markCounted() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
  }

  function send() {
    // Count each post once per session so reloads don't inflate views.
    if (alreadyCounted()) return;
    markCounted();

    // text/plain keeps this a CORS "simple" request, so no preflight is needed.
    var body = JSON.stringify({ post_id: postId, path: path });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: body,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

  // Replace the frontmatter view count in the post meta with the live count.
  // Only posts with a pbb_post_id can be looked up; others keep the frontmatter value.
  function showCount() {
    var el = document.getElementById('post-view-count');
    if (!el || !postId) return;
    fetch(ENDPOINT + '?ids=' + postId, { credentials: 'omit' })
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (counts) {
        var count = parseInt(counts[postId], 10);
        if (isNaN(count)) return;
        el.textContent = ' ' + (count < 100 ? '100+' : count.toLocaleString('en-US')) + ' views';
      })
      .catch(function () {});
  }
  showCount();

  // Wait until the page is actually visible (skips prerendered and background tabs
  // that are never opened).
  if (document.visibilityState === 'visible') {
    send();
  } else {
    document.addEventListener('visibilitychange', function onVisible() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      send();
    });
  }
})();
