// Orange Header JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Add class to body for header styling
    document.body.classList.add('header-orange-active');
    
    // Update current time and date
    function updateDateTime() {
        const datetimeElement = document.getElementById('current-datetime');
        if (datetimeElement) {
            const now = new Date();
            
            // Format date and time for Philippines timezone
            const options = {
                timeZone: 'Asia/Manila',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(now);
            
            const weekday = parts.find(part => part.type === 'weekday').value;
            const month = parts.find(part => part.type === 'month').value;
            const day = parts.find(part => part.type === 'day').value;
            const year = parts.find(part => part.type === 'year').value;
            const hour = parts.find(part => part.type === 'hour').value;
            const minute = parts.find(part => part.type === 'minute').value;
            const dayPeriod = parts.find(part => part.type === 'dayPeriod').value;
            
            datetimeElement.textContent = `${weekday}, ${month} ${day}, ${year} | ${hour}:${minute} ${dayPeriod} PHT`;
        }
    }
    
    // Update immediately and then every minute
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every 60 seconds
    
    // Calculate and set proper body padding
    const stickyContainer = document.querySelector('.sticky-header-container');
    const headerNav = document.querySelector('.header-nav.sticky-nav');
    const headerTopOrange = document.querySelector('.header-top-orange.sticky-top-bar');
    
    function adjustBodyPadding() {
        let totalHeaderHeight = 0;
        
        if (headerTopOrange) {
            totalHeaderHeight += headerTopOrange.offsetHeight;
        }
        
        if (headerNav) {
            totalHeaderHeight += headerNav.offsetHeight;
        }
        
        document.body.style.paddingTop = totalHeaderHeight + 'px';
    }
    
    // Adjust padding on load and resize
    adjustBodyPadding();
    window.addEventListener('resize', adjustBodyPadding);
    
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            // Animate hamburger icon
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Search Overlay
    const searchBtn = document.querySelector('.search-btn-nav');
    const searchOverlay = document.querySelector('.search-overlay-orange');
    const searchClose = document.querySelector('.search-close-btn');
    
    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', function() {
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on search input
            setTimeout(() => {
                const searchInput = searchOverlay.querySelector('input[type="text"], input[type="search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 300);
        });
    }
    
    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', function() {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close search overlay on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Close search overlay when clicking outside
    if (searchOverlay) {
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Ensure time and social bar is visible on page load
    if (headerTopOrange) {
        headerTopOrange.classList.remove('hidden');
    }
    if (stickyContainer) {
        stickyContainer.classList.remove('scrolled');
    }
    
    // Sticky Navigation Effect with Top Bar Hide/Show
    if (stickyContainer && headerTopOrange) {
        let lastScrollTop = 0;
        let ticking = false;
        const scrollThreshold = 80; // Increased threshold to 80px
        
        function updateHeader() {
            const scrolled = window.pageYOffset || document.documentElement.scrollTop;
            
            // Hide/show top bar based on scroll position
            if (scrolled > scrollThreshold) {
                // Apply navigation changes immediately (fast)
                stickyContainer.classList.add('scrolled');
                
                // Hide top bar with slight delay for staged effect
                setTimeout(() => {
                    headerTopOrange.classList.add('hidden');
                }, 50); // Small delay so nav moves up first
                
                // Adjust body padding after navigation settles
                setTimeout(() => {
                    if (headerNav && headerTopOrange.classList.contains('hidden')) {
                        document.body.style.paddingTop = headerNav.offsetHeight + 'px';
                    }
                }, 150); // Quick adjustment after nav transition
            } else {
                // Show top bar immediately when scrolling up
                headerTopOrange.classList.remove('hidden');
                stickyContainer.classList.remove('scrolled');
                
                // Restore full padding quickly
                setTimeout(() => {
                    if (!headerTopOrange.classList.contains('hidden')) {
                        adjustBodyPadding();
                    }
                }, 100);
            }
            
            lastScrollTop = scrolled <= 0 ? 0 : scrolled;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerOffset = headerNav ? headerNav.offsetHeight : 0;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (mobileMenu && mobileMenu.classList.contains('active')) {
                        mobileMenu.classList.remove('active');
                        const icon = mobileToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        });
    });
    
});