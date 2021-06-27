(function ($) {
    'use strict';
    let adsIn = [];
    let ads = () =>{

        let populate =  async (key)=>{
            try{
            let AD = JSON.parse(localStorage.getItem(key));
            if(!!AD){
                $('.sponsor a').attr('href', AD.url )
                $('.sponsor .img').css('background-image', `url (${AD.img} )`);
            }
            
            }catch(e){
                // debugger;
            }

        }

        return {
            init: async ()=>{
                let response = await fetch(__ADS_URL);
                let ads = await response.json();
                let data = await ads.data;
                data.forEach( (ad) =>{
                    localStorage.setItem(ad.id, JSON.stringify(ad));
                    adsIn.push(ad.id);

                    let ADtoShow = localStorage.getItem('ADtoShow');
                    populate(ADtoShow);
                });
            }
        }
    }
    let relatedPost = ()=>{
        // 
    }

    $(window).ready(()=>{
        // fetch json ads
        let ADS = ads();
        localStorage.setItem('ADtoShow','https://cebuhomepages.com/');
        ADS.init();
        

        // populate related posts
        // populate popup
    })

})(jQuery);