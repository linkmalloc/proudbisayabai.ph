(function () {
  const STORAGE_KEY = 'pbb_admin_tutorial_v1_done';

  function isCompleted() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  }
  function markCompleted() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }
  function clearCompleted() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function isMobile() { return window.innerWidth < 768; }

  function visibleElement(selector) {
    const els = document.querySelectorAll(selector);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
    return null;
  }

  function waitForElement(selector, timeout = 4000) {
    return new Promise(resolve => {
      const start = Date.now();
      (function poll() {
        const el = visibleElement(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeout) return resolve(null);
        setTimeout(poll, 100);
      })();
    });
  }

  function injectStyles() {
    if (document.getElementById('pbb-tour-styles')) return;
    const s = document.createElement('style');
    s.id = 'pbb-tour-styles';
    s.textContent = `
      #pbb-tour-spot {
        position: fixed; pointer-events: none; border-radius: 10px;
        box-shadow: 0 0 0 9999px rgba(15,23,42,0.55), 0 0 0 3px #f97316;
        z-index: 99998; opacity: 0;
        transition: top .25s ease, left .25s ease, width .25s ease, height .25s ease, opacity .2s;
      }
      #pbb-tour-spot.visible { opacity: 1; }
      #pbb-tour-spot.centered { box-shadow: 0 0 0 9999px rgba(15,23,42,0.7); }
      #pbb-tour-tip {
        position: fixed; z-index: 99999; background: #fff; border-radius: 12px;
        box-shadow: 0 20px 40px -10px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.05);
        padding: 16px 18px; width: 340px; max-width: calc(100vw - 24px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1f2937; opacity: 0;
        transition: top .25s ease, left .25s ease, opacity .2s;
      }
      #pbb-tour-tip.visible { opacity: 1; }
      #pbb-tour-tip h4 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #111827; }
      #pbb-tour-tip p { font-size: 13px; line-height: 1.55; margin: 0 0 14px; color: #4b5563; }
      #pbb-tour-tip p strong { color: #111827; font-weight: 600; }
      #pbb-tour-tip .pbb-tour-bar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      #pbb-tour-tip .pbb-tour-progress { font-size: 11px; color: #9ca3af; font-weight: 500; }
      #pbb-tour-tip .pbb-tour-btns { display:flex; gap:6px; align-items: center; }
      #pbb-tour-tip button { font: inherit; cursor: pointer; border: none; padding: 7px 14px;
        border-radius: 8px; font-size: 12px; font-weight: 500; transition: background .15s, opacity .15s, transform .1s; }
      #pbb-tour-tip button:active { transform: scale(.96); }
      #pbb-tour-tip .pbb-tour-skip { background: transparent; color: #9ca3af; padding: 7px 10px; }
      #pbb-tour-tip .pbb-tour-skip:hover { color: #4b5563; }
      #pbb-tour-tip .pbb-tour-back { background: #f3f4f6; color: #4b5563; }
      #pbb-tour-tip .pbb-tour-back:hover { background: #e5e7eb; }
      #pbb-tour-tip .pbb-tour-next { background: linear-gradient(135deg,#f95c00,#ff7a1a); color:#fff; box-shadow: 0 4px 10px -2px rgba(249,92,0,.4); }
      #pbb-tour-tip .pbb-tour-next:hover { background: linear-gradient(135deg,#e04900,#f95c00); }
      #pbb-tour-tip .pbb-tour-hint { font-size: 11px; color: #f97316; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
      #pbb-tour-tip .pbb-tour-hint::before { content: '👆'; }
      #pbb-tour-help {
        position: fixed; bottom: 20px; right: 20px; z-index: 9997;
        width: 44px; height: 44px; border-radius: 50%;
        background: linear-gradient(135deg, #f95c00, #ff7a1a);
        color: white; border: none; box-shadow: 0 8px 20px -4px rgba(249,92,0,.5);
        font-size: 22px; font-weight: 700; cursor: pointer; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        transition: transform .15s ease, box-shadow .15s ease;
      }
      #pbb-tour-help:hover { transform: scale(1.08); box-shadow: 0 12px 28px -4px rgba(249,92,0,.6); }
      #pbb-tour-help:active { transform: scale(0.95); }
      @media (max-width: 767px) {
        #pbb-tour-tip { width: calc(100vw - 24px); padding: 14px 16px; }
        #pbb-tour-help { bottom: 14px; right: 14px; }
      }
    `;
    document.head.appendChild(s);
  }

  class Tour {
    constructor(steps, opts = {}) {
      this.steps = steps;
      this.opts = opts;
      this.idx = -1;
      this.spot = null;
      this.tip = null;
      this.stepClickHandler = null;
      this._resizeFn = null;
      this._scrollFn = null;
    }

    start() {
      injectStyles();
      this._build();
      this._showStep(0);
    }

    _build() {
      this.spot = document.createElement('div');
      this.spot.id = 'pbb-tour-spot';
      document.body.appendChild(this.spot);

      this.tip = document.createElement('div');
      this.tip.id = 'pbb-tour-tip';
      document.body.appendChild(this.tip);

      this._resizeFn = () => this._reposition();
      this._scrollFn = () => this._reposition();
      window.addEventListener('resize', this._resizeFn);
      window.addEventListener('scroll', this._scrollFn, true);
    }

    async _showStep(i) {
      this._clearStepHandlers();

      if (i < 0 || i >= this.steps.length) return this.finish(false);
      this.idx = i;
      const step = this.steps[i];

      if (step.beforeStep) {
        try { await step.beforeStep(); } catch (e) { console.warn('tour beforeStep failed', e); }
      }

      let el = null;
      if (step.selector) {
        el = await waitForElement(step.selector, step.waitTimeout || 4000);
        if (!el && step.skipIfMissing !== false) {
          return this._showStep(i + 1);
        }
      }
      this.currentEl = el;

      if (el) {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch {}
        await wait(350);
      }

      this._render(step, el);

      if (step.advanceOn === 'click' && el) {
        const handler = () => { setTimeout(() => this.next(), 120); };
        el.addEventListener('click', handler, { once: true });
        this.stepClickHandler = { el, handler };
      }
    }

    _clearStepHandlers() {
      if (this.stepClickHandler) {
        try { this.stepClickHandler.el.removeEventListener('click', this.stepClickHandler.handler); } catch {}
        this.stepClickHandler = null;
      }
    }

    _reposition() {
      if (this.idx < 0 || this.idx >= this.steps.length) return;
      this._render(this.steps[this.idx], this.currentEl, true);
    }

    _render(step, el, repositionOnly) {
      const margin = 8;
      const tipMargin = 12;

      if (el) {
        const r = el.getBoundingClientRect();
        this.spot.classList.remove('centered');
        this.spot.style.top = (r.top - margin) + 'px';
        this.spot.style.left = (r.left - margin) + 'px';
        this.spot.style.width = (r.width + margin * 2) + 'px';
        this.spot.style.height = (r.height + margin * 2) + 'px';
      } else {
        this.spot.classList.add('centered');
        this.spot.style.top = '50%';
        this.spot.style.left = '50%';
        this.spot.style.width = '0px';
        this.spot.style.height = '0px';
      }
      this.spot.classList.add('visible');

      if (!repositionOnly) {
        const isFirst = this.idx === 0;
        const isLast = this.idx === this.steps.length - 1;
        const nextLabel = step.nextLabel || (isLast ? 'Got it' : 'Next');
        const showBack = !isFirst && step.showBack !== false;
        const showNext = step.advanceOn !== 'click';
        const clickHint = step.advanceOn === 'click';
        this.tip.innerHTML = `
          <h4>${step.title || ''}</h4>
          <p>${step.body || ''}</p>
          <div class="pbb-tour-bar">
            <span class="pbb-tour-progress">${this.idx + 1} / ${this.steps.length}</span>
            <div class="pbb-tour-btns">
              ${clickHint ? '<span class="pbb-tour-hint">Click to continue</span>' : ''}
              ${!isLast && !clickHint ? '<button class="pbb-tour-skip" data-act="skip">Skip</button>' : ''}
              ${!isLast && clickHint ? '<button class="pbb-tour-skip" data-act="skip">Skip tour</button>' : ''}
              ${showBack ? '<button class="pbb-tour-back" data-act="back">Back</button>' : ''}
              ${showNext ? `<button class="pbb-tour-next" data-act="next">${nextLabel}</button>` : ''}
            </div>
          </div>
        `;
        this.tip.querySelectorAll('button').forEach(b => {
          b.addEventListener('click', () => {
            const act = b.dataset.act;
            if (act === 'next') this.next();
            else if (act === 'back') this.prev();
            else if (act === 'skip') this.skip();
          });
        });
      }

      const tipW = this.tip.offsetWidth || 340;
      const tipH = this.tip.offsetHeight || 150;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top, left;
      if (el) {
        const r = el.getBoundingClientRect();
        const placement = step.placement || 'auto';
        const fitsBelow = r.bottom + tipMargin + tipH < vh;
        const fitsAbove = r.top - tipMargin - tipH > 0;
        if (placement === 'top' || (placement === 'auto' && !fitsBelow && fitsAbove)) {
          top = r.top - tipMargin - tipH;
        } else if (placement === 'bottom' || (placement === 'auto' && fitsBelow)) {
          top = r.bottom + tipMargin;
        } else {
          top = Math.max(12, vh - tipH - 12);
        }
        left = r.left + r.width / 2 - tipW / 2;
      } else {
        top = vh / 2 - tipH / 2;
        left = vw / 2 - tipW / 2;
      }
      left = Math.max(12, Math.min(left, vw - tipW - 12));
      top = Math.max(12, Math.min(top, vh - tipH - 12));

      this.tip.style.top = top + 'px';
      this.tip.style.left = left + 'px';
      this.tip.classList.add('visible');
    }

    next() { this._showStep(this.idx + 1); }
    prev() { this._showStep(Math.max(0, this.idx - 1)); }
    skip() { this.finish(true); }

    finish(skipped) {
      this._clearStepHandlers();
      if (this._resizeFn) window.removeEventListener('resize', this._resizeFn);
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn, true);
      if (this.spot) this.spot.remove();
      if (this.tip) this.tip.remove();
      Tour._running = false;
      if (this.opts.onFinish) this.opts.onFinish(skipped);
    }
  }
  Tour._running = false;

  async function showMetaTab(name) {
    if (isMobile()) {
      const btn = visibleElement('[data-tut="mobile-step-1"]');
      if (btn) btn.click();
    } else {
      const btn = visibleElement(`[data-tut="meta-tab-${name}"]`);
      if (btn) btn.click();
    }
    await wait(220);
  }

  async function showBodyEditor() {
    if (isMobile()) {
      const btn = visibleElement('[data-tut="mobile-step-2"]');
      if (btn) btn.click();
      await wait(220);
    }
  }

  const dashboardSteps = [
    {
      title: 'Welcome to your dashboard 👋',
      body: `We'll walk you through creating your first post — about a minute. You can <strong>Skip</strong> anytime, or replay this tour later from the <strong>?</strong> button in the corner.`,
    },
    {
      title: 'Your posts live here',
      body: 'Use the sidebar to switch between <strong>All Posts</strong> and <strong>Archived Posts</strong>.',
      selector: '[data-tut="sidebar"]',
      placement: 'auto',
      skipIfMissing: true,
    },
    {
      title: 'Find what you need',
      body: 'Search your existing posts by title or keyword.',
      selector: '[data-tut="search"]',
      placement: 'auto',
      skipIfMissing: true,
    },
    {
      title: 'Create your first post',
      body: 'Tap <strong>New Article</strong> to open a fresh draft. We\'ll guide you through the editor next.',
      selector: '[data-tut="create-btn"]',
      advanceOn: 'click',
      placement: 'auto',
    },
  ];

  function editorSteps() {
    return [
      {
        title: 'This is the editor',
        body: 'A blank draft has been created. Let\'s walk through the fields you\'ll fill in.',
        selector: '[data-tut="editor-drawer"]',
        placement: 'auto',
        beforeStep: async () => { await wait(300); await showMetaTab('metadata'); },
      },
      {
        title: 'Headline',
        body: 'Type a clear, catchy title for your article.',
        selector: '[data-tut="title"]',
        placement: 'auto',
        beforeStep: async () => { await showMetaTab('metadata'); },
      },
      {
        title: 'Description',
        body: 'A 1–2 sentence summary. This is what readers see in social previews and search results.',
        selector: '[data-tut="description"]',
        placement: 'auto',
      },
      {
        title: 'Author',
        body: 'Who wrote this article? Pick from suggestions or type a new name.',
        selector: '[data-tut="author"]',
        placement: 'auto',
      },
      {
        title: 'Pick a category',
        body: 'Choose where this post belongs — destinations, food, brand, etc.',
        selector: '[data-tut="category"]',
        placement: 'auto',
        beforeStep: async () => { await showMetaTab('seo'); },
      },
      {
        title: 'Add tags',
        body: 'Comma- or Enter-separated keywords. Tags help readers and search engines find related content.',
        selector: '[data-tut="tags"]',
        placement: 'auto',
      },
      {
        title: 'Set a feature image',
        body: 'Click to upload, paste a URL, or drag an image in. This shows on the home page and social shares.',
        selector: '[data-tut="feature-image"]',
        placement: 'auto',
        beforeStep: async () => { await showMetaTab('images'); },
      },
      {
        title: 'Write your article',
        body: 'Use the rich editor (or switch to <strong>Markdown</strong> if you prefer). Drag uploaded images straight into the text.',
        selector: '#quill-editor',
        placement: 'top',
        beforeStep: async () => { await showBodyEditor(); },
      },
      {
        title: 'AI can help',
        body: 'Once you\'ve drafted at least 50 words, click here to auto-generate the title, description, and SEO metadata from your content.',
        selector: '[data-tut="ai-gen"]',
        placement: 'auto',
        beforeStep: async () => { if (isMobile()) { const b = visibleElement('[data-tut="mobile-step-1"]'); if (b) b.click(); await wait(220); } await showMetaTab('metadata'); },
      },
      {
        title: 'Save as draft',
        body: 'Saving keeps your work safe without publishing. Come back anytime to keep editing.',
        selector: '[data-tut="save-btn"]',
        placement: 'bottom',
      },
      {
        title: 'Publish when ready',
        body: 'Hit <strong>Publish</strong> to push the post live to proudbisayabai.ph. You can always edit or republish later.',
        selector: '[data-tut="publish-btn"]',
        placement: 'bottom',
      },
      {
        title: 'You\'re all set! 🎉',
        body: 'That\'s everything you need to create a post. The <strong>?</strong> button in the corner replays this tour whenever you want.',
      },
    ];
  }

  let drawerObserver = null;
  function watchForDrawer(cb, timeoutMs = 30000) {
    if (drawerObserver) drawerObserver.disconnect();
    const start = Date.now();
    drawerObserver = new MutationObserver(() => {
      const drawer = visibleElement('[data-tut="editor-drawer"]');
      if (drawer) {
        drawerObserver.disconnect();
        drawerObserver = null;
        cb();
      } else if (Date.now() - start > timeoutMs) {
        drawerObserver.disconnect();
        drawerObserver = null;
      }
    });
    drawerObserver.observe(document.body, { childList: true, subtree: true });
  }

  function startDashboardPhase() {
    if (Tour._running) return;
    Tour._running = true;
    const t = new Tour(dashboardSteps, {
      onFinish: (skipped) => {
        if (skipped) { markCompleted(); return; }
        watchForDrawer(() => {
          setTimeout(() => startEditorPhase(), 450);
        });
      },
    });
    t.start();
  }

  function startEditorPhase() {
    if (Tour._running) return;
    Tour._running = true;
    const t = new Tour(editorSteps(), {
      onFinish: () => { markCompleted(); },
    });
    t.start();
  }

  function startFromAnywhere() {
    if (Tour._running) return;
    const drawerOpen = !!visibleElement('[data-tut="editor-drawer"]');
    if (drawerOpen) startEditorPhase();
    else startDashboardPhase();
  }

  function injectHelpButton() {
    if (document.getElementById('pbb-tour-help')) return;
    const btn = document.createElement('button');
    btn.id = 'pbb-tour-help';
    btn.type = 'button';
    btn.title = 'Replay tutorial';
    btn.setAttribute('aria-label', 'Replay tutorial');
    btn.textContent = '?';
    btn.addEventListener('click', startFromAnywhere);
    document.body.appendChild(btn);
  }

  function init() {
    const start = Date.now();
    const ready = setInterval(() => {
      const sidebar = visibleElement('[data-tut="sidebar"]');
      const createBtn = visibleElement('[data-tut="create-btn"]');
      if (sidebar && createBtn) {
        clearInterval(ready);
        injectHelpButton();
        if (!isCompleted()) setTimeout(() => startDashboardPhase(), 600);
      } else if (Date.now() - start > 15000) {
        clearInterval(ready);
      }
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PBBTour = {
    start: startFromAnywhere,
    reset: () => { clearCompleted(); startFromAnywhere(); },
  };
})();
