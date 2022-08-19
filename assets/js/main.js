jQuery.fn.isMobile = () => {
    var isMobile = false; //initiate as false
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        isMobile = true;
    }

    return isMobile;
}

(function ($) {
    'use strict';

    // Page loading
    $(window).on('load', function () {
        $('.preloader').delay(450).fadeOut('slow');
    });

    // Scroll progress
    var scrollProgress = function () {
        var docHeight = $(document).height(),
            windowHeight = $(window).height(),
            scrollPercent;
        $(window).on('scroll', function () {
            scrollPercent = $(window).scrollTop() / (docHeight - windowHeight) * 100;
            $('.scroll-progress').width(scrollPercent + '%');
        });
    };

    // Off canvas sidebar
    var OffCanvas = function () {
        $('#off-canvas-toggle').on('click', function () {
            $('body').toggleClass("canvas-opened");
        });

        $('.dark-mark').on('click', function () {
            $('body').removeClass("canvas-opened");
        });
        $('.off-canvas-close').on('click', function () {
            $('body').removeClass("canvas-opened");
        });
    };

    // Search form
    var openSearchForm = function () {
        $('button.search-icon').on('click', function () {
            $('body').toggleClass("open-search-form");
            $('.mega-menu-item').removeClass("open");
            $("html, body").animate({ scrollTop: 0 }, "slow");
        });
        $('.search-close').on('click', function () {
            $('body').removeClass("open-search-form");
        });
        $(document).on('click', '.category-search', function(){
            $('.gsc-input').val($(this).html())
            $('.gsc-search-button').click();
        })
    };

    // Mobile menu
    var mobileMenu = function () {
        var menu = $('ul#mobile-menu');
        if (menu.length) {
            menu.slicknav({
                prependTo: ".mobile_menu",
                closedSymbol: '+',
                openedSymbol: '-'
            });
        };
    };

    var SubMenu = function () {
        // $(".sub-menu").hide();
        $(".menu li.menu-item-has-children").on({
            mouseenter: function () {
                $('.sub-menu:first, .children:first', this).stop(true, true).slideDown('fast');
            },
            mouseleave: function () {
                $('.sub-menu:first, .children:first', this).stop(true, true).slideUp('fast');
            }
        });
    };

    var WidgetSubMenu = function () {
        //$(".sub-menu").hide();
        $('.menu li.menu-item-has-children').on('click', function () {
            var element = $(this);
            if (element.hasClass('open')) {
                element.removeClass('open');
                element.find('li').removeClass('open');
                element.find('ul').slideUp(200);
            } else {
                element.addClass('open');
                element.children('ul').slideDown(200);
                element.siblings('li').children('ul').slideUp(200);
                element.siblings('li').removeClass('open');
                element.siblings('li').find('li').removeClass('open');
                element.siblings('li').find('ul').slideUp(200);
            }
        });
    };

    // Slick slider
    var customSlickSlider = function () {

        // Slideshow Fade
        $('.slide-fade').slick({
            infinite: true,
            dots: false,
            arrows: true,
            autoplay: false,
            autoplaySpeed: 3000,
            fade: true,
            fadeSpeed: 1500,
            prevArrow: '<button type="button" class="slick-prev"><i class="elegant-icon arrow_left"></i></button>',
            nextArrow: '<button type="button" class="slick-next"><i class="elegant-icon arrow_right"></i></button>',
            appendArrows: '.arrow-cover',
        });

        // carausel 3 columns
        $('.carausel-3-columns').slick({
            dots: false,
            infinite: true,
            speed: 1000,
            arrows: false,
            autoplay: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            loop: true,
            adaptiveHeight: true,
            responsive: [{
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
            ]
        });

        // featured slider 2
        $('.featured-slider-2-items').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            dots: false,
            fade: true,
            asNavFor: '.featured-slider-2-nav',
        });
        $('.featured-slider-2-nav').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            vertical: true,
            asNavFor: '.featured-slider-2-items',
            dots: false,
            arrows: false,
            focusOnSelect: true,
            verticalSwiping: true
        });
        // featured slider 3
        $('.featured-slider-3-items').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            dots: false,
            fade: true,
            prevArrow: '<button type="button" class="slick-prev"><i class="elegant-icon arrow_left"></i></button>',
            nextArrow: '<button type="button" class="slick-next"><i class="elegant-icon arrow_right"></i></button>',
            appendArrows: '.slider-3-arrow-cover',
        });
    };

    var typeWriter = function () {
        var TxtType = function (el, toRotate, period) {
            this.toRotate = toRotate;
            this.el = el;
            this.loopNum = 0;
            this.period = parseInt(period, 10) || 2000;
            this.txt = '';
            this.tick();
            this.isDeleting = !1
        };
        TxtType.prototype.tick = function () {
            var i = this.loopNum % this.toRotate.length;
            var fullTxt = this.toRotate[i];
            if (this.isDeleting) {
                this.txt = fullTxt.substring(0, this.txt.length - 1)
            } else {
                this.txt = fullTxt.substring(0, this.txt.length + 1)
            }
            this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';
            var that = this;
            var delta = 200 - Math.random() * 100;
            if (this.isDeleting) {
                delta /= 2
            }
            if (!this.isDeleting && this.txt === fullTxt) {
                delta = this.period;
                this.isDeleting = !0
            } else if (this.isDeleting && this.txt === '') {
                this.isDeleting = !1;
                this.loopNum++;
                delta = 500
            }
            setTimeout(function () {
                that.tick()
            }, delta)
        };
        window.onload = function () {
            var elements = document.getElementsByClassName('typewrite');
            for (var i = 0; i < elements.length; i++) {
                var toRotate = elements[i].getAttribute('data-type');
                var period = elements[i].getAttribute('data-period');
                if (toRotate) {
                    new TxtType(elements[i], JSON.parse(toRotate), period)
                }
            }
            var css = document.createElement("style");
            css.type = "text/css";
            css.innerHTML = ".typewrite > .wrap { border-right: 0.05em solid #5869DA}";
            document.body.appendChild(css)
        }
    }

    // Nice Select
    var niceSelectBox = function () {
        var nice_Select = $('select');
        if (nice_Select.length) {
            nice_Select.niceSelect();
        }
    };

    //Header sticky
    var headerSticky = function () {
        $(window).on('scroll', function () {
            var scroll = $(window).scrollTop();
            if (scroll < 245) {
                $(".header-sticky").removeClass("sticky-bar");
            } else {
                $(".header-sticky").addClass("sticky-bar");
            }
        });
    };

    // Scroll up to top
    var scrollToTop = function () {
        $.scrollUp({
            scrollName: 'scrollUp', // Element ID
            topDistance: '300', // Distance from top before showing element (px)
            topSpeed: 300, // Speed back to top (ms)
            animation: 'fade', // Fade, slide, none
            animationInSpeed: 200, // Animation in speed (ms)
            animationOutSpeed: 200, // Animation out speed (ms)
            scrollText: '<i class="elegant-icon arrow_up"></i>', // Text for element
            activeOverlay: false, // Set CSS color to display scrollUp active point, e.g '#00FFFF'
        });
    };

    //VSticker
    var VSticker = function () {
        $('#news-flash').vTicker({
            speed: 800,
            pause: 3000,
            animation: 'fade',
            mousePause: false,
            showItems: 1
        });
        $('#date-time').vTicker({
            speed: 800,
            pause: 3000,
            animation: 'fade',
            mousePause: false,
            showItems: 1
        });
    };

    //sidebar sticky
    var stickySidebar = function () {
        $('.sticky-sidebar').theiaStickySidebar();
    };

    //Custom scrollbar
    var customScrollbar = function () {
        var $ = document.querySelector.bind(document);
        var ps = new PerfectScrollbar('.custom-scrollbar');
    };

    //Mega menu
    var megaMenu = function () {
        $('.sub-mega-menu .nav-pills > a').on('mouseover', function (event) {
            $(this).tab('show');
        });
    };

    //magnific Popup
    var magPopup = function () {
        if ($('.play-video').length) {
            $('.play-video').magnificPopup({
                disableOn: 700,
                type: 'iframe',
                mainClass: 'mfp-fade',
                removalDelay: 160,
                preloader: false,
                fixedContentPos: false
            });
        }
    };

    var masonryGrid = function () {
        if ($(".grid").length) {
            // init Masonry
            var $grid = $('.grid').masonry({
                itemSelector: '.grid-item',
                percentPosition: true,
                columnWidth: '.grid-sizer',
                gutter: 0
            });

            // layout Masonry after each image loads
            $grid.imagesLoaded().progress(function () {
                $grid.masonry();
            });
        }
    };

    /* More articles*/
    var moreArticles = function () {
        $.fn.vwScroller = function (options) {
            var default_options = {
                delay: 500,
                /* Milliseconds */
                position: 0.7,
                /* Multiplier for document height */
                visibleClass: '',
                invisibleClass: '',
            }

            var isVisible = false;
            var $document = $(document);
            var $window = $(window);

            options = $.extend(default_options, options);

            var observer = $.proxy(function () {
                var isInViewPort = $document.scrollTop() > (($document.height() - $window.height()) * options.position);

                if (!isVisible && isInViewPort) {
                    onVisible();
                } else if (isVisible && !isInViewPort) {
                    onInvisible();
                }
            }, this);

            var onVisible = $.proxy(function () {
                isVisible = true;

                /* Add visible class */
                if (options.visibleClass) {
                    this.addClass(options.visibleClass);
                }

                /* Remove invisible class */
                if (options.invisibleClass) {
                    this.removeClass(options.invisibleClass);
                }

            }, this);

            var onInvisible = $.proxy(function () {
                isVisible = false;

                /* Remove visible class */
                if (options.visibleClass) {
                    this.removeClass(options.visibleClass);
                }

                /* Add invisible class */
                if (options.invisibleClass) {
                    this.addClass(options.invisibleClass);
                }
            }, this);

            /* Start observe*/
            setInterval(observer, options.delay);

            return this;
        }

        if ($.fn.vwScroller) {

            let pos = 0.85
            if ($.fn.isMobile()) {
                pos = 0.75
            }
            var $more_articles = $('.single-more-articles');
            $more_articles.vwScroller({ visibleClass: 'single-more-articles--visible', position: pos })
            $more_articles.find('.single-more-articles-close-button').on('click', function () {
                $more_articles.hide();
            });
        }

        $('button.single-more-articles-close').on('click', function () {
            $('.single-more-articles').removeClass('single-more-articles--visible');
        });
    }

    var newsletter = function () {

        function validateEmail(email) {
            const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        $('.newsletter .subscribe-btn').click((e) => {
            let email = $('.newsletter .email').val();

            if (validateEmail(email)) {
                $('.newsletter .email').prop('disabled', true);
                $('.newsletter .subscribe-btn').prop('disabled', true);

                __DB.collection('newsletter').add({
                    "email": email,
                    "date": firebase.firestore.Timestamp.now()
                }).then(() => {
                    Swal.fire('Thank you for subscribing');
                });
            } else {
                $('.newsletter .email').removeClass('has-error').removeClass('has-error');
            }


        });
    }
    var imageViewer = function () {
        var options = {
            toolbar: {
                zoomIn: 0,
                zoomOut: 0,
                oneToOne: 0,
                reset: 0,
                prev: 4,
                play: 0,
                next: 4,
                rotateLeft: 0,
                rotateRight: 0,
                flipHorizontal: 0,
                flipVertical: 0,
            },
        }

        $('figure.image').viewer(options)
        $('#article-body').viewer(options);
    }

    /* Toastr */
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-bottom-left",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    var _DATA;
    var factory = function(){

        var data = _DATA;

        function arbitraryViews(min, max) { // min and max included 
            return Math.floor(Math.random() * (max - min + 1) + min)
        }
        const formatNumber = function(num){ 
            var retVal = (num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return retVal;
        }
        
        var views = parseInt(data.views)
        if( views < 1000 ){
            views = formatNumber(arbitraryViews(1000, 200000));
        }
        var postInfoText = [
            `👀👍 ${views} have viewed this post ❤️`,
            `✏️ ${data.author} wrote this post`,
            `📷 ${data.photo_credit}, uploaded these photos`,
            `‎😃💁 This post has reached ${data.social_reach ? data.social_reach : views } people on social media`,
            `📍 Your facebook friends have visited this place ${data.location}`
        ]

        var nextArticleText = [
            `👀👍 Katoltol ka asa ni? ❤️`,
            `✏️ Nindot kaayu diri. 👍👍👍`,
            `📷 Naka-anhi na ko. Nindot kaayu ang lugar.😃`,
            `‎😃💁 Laag ta diri mga bisaya. Arats na! ❤️ ❤️`,
            `📍 Suroy nya ta diri ninyo. Nindot kaayu.👍`,
            `😃 Arats na ta diri guys! 📷❤️👍`
        ]

        function generateNextArticles(){
            var nextArticles = [];
            var allArticles = $('.related-posts .post-thumb').toArray().concat($('.widget-latest-posts .list-post li').toArray());

            allArticles.map((post)=>{
                nextArticles.push( {
                    url: $(post).find('a').attr('href'),
                    img: $(post).find('img').attr('data-src')
                })
            });
            return nextArticles;
        }
        var nextArticles = generateNextArticles();
        return {
            getPostInfoText : () => postInfoText[Math.floor((Math.random() * postInfoText.length - 1) + 1)],
            getNextArticle : function (){
                return {
                    text: nextArticleText[Math.floor((Math.random() * nextArticleText.length - 1) + 1)],
                    nextArticle: nextArticles[Math.floor((Math.random() * nextArticles.length - 1) + 1)]
                }
            }
        };
    }

    var live = function () {
        _DATA = JSON.parse(document.getElementById('post_data').innerHTML);
        var Generator = factory();
        // setInterval(function () {
        //     try {
        //         var showToastMsg = Generator.getPostInfoText();
        //         toastr.info(`${showToastMsg}`,null,{'toastClass': 'bg-primary toast-notif'});
        //     } catch (e) {
        //         console.error(e);
        //     }
        // }, 15000);

        // setTimeout( function(){
        //     setInterval(function () {
        //         try {
                    
        //             var generateNextArticle = Generator.getNextArticle();
        //             var textToUse = generateNextArticle.text;
        //             var nextArticle = generateNextArticle.nextArticle;
                    
        //             toastr.info(`<div class='d-flex flex-column nextArticle'>
        //                 <span class='pb-3'>${textToUse}</span>
        //                 <img src="${nextArticle.img}" style='max-height: 60%'/>
        //                 </div>`,null, { 
        //                     "toastClass": 'bg-success toast-notif',
        //                     "onclick": (e)=>{
        //                         e.preventDefault();
        //                         ga('send', 'event', {
        //                             eventCategory: 'toastr clicks',
        //                             eventAction: 'next article',
        //                             eventLabel: `${nextArticle.url}`,
        //                             transport: 'beacon'
        //                           });
        //                         window.location.href = `${nextArticle.url}`;
        //                     }
        //                 });
        //         } catch (e) {
        //             console.error(e);
        //         }
        //     }, 10000);
        // }, 35000);
        

    }
    /* WOW active */
    new WOW().init();

    //Load functions
    $(document).ready(function () {
        openSearchForm();
        OffCanvas();
        customScrollbar();
        magPopup();
        scrollToTop();
        headerSticky();
        stickySidebar();
        customSlickSlider();
        megaMenu();
        mobileMenu();
        typeWriter();
        WidgetSubMenu();
        scrollProgress();
        masonryGrid();
        niceSelectBox();
        //moreArticles();
        VSticker();
        imageViewer();

        newsletter();
        try{
            live();
        }catch(e){
            console.log(e);
        }
        
    });

})(jQuery, toastr);