(function ($) {
    'use strict';
    let adsIn = [];
    let ads = () =>{
        return {
            init: async ()=>{
                let response = await fetch(__ADS_URL);
                let ads = await response.json();
                let data = await ads.data;
                data.forEach( (ad) =>{
                    localStorage.setItem(ad.id, JSON.stringify(ad));
                    adsIn.push(ad.id);
                });
            }
        }
    }
    let relatedPost = ()=>{
        // 
    }

    $(document).ready(()=>{
        // fetch json ads
        ads().init();
        // populate related posts
        // populate popup
    })

})(jQuery);