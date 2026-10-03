// Post view tracking: reports one view per post per browser session to Metamix.
// Loaded only on post pages; the post is identified by the script tag's
// data-post-id (pbb_post_id frontmatter) and data-slug (e.g. "_posts/2026-10-03-foo.md").
(function () {
  var script = document.currentScript;
  if (!script) return;

  var postId = parseInt(script.getAttribute('data-post-id'), 10) || null;
  var slug = script.getAttribute('data-slug') || null;
  if (!postId && !slug) return;

  // Skip automated browsers and crawlers that execute JS.
  if (navigator.webdriver || /bot|crawl|spider|slurp|facebookexternalhit|lighthouse/i.test(navigator.userAgent)) return;

  var h = window.location.hostname;
  var API_BASE = window.API_BASE || (
    h.includes('localhost') || h.includes('pbb.local') || h.startsWith('192.168.')
      ? 'http://localhost:3000'
      : 'https://metamix.app'
  );
  var ENDPOINT = API_BASE + '/api/v1/post_views';

  var SESSION_KEY = 'pbb_viewed_' + (postId || slug);
  var VISITOR_KEY = 'pbb_visitor_id';

  function storageGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function storageSet(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) {}
  }

  // Anonymous per-browser id so the backend can compute unique_views.
  function visitorId() {
    var id = storageGet('localStorage', VISITOR_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
      storageSet('localStorage', VISITOR_KEY, id);
    }
    return id;
  }

  function send() {
    // Count each post once per session so reloads don't inflate views.
    if (storageGet('sessionStorage', SESSION_KEY)) return;
    storageSet('sessionStorage', SESSION_KEY, '1');

    var payload = JSON.stringify({
      pbb_post_id: postId,
      slug: slug,
      visitor_id: visitorId(),
      referrer: document.referrer || null
    });

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

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
