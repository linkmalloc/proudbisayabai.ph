(function() {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUqNk05hNr07J0Ik4otWAwD6VwM_Ahg_zYRnC9Ip4WIvfivmrbVhQlf-kGxxOf3XpUMtn7zvvBF7XA/pub?output=csv";
    const isMobile = window.innerWidth < 768;
    const cacheBuster = new Date().getTime();
    const adQueues = { desktop_top: [], mobile_sticky: [], mid_article: [], mid_article_native: [], mid_article_square: []  };

    // 1. GA4 TRACKING HELPER (Fixed for Realtime)
    function logGA4(action, pbb) {
        const eventName = 'pbb_' + action;
        const params = {
            'pbb_id': pbb.id,
            'pbb_tier': pbb.tier,
            'pbb_link': pbb.link,
            'non_interaction': action === 'impression' ? true : false // Tells GA4 impressions are passive
        };

        // Check if gtag exists, otherwise push to dataLayer directly
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
            console.log(`GA4 Tracked: ${eventName}`, params);
        } else if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': eventName,
                ...params
            });
            console.log(`DataLayer Tracked: ${eventName}`, params);
        } else {
            console.warn("GA4 (gtag) not found. Tracking failed.");
        }
    }

    // 2. STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        .site-ad { overflow: hidden; background: #f4f4f4; text-align: center; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-family: sans-serif; position: relative; border-radius: 4px; box-sizing: border-box; }
        body.ad-active { padding-bottom: 75px !important; }
        .mobile-sticky-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 55px; z-index: 9999; background: #fff; box-shadow: 0 -2px 15px rgba(0,0,0,0.15); margin: 0 !important; border-radius: 0; }
        .desktop-top-unit { width: 95%; max-width: 728px; min-height: 90px; height: auto; aspect-ratio: 728 / 90; margin: 15px auto !important; display: flex !important; }
        .mid-article-native-unit { width: 100%; max-width: 320px; min-height: 100px; }
        .mid-article-square-unit { width: 300px; height: 250px; margin: 20px auto; }
        .site-ad img { max-width: 100%; height: 100%; object-fit: contain; display: block; }
        .ad-close-btn { position: absolute; top: -22px; right: 5px; background: #333; color: #fff; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 22px; border: 2px solid white; font-weight: bold; z-index: 10001; }
        .timer-glow { position: absolute; inset: 0; z-index: 10000; pointer-events: none; }
        .timer-glow::before {
            content: ""; position: absolute; inset: 0; padding: 4px; 
            background: var(--glow-color, #c0c0c0);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out; mask-composite: exclude;
            animation: clockwise-wipe linear forwards; animation-duration: inherit;
        }
        @keyframes clockwise-wipe {
            0% { clip-path: polygon(50% 50%, 50% 0%, 50% 0%, 50% 0%, 50% 0%, 50% 0%); }
            12.5% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 0%, 100% 0%, 100% 0%); }
            37.5% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 100% 100%, 100% 100%); }
            62.5% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%); }
            87.5% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%); }
            100% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%); }
        }
        .tier-platinum { --glow-color: #e5e4e2; filter: drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 2px #c0c0c0); }
        .tier-gold { --glow-color: #ffd700; filter: drop-shadow(0 0 6px #ffd700); }
    `;
    document.head.appendChild(style);

    // 3. FETCH DATA
    fetch(`${csvUrl}&t=${cacheBuster}`)
        .then(res => res.text())
        .then(data => {
            const rows = data.split(/\r?\n/).slice(1);
            rows.forEach(row => {
                const parts = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                if (!parts || parts.length < 4) return;
                const ad = {
                    id: parts[0].replace(/^"|"$/g, '').trim(),
                    content: parts[1].replace(/^"|"$/g, '').trim(),
                    link: parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : '',
                    active: parts[3] ? parts[3].trim().toUpperCase() : 'FALSE',
                    tier: parts[4] ? parts[4].trim().toLowerCase() : 'gold',
                    duration: parts[5] ? parseInt(parts[5].trim()) * 1000 : 5000 
                };
                if (ad.active === 'TRUE' && adQueues[ad.id]) adQueues[ad.id].push(ad);
            });
            Object.keys(adQueues).forEach(id => startRotation(id));
        });

    function startRotation(placementId, index = 0) {
        const queue = adQueues[placementId];
        if (!queue || queue.length === 0) return;
        if (index >= queue.length) index = 0;
        
        const currentAd = queue[index];
        const duration = currentAd.duration;
        let container = document.getElementById('wrapper-' + placementId);
        if (!container) container = createContainer(placementId);

        // Track Impression
        logGA4('impression', currentAd);

        const isImage = currentAd.content.toLowerCase().includes('http') && (currentAd.content.match(/\.(jpg|png|webp|gif)/));
        let contentHtml = isImage ? `<a href="${currentAd.link}" target="_blank" class="ad-link-trigger"><img src="${currentAd.content}"></a>` : currentAd.content;

        const timerHtml = (placementId === 'desktop_top' || placementId === 'mobile_sticky') 
            ? `<div class="timer-glow tier-${currentAd.tier}" style="animation-duration: ${duration}ms"></div>` 
            : '';

        container.innerHTML = (placementId === 'mobile_sticky' ? `<div class="ad-close-btn" onclick="this.parentElement.remove(); document.body.classList.remove('ad-active');">×</div>` : '') + 
                              timerHtml + contentHtml;

        const link = container.querySelector('.ad-link-trigger');
        if (link) {
            link.addEventListener('click', () => logGA4('click', currentAd));
        }

        setTimeout(() => {
            if (document.body.contains(container)) startRotation(placementId, index + 1);
        }, duration);
    }

    function createContainer(id) {
        const el = document.createElement('div');
        el.id = 'wrapper-' + id;
        el.className = 'site-ad';

        const article = document.querySelector('.entry-content') || document.querySelector('article');
        const paragraphs = article ? article.querySelectorAll('p') : [];

        if (id === 'mobile_sticky' && isMobile) {
            el.classList.add('mobile-sticky-footer');
            document.body.appendChild(el);
            document.body.classList.add('ad-active');
        } else if (id === 'desktop_top') {
            // Apply Responsive Class
            el.className += ' desktop-top-unit';
            const header = document.querySelector('header') || document.body;
            header.append(el);
        } else if (id === 'mid_article') {
            if (paragraphs[1]) { el.style.width = '100%'; paragraphs[1].after(el); }
        } 
        // NEW PLACEMENT LOGIC
        else if (id === 'mid_article_native') {
            el.className += ' mid-article-native-unit';
            // Places it after the 4th paragraph for better spacing
            if (paragraphs[3]) { paragraphs[3].after(el); } 
            else if (paragraphs[0]) { paragraphs[0].after(el); }
        } else if (id === 'mid_article_square') {
            el.className += ' mid-article-square-unit';
            // Places it deeper in the article (after 7th paragraph)
            if (paragraphs[6]) { paragraphs[6].after(el); }
        }
        return el;
    }
})();