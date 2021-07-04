
  (function (d,aff) {

      var imgs = document.querySelectorAll('main img.lazyloaded');
      var h5s = document.querySelectorAll('main h5');

      aff.forEach(function(e,index,arr){
        var a = document.createElement('a');
        a.href = e.url;
        var i = document.createElement('img');
        i.src = e.img;
        i.classList.add('has-border', 'p-2', 'hover-up', 'transition-normal', 'border-radius-5');
        a.appendChild(i);

        var c = index+1;
        if( index < imgs.length ){
            document.querySelectorAll('main img.lazyloaded')[c].parentNode.appendChild(a);
        }else{
            h5s[0].insertBefore(a,h5s[0].childNode)
        }
        
      });
      
    })(document, 
        [
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
            {
                "url": 'https://wise.prf.hn/click/camref:1100ljx9B/creativeref:1011l34316',
                "img": 'https://wise-creative.prf.hn/source/camref:1100ljx9B/creativeref:1011l34316'
            },
        ]);
