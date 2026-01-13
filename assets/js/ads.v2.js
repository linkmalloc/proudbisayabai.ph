(function() {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUqNk05hNr07J0Ik4otWAwD6VwM_Ahg_zYRnC9Ip4WIvfivmrbVhQlf-kGxxOf3XpUMtn7zvvBF7XA/pub?output=csv";
    const isMobile = window.innerWidth < 768;
    const cacheBuster = new Date().getTime();
    const adQueues = { desktop_top: [], mobile_sticky: [], mid_article: [], mid_article_native: [], mid_article_square: [] };

    function logGA4(action, pbb) {
        const eventName = 'pbb_' + action;
        const params = { 'pbb_id': pbb.id, 'pbb_tier': pbb.tier, 'pbb_link': pbb.link, 'non_interaction': action === 'impression' };
        if (typeof gtag === 'function') { gtag('event', eventName, params); }
        else if (typeof dataLayer !== 'undefined') { dataLayer.push({ 'event': eventName, ...params }); }
    }

    const style = document.createElement('style');
    style.innerHTML = `
        .site-ad { overflow: hidden; background: #f4f4f4; text-align: center; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-family: sans-serif; position: relative; border-radius: 4px; box-sizing: border-box; }
        body.ad-active { padding-bottom: 75px !important; }
        .mobile-sticky-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 55px; z-index: 9999; background: #fff; box-shadow: 0 -2px 15px rgba(0,0,0,0.15); margin: 0 !important; border-radius: 0; }
        .desktop-top-unit { width: 95%; max-width: 728px; min-height: 90px; aspect-ratio: 728 / 90; margin: 15px auto !important; }
        .mid-article-native-unit { width: 100%; max-width: 320px; min-height: 120px; }
        .mid-article-square-unit { width: 300px; height: 250px; margin: 20px auto; }
        .site-ad img { max-width: 100%; height: 100%; object-fit: contain; display: block; }
        .ad-close-btn { position: absolute; top: -22px; right: 5px; background: #333; color: #fff; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid white; font-weight: bold; z-index: 10001; text-align:center; line-height:18px; }
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
            100% { clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%); }
        }
        .tier-platinum { --glow-color: #e5e4e2; }
        .tier-gold { --glow-color: #ffd700; }
    `;
    document.head.appendChild(style);

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
            
            Object.keys(adQueues).forEach(id => {
                const queue = adQueues[id];
                if (!queue || queue.length === 0) return;

                if (id === 'mid_article_native' || id === 'mid_article_square') {
                    // Pick 1 random ad and display it statically
                    const randomAd = queue[Math.floor(Math.random() * queue.length)];
                    displayStaticAd(id, randomAd);
                } else {
                    // Start rotation for top and sticky units
                    startRotation(id);
                }
            });
        });

    function displayStaticAd(placementId, ad) {
        let container = document.getElementById('wrapper-' + placementId);
        if (!container) container = createContainer(placementId);

        logGA4('impression', ad);
        const isImage = ad.content.toLowerCase().includes('http') && (ad.content.match(/\.(jpg|png|webp|gif)/));
        const contentHtml = isImage ? `<a href="${ad.link}" target="_blank" class="ad-link-trigger"><img src="${ad.content}"></a>` : ad.content;

        container.innerHTML = contentHtml;
        const link = container.querySelector('.ad-link-trigger');
        if (link) { link.addEventListener('click', () => logGA4('click', ad)); }
    }

    function startRotation(placementId, index = 0) {
        const queue = adQueues[placementId];
        if (!queue || queue.length === 0) return;
        if (index >= queue.length) index = 0;
        
        const currentAd = queue[index];
        let container = document.getElementById('wrapper-' + placementId);
        if (!container) container = createContainer(placementId);

        logGA4('impression', currentAd);
        const isImage = currentAd.content.toLowerCase().includes('http') && (currentAd.content.match(/\.(jpg|png|webp|gif)/));
        let contentHtml = isImage ? `<a href="${currentAd.link}" target="_blank" class="ad-link-trigger"><img src="${currentAd.content}"></a>` : currentAd.content;

        const timerHtml = `<div class="timer-glow tier-${currentAd.tier}" style="animation-duration: ${currentAd.duration}ms"></div>`;

        container.innerHTML = (placementId === 'mobile_sticky' ? `<div class="ad-close-btn" onclick="this.parentElement.remove(); document.body.classList.remove('ad-active');">×</div>` : '') + 
                              timerHtml + contentHtml;

        const link = container.querySelector('.ad-link-trigger');
        if (link) { link.addEventListener('click', () => logGA4('click', currentAd)); }

        setTimeout(() => {
            if (document.body.contains(container)) startRotation(placementId, index + 1);
        }, currentAd.duration);
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
            el.classList.add('desktop-top-unit');
            (document.querySelector('header') || document.body).append(el);
        } else if (id === 'mid_article_native') {
            el.classList.add('mid-article-native-unit');
            if (paragraphs[3]) paragraphs[3].after(el);
        } else if (id === 'mid_article_square') {
            el.classList.add('mid-article-square-unit');
            if (paragraphs[6]) paragraphs[6].after(el);
        }
        return el;
    }
})();