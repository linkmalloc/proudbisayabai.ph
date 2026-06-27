// In-house Search Functionality
class SiteSearch {
    constructor() {
        this.posts = [];
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchResults = document.getElementById('search-results');
        this.searchLoading = document.getElementById('search-loading');
        
        this.init();
    }
    
    async init() {
        await this.loadPosts();
        this.bindEvents();
    }
    
    async loadPosts() {
        var CACHE_VERSION = 'v2';
        var CACHE_KEY = 'pbb_search_posts_' + CACHE_VERSION;
        var CACHE_TS_KEY = 'pbb_search_posts_ts_' + CACHE_VERSION;
        var ONE_DAY = 24 * 60 * 60 * 1000;
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            var cachedAt = localStorage.getItem(CACHE_TS_KEY);
            if (cached && cachedAt && (Date.now() - parseInt(cachedAt)) < ONE_DAY) {
                this.posts = JSON.parse(cached);
                return;
            }
        } catch (e) {}

        try {
            // Load newest year first so 2026 results are available before older years finish.
            const years = [2026, 2025, 2024, 2023, 2022, 2021];
            var seen = {};
            this.posts = [];
            for (var i = 0; i < years.length; i++) {
                var yearPosts = await fetch('/search/' + years[i] + '.json')
                    .then(function(res) { return res.ok ? res.json() : []; })
                    .catch(function() { return []; });
                for (var j = 0; j < yearPosts.length; j++) {
                    var post = yearPosts[j];
                    if (!post || seen[post.url]) continue;
                    seen[post.url] = true;
                    this.posts.push(post);
                }
                this.posts.sort(function(a, b) {
                    return new Date(b.date) - new Date(a.date);
                });
            }
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(this.posts));
                localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
            } catch (e) {}
        } catch (error) {
            console.error('Failed to load search data:', error);
            this.posts = window.searchData || [];
        }
    }
    
    bindEvents() {
        if (!this.searchInput || !this.searchButton) return;
        
        // Search on button click
        this.searchButton.addEventListener('click', () => {
            this.performSearch();
        });
        
        // Search on Enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Real-time search with debounce
        let searchTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.searchInput.value.length >= 2) {
                    this.performSearch();
                } else {
                    this.clearResults();
                }
            }, 300);
        });
        
        // Handle suggestion tag clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-tag')) {
                e.preventDefault();
                const searchTerm = e.target.getAttribute('data-search');
                if (searchTerm) {
                    this.searchInput.value = searchTerm;
                    this.performSearch();
                }
            }
        });
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query || query.length < 2) {
            this.clearResults();
            return;
        }
        
        this.showLoading();
        
        // Simulate slight delay for better UX
        setTimeout(() => {
            const results = this.search(query);
            this.displayResults(results, query);
        }, 200);
    }
    
    search(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);

        return this.posts
            .map(post => {
                let score = 0;
                let matchedTerms = 0;
                
                searchTerms.forEach(term => {
                    // Title matches (highest priority)
                    if (post.title && typeof post.title === 'string' && post.title.toLowerCase().includes(term)) {
                        score += 10;
                        matchedTerms++;
                    }
                    
                    // Category matches (high priority)
                    if (post.categories && Array.isArray(post.categories) && post.categories.some(cat =>
                        typeof cat === 'string' && cat.toLowerCase().includes(term)
                    )) {
                        score += 8;
                        matchedTerms++;
                    }
                    
                    // Tags matches (high priority)
                    if (post.tags && Array.isArray(post.tags) && post.tags.some(tag => 
                        typeof tag === 'string' && tag.toLowerCase().includes(term)
                    )) {
                        score += 6;
                        matchedTerms++;
                    }
                });

                // Only return posts that match at least one search term
                if (matchedTerms > 0) {
                    // Boost score based on how many terms matched
                    score *= (matchedTerms / searchTerms.length);
                    return { ...post, score };
                }
                
                return null;
            })
            .filter(post => post !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Limit to top 20 results
    }
    
    displayResults(results, query) {
        this.hideLoading();
        
        if (results.length === 0) {
            this.showNoResults(query);
            return;
        }

        // Debug: log the first result to check data structure
        if (results.length > 0) {
            console.log('First search result:', results[0]);
        }
        
        const resultsHTML = results.map(post => {
            const imageUrl =  post.image || post.img_medium_400x300 || post.img_big_1000x600 || 'https://via.placeholder.com/400x300?text=No+Image';
            const postUrl = post.url || '#';
            const postTitle = post.title || 'Untitled';
            const postAuthor = post.author || 'Admin';
            const postDate = this.formatDate(post.date) || '';
            const postCategory = (Array.isArray(post.categories) && post.categories[0]) || 'Article';
            const postDescription = this.truncateText(post.description || 'No description available', 150);
            const postTags = this.formatTags(post.tags);
            
            return `
            <div class="search-result-item">
                <div class="search-result-thumb">
                    <img src="${imageUrl}" alt="Proud Bisaya Bai" loading="lazy">
                </div>
                <div class="search-result-content">
                    <h4 class="search-result-title">
                        <a href="${postUrl}">${postTitle}</a>
                    </h4>
                    <p class="search-result-excerpt">${postDescription}</p>
                    <div class="search-result-tags">
                    <span class="search-result-category">${postCategory}</span>
                    ${postTags}
                    </div>
                    <div class="search-result-meta">
                        <span class="search-result-author">By ${postAuthor}</span>
                        <span class="search-result-date">${postDate}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        this.searchResults.innerHTML = resultsHTML;
        this.searchResults.style.display = 'block';
    }
    
    showNoResults(query) {
        this.searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search mb-3" style="font-size: 24px; color: #ccc;"></i>
                <h5>No results found for "${this.escapeHtml(query)}"</h5>
                <p>Try different keywords or check your spelling.</p>
            </div>
        `;
        this.searchResults.style.display = 'block';
    }
    
    clearResults() {
        this.searchResults.innerHTML = '';
        this.searchResults.style.display = 'none';
    }
    
    showLoading() {
        this.searchLoading.style.display = 'block';
        this.searchResults.style.display = 'none';
    }
    
    hideLoading() {
        this.searchLoading.style.display = 'none';
    }
    
    highlightText(text, query) {
        if (!text || !query) return text;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    truncateText(text, length) {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + '...';
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    formatTags(tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return '<span class="text-muted">No tags</span>';
        }
        return tags.slice(0, 3).map(tag => `<span class="tag-badge">${this.escapeHtml(tag)}</span>`).join(' ');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SiteSearch();
});

// Additional styles for search highlighting
const searchStyles = `
<style>
mark {
    background-color: #fff3cd;
    color: #856404;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 500;
}
.tag-badge {
    display: inline-block;
    background: #f8f9fa;
    color: #666;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    margin-right: 4px;
    border: 1px solid #e9ecef;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', searchStyles);