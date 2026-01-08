(function() {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUqNk05hNr07J0Ik4otWAwD6VwM_Ahg_zYRnC9Ip4WIvfivmrbVhQlf-kGxxOf3XpUMtn7zvvBF7XA/pub?output=csv";
    const isMobile = window.innerWidth < 768;
    const cacheBuster = new Date().getTime();

    const style = document.createElement('style');
    style.innerHTML = `
        .site-ad { overflow: hidden; background: #f4f4f4; text-align: center; margin: 20px auto; display: flex; align-items: center; justify-content: center; border: 1px dashed #bbb; font-family: sans-serif; color: #888; position: relative; }
        body.ad-active { padding-bottom: 60px !important; }
        .mobile-sticky-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 50px; z-index: 9999; background: #ffffff; border: none !important; border-top: 1px solid #ddd !important; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); margin: 0 !important; }
        .site-ad img { max-width: 100%; height: auto; display: block; }
        .ad-close-btn { position: absolute; top: -20px; right: 5px; background: #333; color: #fff; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 20px; border: 1px solid white; font-weight: bold; z-index: 10001; }
    `;
    document.head.appendChild(style);

    fetch(`${csvUrl}&t=${cacheBuster}`)
        .then(res => res.text())
        .then(data => {
            const rows = data.split(/\r?\n/).slice(1);
            rows.forEach(row => {
                // NEW PARSER: Splits by comma but preserves everything inside quotes perfectly
                const parts = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                if (!parts || parts.length < 3) return;

                const id = parts[0].replace(/^"|"$/g, '').trim();
                const content = parts[1].replace(/^"|"$/g, '').trim();
                const link = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : '';
                const active = parts[3] ? parts[3].replace(/^"|"$/g, '').trim() : '';

                if (active.toUpperCase() === 'TRUE') {
                    deployAd(id, content, link);
                }
            });
        });

    function deployAd(id, content, link) {
        // Detects if content is an S3 URL or just HTML
        const isImage = content.toLowerCase().includes('http') && 
                       (content.includes('.jpg') || content.includes('.png') || content.includes('.webp') || content.includes('.gif'));
        
        const adMarkup = isImage ? `<a href="${link}" target="_blank"><img src="${content}"></a>` : content;

        if (id === 'mobile_sticky' && isMobile) {
            const container = document.createElement('div');
            container.className = 'site-ad mobile-sticky-footer';
            container.innerHTML = `<div class="ad-close-btn" onclick="this.parentElement.remove(); document.body.classList.remove('ad-active');">×</div>` + adMarkup;
            document.body.appendChild(container);
            document.body.classList.add('ad-active');
        }
        else if (id === 'desktop_top' && !isMobile) {
            const container = document.createElement('div');
            container.className = 'site-ad';
            container.style.width = '728px';
            container.style.height = '90px';
            container.innerHTML = adMarkup;
            document.body.prepend(container);
        }
        else if (id === 'mid_article') {
            const article = document.querySelector('.entry-content') || document.querySelector('article');
            if (article) {
                const p = article.querySelectorAll('p')[1]; // After 2nd paragraph
                if (p) {
                    const container = document.createElement('div');
                    container.className = 'site-ad';
                    container.style.width = '100%';
                    container.style.minHeight = '100px';
                    container.innerHTML = adMarkup;
                    p.after(container);
                }
            }
        }
    }
})();