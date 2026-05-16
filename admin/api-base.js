(function () {
  const h = window.location.hostname;
  window.API_BASE = h.includes('localhost') || h.includes('pbb.local')
    ? 'http://localhost:3000'
    : h.startsWith('192.168.')
      ? 'http://localhost:3000'
      : 'https://metamix.app';
})();
