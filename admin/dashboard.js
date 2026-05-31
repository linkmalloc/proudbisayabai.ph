const { createApp, ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

const POST_SKELETON_FM = {
  author: '',
  author2: '',
  layout: 'post',
  title: '',
  description: '',
  categories: [],
  tags: [],
  views: '0',
  img_big_1000x600: '',
  img_big_3000x1144: '',
  img_500x500: '',
  img_500_1: null,
  img_500_2: null,
  img_500_3: null,
  img_500_4: null,
  img_500_5: null,
  photo_credit: '',
  photo_credit_link: '',
  editor: '',
  read_time: '',
  published: false,
  published_at: null,
};

const API_BASE = window.API_BASE;

createApp({
  setup() {
    const validating = ref(true);
    const isMobile = ref(window.innerWidth < 768);
    const sidebarOpen = ref(window.innerWidth >= 768);
    const currentPage = ref('all-posts');
    const openGroups = reactive({ posts: true });

    const loadingPosts = ref(false);
    const posts = ref([]);
    const postsError = ref(null);
    const pagination = ref({ page: 1, per_page: 20, total: 0, total_pages: 1 });
    const search = ref('');
    const loadingArchivedPosts = ref(false);
    const archivedPosts = ref([]);
    const archivedPostsError = ref(null);
    const archivedPagination = ref({ page: 1, per_page: 20, total: 0, total_pages: 1 });
    const archivedSearch = ref('');
    let archivedSearchTimer = null;
    const previewPost = ref(null);
    const editingPost = ref(null);
    const editTitle = ref('');
    const editDescription = ref('');
    const editAuthor = ref('');
    const editFeatureImage = ref('');
    const editFeatureImagePreview = ref(null);
    const editFeatureImageFile = ref(null);
    const featureFileInput = ref(null);
    const attachmentQueue = ref([]);
    const uploadedImages = ref([]);
    const copiedImageIndex = ref(null);
    const copiedImageBlobIndex = ref(null);
    const selectedImageBlobId = ref(null);
    const featureImageDragOver = ref(false);
    const uploadingAttachments = ref(false);
    let attachmentIdCounter = 0;
    const editSlugTitle = ref('');
    const editCategory = ref('');
    const categorySelect = ref(null);
    const categoryInvalid = ref(false);
    const titleInvalid = ref(false);
    const descriptionInvalid = ref(false);
    const authorInvalid = ref(false);
    const tagsInvalid = ref(false);
    const editTagsRaw = ref('');
    const editTags = ref([]);
    const postCategories = ['story', 'destination', 'food', 'brand', 'product', 'news'];
    const saving = ref(false);
    const publishing = ref(false);

    const saveSuccess = ref(false);
    const editStep = ref(1);
    const editMetaTab = ref('metadata');
    let searchTimer = null;
    let quillEditor = null;
    let tiptapEditor = null;
    let editSnapshot = null;
    let quillDirty = false;
    let editBodyHtml = '';
    let lastRichEditor = 'quill';
    const activeEditor = ref('quill');
    const tiptapUpdateTick = ref(0);
    const markdownOutput = ref('');
    const bodyLength = ref(0);
    const bodyWordCount = ref(0);
    const toast = reactive({ visible: false, mode: 'confirm', message: '', cancelLabel: 'Cancel', confirmLabel: 'Confirm', resolve: null });
    const actionSheet = reactive({ visible: false, post: null });

    function openActionSheet(post) {
      actionSheet.post = post;
      actionSheet.visible = true;
    }
    const imageInsertModal = reactive({ visible: false, url: '', target: null });

    function confirmToast(message, { cancelLabel = 'Cancel', confirmLabel = 'Confirm', mode = 'confirm' } = {}) {
      return new Promise((resolve) => {
        toast.mode = mode;
        toast.message = message;
        toast.cancelLabel = cancelLabel;
        toast.confirmLabel = confirmLabel;
        toast.visible = true;
        toast.resolve = (answer) => {
          toast.visible = false;
          toast.resolve = null;
          resolve(answer);
        };
      });
    }

    function notifyToast(message, duration = 2500, mode = 'notify') {
      toast.mode = mode;
      toast.message = message;
      toast.visible = true;
      setTimeout(() => { toast.visible = false; }, duration);
    }
    function errorToast(message, duration = 3000) {
      notifyToast(message, duration, 'error');
    }
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    // Preserve image width (set by Quill resize or Tiptap resize) as inline HTML in the markdown
    turndownService.addRule('imageWithWidth', {
      filter: node => node.nodeName === 'IMG' && (node.style.width || node.getAttribute('width')),
      replacement: (content, node) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const width = node.style.width || node.getAttribute('width');
        return `<img src="${src}"${alt ? ` alt="${alt}"` : ''} style="width:${width}">`;
      },
    });

    function renderedContent(raw) {
      const body = (raw ? raw.replace(/^---[\s\S]*?---\n?/, '') : '');
      return marked.parse(body);
    }

    function liveUrl(post) {
      const filename = post.slug.replace(/^_posts\//, '').replace(/\.md$/, '');
      const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
      if (!match) return '#';
      const [, year, month, day, titleSlug] = match;
      const category = (post.fm.categories && post.fm.categories[0]) || 'uncategorized';
      return `/${category}/${year}/${month}/${day}/${titleSlug}.html`;
    }

    const token = () => localStorage.getItem('admin_token');

    function parseFrontMatter(fm) {
      try { return jsyaml.load(fm) || {}; } catch (e) { return {}; }
    }

    function onResize() {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile.value) {
        isMobile.value = mobile;
        // auto-open on desktop, auto-close on mobile when resizing
        sidebarOpen.value = !mobile;
      }
    }

    function toggleGroup(group) {
      openGroups[group] = !openGroups[group];
    }

    function navigate(page) {
      currentPage.value = page;
      if (isMobile.value) sidebarOpen.value = false;
    }

    async function validate() {
      if (!token()) {
        window.location.replace('/admin/index.html');
        return false;
      }
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/validate`, {
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (!res.ok) throw new Error();
        return true;
      } catch (e) {
        localStorage.removeItem('admin_token');
        window.location.replace('/admin/index.html');
        return false;
      }
    }

    async function loadPosts(page = 1) {
      loadingPosts.value = true;
      postsError.value = null;
      try {
        const params = new URLSearchParams({ page });
        if (search.value.trim()) params.set('q', search.value.trim());
        const res = await fetch(`${API_BASE}/api/v1/posts?${params}`, {
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (!res.ok) throw new Error('Failed to load posts');
        const json = await res.json();
        posts.value = json.data.map(p => ({ ...p, fm: parseFrontMatter(p.front_matter) }));
        pagination.value = json.pagination;
      } catch (err) {
        postsError.value = err.message;
      } finally {
        loadingPosts.value = false;
      }
    }

    function onSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadPosts(1), 400);
    }

    function goToPage(page) {
      if (page < 1 || page > pagination.value.total_pages) return;
      loadPosts(page);
    }

    function pageNumbers() {
      const { page, total_pages } = pagination.value;
      const delta = 2;
      const pages = [];
      for (let i = Math.max(1, page - delta); i <= Math.min(total_pages, page + delta); i++) {
        pages.push(i);
      }
      return pages;
    }

    async function loadArchivedPosts(page = 1) {
      loadingArchivedPosts.value = true;
      archivedPostsError.value = null;
      try {
        const params = new URLSearchParams({ page });
        if (archivedSearch.value.trim()) params.set('q', archivedSearch.value.trim());
        const res = await fetch(`${API_BASE}/api/v1/posts/archived?${params}`, {
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (!res.ok) throw new Error('Failed to load archived posts');
        const json = await res.json();
        archivedPosts.value = json.data.map(p => ({ ...p, fm: parseFrontMatter(p.front_matter) }));
        archivedPagination.value = json.pagination;
      } catch (err) {
        archivedPostsError.value = err.message;
      } finally {
        loadingArchivedPosts.value = false;
      }
    }

    function onArchivedSearch() {
      clearTimeout(archivedSearchTimer);
      archivedSearchTimer = setTimeout(() => loadArchivedPosts(1), 400);
    }

    function goToArchivedPage(page) {
      if (page < 1 || page > archivedPagination.value.total_pages) return;
      loadArchivedPosts(page);
    }

    function archivedPageNumbers() {
      const { page, total_pages } = archivedPagination.value;
      const delta = 2;
      const pages = [];
      for (let i = Math.max(1, page - delta); i <= Math.min(total_pages, page + delta); i++) {
        pages.push(i);
      }
      return pages;
    }

    async function unarchivePost(post) {
      const confirmed = await confirmToast(`Unarchive "${post.fm.title}"?`, { cancelLabel: 'Cancel', confirmLabel: 'Unarchive' });
      if (!confirmed) return;
      try {
        const res = await fetch(`${API_BASE}/api/v1/posts/${post.id}/republish`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (!res.ok) throw new Error('Failed to unarchive');
        notifyToast('Post unarchived.');
        await loadArchivedPosts(archivedPagination.value.page);
      } catch (err) {
        errorToast(err.message);
      }
    }

    function pushUrlState(mode, id) {
      const url = new URL(window.location);
      url.searchParams.set('mode', mode);
      url.searchParams.set('id', id);
      history.pushState({ mode, id }, '', url);
    }

    function clearUrlState() {
      const url = new URL(window.location);
      url.searchParams.delete('mode');
      url.searchParams.delete('id');
      history.pushState({}, '', url);
    }

    function viewPost(post, updateUrl = true) {
      previewPost.value = post;
      if (updateUrl) pushUrlState('preview', post.id);
    }

    function closePreview() {
      previewPost.value = null;
      clearUrlState();
    }

    const liveStatus = ref('idle'); // 'idle' | 'checking' | 'live' | 'pending'
    let liveCheckTimer = null;

    async function checkLiveStatus() {
      const post = previewPost.value;
      if (!post || !post.published) {
        console.log('[liveStatus] skip — no published preview post');
        liveStatus.value = 'idle';
        return;
      }
      const url = liveUrl(post);
      if (!url || url === '#') {
        console.log('[liveStatus] skip — no resolvable live URL for post', post.id);
        liveStatus.value = 'idle';
        return;
      }
      if (liveStatus.value !== 'live') liveStatus.value = 'checking';
      console.log('[liveStatus] checking', url);
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        console.log('[liveStatus] response', res.status, url);
        if (res.ok) {
          liveStatus.value = 'live';
          console.log('[liveStatus] LIVE — stopping interval');
          stopLiveCheckInterval();
        } else {
          liveStatus.value = 'pending';
          console.log('[liveStatus] PENDING — will retry in 60s');
        }
      } catch (e) {
        liveStatus.value = 'pending';
        console.log('[liveStatus] PENDING (fetch error) — will retry in 60s', e);
      }
    }

    function startLiveCheckInterval() {
      stopLiveCheckInterval();
      console.log('[liveStatus] starting 60s interval');
      liveCheckTimer = setInterval(checkLiveStatus, 60 * 1000);
    }

    function stopLiveCheckInterval() {
      if (liveCheckTimer) {
        console.log('[liveStatus] stopping interval');
        clearInterval(liveCheckTimer);
        liveCheckTimer = null;
      }
    }

    watch(previewPost, (post) => {
      if (post && post.published) {
        console.log('[liveStatus] preview opened for published post', post.id, post.slug);
        liveStatus.value = 'checking';
        checkLiveStatus();
        startLiveCheckInterval();
      } else {
        if (post) console.log('[liveStatus] preview opened for draft — not checking', post.id);
        else console.log('[liveStatus] preview closed');
        liveStatus.value = 'idle';
        stopLiveCheckInterval();
      }
    });

    function draftKey(id) { return `pb_admin_draft_${id}`; }
    function loadDraft(id) {
      try {
        const raw = localStorage.getItem(draftKey(id));
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    function clearDraft(id) {
      try { localStorage.removeItem(draftKey(id)); } catch (e) { /* ignore */ }
    }

    const AUTHORS_KEY = 'pb_admin_authors';
    const AUTHORS_MAX = 25;
    const authorSuggestions = ref([]);
    function loadAuthorSuggestions() {
      try {
        const raw = localStorage.getItem(AUTHORS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) authorSuggestions.value = list.filter(Boolean);
      } catch (e) { authorSuggestions.value = []; }
    }
    function rememberAuthor(name) {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      const next = [trimmed, ...authorSuggestions.value.filter(a => a !== trimmed)].slice(0, AUTHORS_MAX);
      authorSuggestions.value = next;
      try { localStorage.setItem(AUTHORS_KEY, JSON.stringify(next)); } catch (e) { /* quota */ }
    }
    function seedAuthorSuggestionsFromPosts(list) {
      if (!Array.isArray(list)) return;
      const fromPosts = list
        .map(p => p && p.fm && p.fm.author)
        .map(a => (a || '').trim())
        .filter(Boolean);
      if (!fromPosts.length) return;
      const merged = [];
      const seen = new Set();
      for (const a of [...authorSuggestions.value, ...fromPosts]) {
        if (!seen.has(a)) { seen.add(a); merged.push(a); }
      }
      authorSuggestions.value = merged.slice(0, AUTHORS_MAX);
      try { localStorage.setItem(AUTHORS_KEY, JSON.stringify(authorSuggestions.value)); } catch (e) { /* quota */ }
    }
    let suppressDraftSave = false;
    let pendingDraft = null;
    let draftSaveTimer = null;
    function saveDraftToStorage() {
      if (suppressDraftSave || !editingPost.value) return;
      if (!hasUnsavedChanges()) { clearDraft(editingPost.value.id); return; }
      const draft = {
        title: editTitle.value,
        description: editDescription.value,
        author: editAuthor.value,
        slugTitle: editSlugTitle.value,
        category: editCategory.value,
        tags: editTags.value.slice(),
        featureImage: editFeatureImage.value,
        body: getEditorHtml(),
      };
      try { localStorage.setItem(draftKey(editingPost.value.id), JSON.stringify(draft)); }
      catch (e) { /* quota — drop silently */ }
    }
    function scheduleDraftSave() {
      if (suppressDraftSave) return;
      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(saveDraftToStorage, 500);
    }

    async function editPost(post, updateUrl = true) {
      const existingDraft = loadDraft(post.id);
      let restoreDraft = null;
      if (existingDraft) {
        const restore = await confirmToast('Restore unsaved draft from before?', { cancelLabel: 'Discard', confirmLabel: 'Restore' });
        if (restore) {
          restoreDraft = existingDraft;
        } else {
          clearDraft(post.id);
          clearUrlState();
          return;
        }
      }

      suppressDraftSave = true;
      const fm = post.fm || {};
      editTitle.value = fm.title || '';
      editDescription.value = fm.description || '';
      editAuthor.value = fm.author || '';
      editSlugTitle.value = post.slug_title ? post.slug_title.slice(0, 50) : slugify(fm.title || '');
      editCategory.value = (fm.categories && fm.categories[0]) || '';
      categoryInvalid.value = false;
      titleInvalid.value = false;
      descriptionInvalid.value = false;
      authorInvalid.value = false;
      tagsInvalid.value = false;
      editTags.value = [].concat(fm.tags || []).map(t => String(t).trim().replace(/,+$/, '')).filter(Boolean);
      editTagsRaw.value = '';
      editFeatureImage.value = fm.img_big_1000x600 || '';
      editFeatureImagePreview.value = null;
      editFeatureImageFile.value = null;
      attachmentQueue.value = [];
      uploadedImages.value = [];

      saveSuccess.value = false;
      editStep.value = 1;
      editMetaTab.value = 'metadata';
      editSnapshot = {
        title: editTitle.value,
        description: editDescription.value,
        author: editAuthor.value,
        slugTitle: editSlugTitle.value,
        category: editCategory.value,
        tags: JSON.stringify(editTags.value),
        featureImage: editFeatureImage.value,
      };

      if (restoreDraft) {
        if (restoreDraft.title !== undefined) editTitle.value = restoreDraft.title;
        if (restoreDraft.description !== undefined) editDescription.value = restoreDraft.description;
        if (restoreDraft.author !== undefined) editAuthor.value = restoreDraft.author;
        if (restoreDraft.slugTitle !== undefined) editSlugTitle.value = restoreDraft.slugTitle;
        if (restoreDraft.category !== undefined) editCategory.value = restoreDraft.category;
        if (Array.isArray(restoreDraft.tags)) editTags.value = restoreDraft.tags.slice();
        if (restoreDraft.featureImage !== undefined) editFeatureImage.value = restoreDraft.featureImage;
        pendingDraft = restoreDraft;
      }

      editingPost.value = post;
      activeEditor.value = 'quill';
      quillDirty = !!restoreDraft;
      if (updateUrl) pushUrlState('edit', post.id);
    }

    function hasUnsavedChanges() {
      if (!editSnapshot) return false;
      if (quillDirty) return true;
      return (
        editTitle.value !== editSnapshot.title ||
        editDescription.value !== editSnapshot.description ||
        editAuthor.value !== editSnapshot.author ||
        editSlugTitle.value !== editSnapshot.slugTitle ||
        editCategory.value !== editSnapshot.category ||
        JSON.stringify(editTags.value) !== editSnapshot.tags ||
        editFeatureImage.value !== editSnapshot.featureImage
      );
    }

    async function restoreFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const id = params.get('id');
      if (!mode || !id) return;
      let post = posts.value.find(p => String(p.id) === id);
      if (!post) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/posts/${id}`, {
            headers: { 'Authorization': `Bearer ${token()}` },
          });
          if (res.ok) {
            const data = await res.json();
            post = { ...data, fm: parseFrontMatter(data.front_matter) };
          }
        } catch (e) { return; }
      }
      if (!post) return;
      if (mode === 'preview') viewPost(post, false);
      else if (mode === 'edit') editPost(post, false);
    }

    async function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (!mode) {
        if (editingPost.value && hasUnsavedChanges()) {
          if (!await confirmToast('You have unsaved changes.', { cancelLabel: 'Stay', confirmLabel: 'Leave' })) {
            // Put the URL back so the user stays on the edit state
            pushUrlState('edit', editingPost.value.id);
            return;
          }
          clearDraft(editingPost.value.id);
          quillDirty = false;
          editSnapshot = null;
        }
        previewPost.value = null;
        if (editingPost.value) {
          if (tiptapEditor) { tiptapEditor.destroy(); tiptapEditor = null; }
          if (quillEditor) { quillEditor = null; }
          editBodyHtml = '';
          editingPost.value = null;
        }
      } else {
        restoreFromUrl();
      }
    }

    function slugify(str) {
      return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim().replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)
        .replace(/-+$/, '');
    }

    function addTag(e) {
      const raw = editTagsRaw.value;
      if (!raw.includes(',') && e.type !== 'keydown') return;
      const parts = raw.split(',');
      parts.forEach((t, i) => {
        const tag = t.trim();
        if (!tag || (i === parts.length - 1 && !raw.endsWith(','))) return;
        if (!editTags.value.includes(tag)) editTags.value.push(tag);
      });
      // Keep only the last incomplete part
      const last = raw.endsWith(',') ? '' : parts[parts.length - 1];
      editTagsRaw.value = last;
    }

    function addTagOnEnter(e) {
      const tag = editTagsRaw.value.trim().replace(/,+$/, '');
      if (!tag) return;
      if (!editTags.value.includes(tag)) editTags.value.push(tag);
      editTagsRaw.value = '';
    }

    function removeTag(tag) {
      editTags.value = editTags.value.filter(t => t !== tag);
    }

    async function uploadFile(item) {
      item.status = 'uploading';
      item.progress = 0;
      try {
        const formData = new FormData();
        formData.append('files', item.file);
        const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}/upload_attachments`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token()}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        item.progress = 100;
        item.status = 'done';
        uploadedImages.value.push(...(data.attachments || []));
      } catch (err) {
        item.status = 'error';
        item.error = err.message;
      }
    }

    async function processQueue() {
      const next = attachmentQueue.value.find(i => i.status === 'pending');
      if (!next) return;
      await uploadFile(next);
      processQueue(); // process next after current finishes
    }

    function addToAttachmentQueue(files) {
      const wasEmpty = !attachmentQueue.value.some(i => i.status === 'pending' || i.status === 'uploading');
      for (const file of files) {
        attachmentQueue.value.push({
          id: ++attachmentIdCounter,
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
          progress: 0,
          error: null,
        });
      }
      if (wasEmpty) processQueue();
    }

    function onAttachmentSelect(e) {
      addToAttachmentQueue(e.target.files);
      e.target.value = '';
    }

    function onAttachmentDrop(e) {
      addToAttachmentQueue(e.dataTransfer.files);
    }

    function removeAttachment(id) {
      attachmentQueue.value = attachmentQueue.value.filter(i => i.id !== id);
    }

    async function deleteUploadedImage(img) {
      if (!await confirmToast('Remove this image?', { cancelLabel: 'Cancel', confirmLabel: 'Remove' })) return;
      try {
        const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}/remove_attachment?blob_id=${img.blob_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (res.ok) {
          uploadedImages.value = uploadedImages.value.filter(i => i.blob_id !== img.blob_id);
          notifyToast('Image removed.');
        }
      } catch (err) {
        console.error('Failed to remove attachment', err);
      }
    }

    function retryAttachment(item) {
      uploadFile(item);
    }

    function toCloudFrontUrl(url) {
      const base = 'https://d1rl40o93nnuyl.cloudfront.net';
      try {
        const path = new URL(url).pathname;
        return `${base}${path}`;
      } catch (e) {
        // relative path — strip leading slash if present
        return `${base}/${url.replace(/^\//, '')}`;
      }
    }

    function setFeatureImage(img) {
      editFeatureImage.value = toCloudFrontUrl(img.key);
      editFeatureImagePreview.value = null;
      editFeatureImageFile.value = null;
      selectedImageBlobId.value = null;
      notifyToast('Feature image set.');
    }

    async function copyImageUrl(url, index) {
      const cfUrl = toCloudFrontUrl(url);
      try {
        await navigator.clipboard.writeText(cfUrl);
        copiedImageIndex.value = index;
        setTimeout(() => { copiedImageIndex.value = null; }, 2000);
      } catch (e) {
        const el = document.createElement('textarea');
        el.value = cfUrl;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try {
          document.execCommand('copy');
          copiedImageIndex.value = index;
          setTimeout(() => { copiedImageIndex.value = null; }, 2000);
        } catch (e) {
          prompt('Copy this URL:', cfUrl);
        }
        document.body.removeChild(el);
      }
    }

    async function copyImageBlob(url, index) {
      const cfUrl = toCloudFrontUrl(url);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = cfUrl + '?v=' + Date.now(); // bypass cache to allow crossOrigin
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copiedImageBlobIndex.value = index;
        setTimeout(() => { copiedImageBlobIndex.value = null; }, 2000);
      } catch (err) {
        console.error('Copy image failed:', err);
      }
    }

    async function onFeatureImageFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      editFeatureImageFile.value = file;
      editFeatureImagePreview.value = URL.createObjectURL(file);
      try {
        const formData = new FormData();
        formData.append('files', file);
        const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}/upload_attachments`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token()}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const imgs = data.attachments || [];
        if (imgs.length) {
          editFeatureImage.value = toCloudFrontUrl(imgs[imgs.length - 1].key);
          editFeatureImagePreview.value = null;
          editFeatureImageFile.value = null;
          uploadedImages.value.push(...imgs);
        }
      } catch (err) {
        errorToast('Feature image upload failed.');
        console.error('Feature image upload failed', err);
      }
    }

    function insertImageByUrl() {
      const url = imageInsertModal.url.trim();
      if (!url) return;
      imageInsertModal.visible = false;
      if (imageInsertModal.target === 'tiptap' && tiptapEditor) {
        tiptapEditor.chain().focus().setImage({ src: url }).run();
      } else if (quillEditor) {
        const range = quillEditor.getSelection(true) || { index: quillEditor.getLength() };
        quillEditor.insertEmbed(range.index, 'image', url);
        quillEditor.setSelection(range.index + 1);
      }
      imageInsertModal.target = null;
    }

    function insertImageFromDevice() {
      imageInsertModal.visible = false;
      const targetEditor = imageInsertModal.target;
      imageInsertModal.target = null;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('files', file);
        try {
          const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}/upload_attachments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token()}` },
            body: formData,
          });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          const imgs = data.attachments || [];
          if (imgs.length) {
            const cfUrl = toCloudFrontUrl(imgs[imgs.length - 1].key);
            if (targetEditor === 'tiptap' && tiptapEditor) {
              tiptapEditor.chain().focus().setImage({ src: cfUrl }).run();
            } else if (quillEditor) {
              const range = quillEditor.getSelection(true) || { index: quillEditor.getLength() };
              quillEditor.insertEmbed(range.index, 'image', cfUrl);
              quillEditor.setSelection(range.index + 1);
            }
            uploadedImages.value.push(...imgs);
          }
        } catch (err) {
          console.error('Image upload failed', err);
        }
      };
      input.click();
    }

    function getEditorHtml() {
      const rich = activeEditor.value === 'markdown' ? lastRichEditor : activeEditor.value;
      return rich === 'tiptap' && tiptapEditor
        ? tiptapEditor.getHTML()
        : (quillEditor ? quillEditor.root.innerHTML : '');
    }

    function readTimeFromLength(len) {
      return `${Math.max(2, Math.min(5, Math.ceil((len || 0) / 1500)))} minutes`;
    }
    function computeReadTime(body) {
      return readTimeFromLength((body || '').length);
    }
    function countWords(text) {
      return (text || '').trim().split(/\s+/).filter(Boolean).length;
    }
    const currentReadTime = computed(() => readTimeFromLength(bodyLength.value));

    function buildMarkdownDoc() {
      const markdown = turndownService.turndown(getEditorHtml());
      const { attachments: _attachments, ...existingFm } = editingPost.value.fm || {};
      const fm = {
        ...POST_SKELETON_FM,
        ...existingFm,
        title: editTitle.value,
        description: editDescription.value,
        author: editAuthor.value,
        categories: editCategory.value ? [editCategory.value] : (existingFm.categories || []),
        tags: editTags.value,
        img_big_1000x600: editFeatureImage.value,
        img_big_3000x1144: editFeatureImage.value,
        img_500x500: editFeatureImage.value,
        editor: 'PBB Admin',
        read_time: computeReadTime(markdown),
      };
      return `---\n${jsyaml.dump(fm, { lineWidth: -1 })}---\n\n${markdown}`;
    }

    async function switchToEditor(type) {
      if (activeEditor.value === type) return;
      const from = activeEditor.value;

      if (type === 'markdown') {
        markdownOutput.value = buildMarkdownDoc();
        activeEditor.value = 'markdown';
        return;
      }

      if (type === 'tiptap' && !tiptapEditor) {
        // Lazy-init: show the element first so ProseMirror can mount properly
        if (!window.TiptapEditor) return;
        activeEditor.value = 'tiptap';
        await nextTick(); // #tiptap-editor is now visible (v-show removed display:none)
        const content = from === 'quill' && quillDirty && quillEditor
          ? quillEditor.root.innerHTML
          : editBodyHtml;
        tiptapEditor = new window.TiptapEditor({
          element: document.querySelector('#tiptap-editor'),
          extensions: [
            window.TiptapStarterKit,
            window.TiptapImage.configure({ inline: false }),
            window.TiptapLink.configure({ openOnClick: false }),
          ],
          content,
          onUpdate() {
            quillDirty = true;
            bodyLength.value = turndownService.turndown(tiptapEditor.getHTML()).length;
            bodyWordCount.value = countWords(tiptapEditor.getText());
            scheduleDraftSave();
          },
          onTransaction() { tiptapUpdateTick.value++; },
        });
        document.querySelector('#tiptap-editor').addEventListener('drop', (e) => {
          const url = e.dataTransfer.getData('text/plain');
          if (!url || e.dataTransfer.files.length) return;
          e.preventDefault();
          tiptapEditor.chain().focus().setImage({ src: url }).run();
        });
        lastRichEditor = 'tiptap';
        return;
      }

      // Sync markdown textarea back to rich editor
      if (from === 'markdown') {
        const bodyMatch = markdownOutput.value.match(/^---[\s\S]*?---\n\n?([\s\S]*)$/);
        const body = bodyMatch ? bodyMatch[1] : markdownOutput.value;
        const html = marked.parse(body);
        if (type === 'quill' && quillEditor) {
          quillEditor.root.innerHTML = html;
          quillDirty = true;
        } else if (type === 'tiptap' && tiptapEditor) {
          tiptapEditor.commands.setContent(html, false);
        }
        editBodyHtml = html;
      }

      // Sync between rich editors (skip if coming from markdown — each rich editor keeps its own state)
      if (from !== 'markdown') {
        if (type === 'tiptap' && tiptapEditor && quillDirty && quillEditor) {
          tiptapEditor.commands.setContent(quillEditor.root.innerHTML, false);
        } else if (type === 'quill' && tiptapEditor && quillEditor) {
          quillEditor.root.innerHTML = tiptapEditor.getHTML();
        }
      }

      lastRichEditor = type;
      activeEditor.value = type;
    }

    function tiptapCmd(command, attrs) {
      if (!tiptapEditor) return;
      const chain = tiptapEditor.chain().focus();
      if (command === 'heading') chain.toggleHeading(attrs).run();
      else if (command === 'bold') chain.toggleBold().run();
      else if (command === 'italic') chain.toggleItalic().run();
      else if (command === 'strike') chain.toggleStrike().run();
      else if (command === 'code') chain.toggleCode().run();
      else if (command === 'bulletList') chain.toggleBulletList().run();
      else if (command === 'orderedList') chain.toggleOrderedList().run();
      else if (command === 'blockquote') chain.toggleBlockquote().run();
      else if (command === 'codeBlock') chain.toggleCodeBlock().run();
      else if (command === 'clearNodes') chain.clearNodes().unsetAllMarks().run();
    }

    function tiptapActive(type, attrs) {
      tiptapUpdateTick.value; // eslint-disable-line no-unused-expressions
      if (!tiptapEditor) return false;
      return tiptapEditor.isActive(type, attrs);
    }

    function tiptapInsertImage() {
      imageInsertModal.url = '';
      imageInsertModal.target = 'tiptap';
      imageInsertModal.visible = true;
    }

    function tiptapSetLink() {
      if (!tiptapEditor) return;
      const previous = tiptapEditor.getAttributes('link').href || '';
      const url = window.prompt('Enter link URL', previous);
      if (url === null) return;
      if (url === '') {
        tiptapEditor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        tiptapEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    }

    function onImageDragStart(event, url) {
      event.dataTransfer.setData('text/plain', toCloudFrontUrl(url));
      event.dataTransfer.effectAllowed = 'copy';
    }

    function onFeatureImageDrop(event) {
      featureImageDragOver.value = false;
      const url = event.dataTransfer.getData('text/plain');
      if (url) {
        editFeatureImage.value = url;
        editFeatureImagePreview.value = null;
      } else if (event.dataTransfer.files.length) {
        onFeatureImageFile({ target: { files: event.dataTransfer.files } });
      }
    }

    function clearFeatureImage() {
      editFeatureImage.value = '';
      editFeatureImagePreview.value = null;
      editFeatureImageFile.value = null;
      if (featureFileInput.value) featureFileInput.value.value = '';
    }

    async function closeEditor() {
      if (hasUnsavedChanges() && !await confirmToast('You have unsaved changes.', { cancelLabel: 'Stay', confirmLabel: 'Leave' })) return;
      if (editingPost.value && hasUnsavedChanges()) clearDraft(editingPost.value.id);
      if (tiptapEditor) { tiptapEditor.destroy(); tiptapEditor = null; }
      if (quillEditor) { quillEditor = null; }
      editBodyHtml = '';
      editingPost.value = null;
      editSnapshot = null;
      quillDirty = false;
      clearUrlState();
    }


    async function savePost(publish = false) {
      const wasPublished = !!(editingPost.value && editingPost.value.published);
      const republish = publish && wasPublished;
      if (!editTitle.value.trim()) {
        errorToast('Title is required.');
        titleInvalid.value = true;
        descriptionInvalid.value = false;
        editStep.value = 1;
        editMetaTab.value = 'metadata';
        nextTick(() => {
          const titleEl = document.querySelector('textarea[data-title]');
          if (titleEl) titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
      }
      if (!editTags.value.length) {
        errorToast('At least 1 tag is required.');
        tagsInvalid.value = true;
        editStep.value = 1;
        editMetaTab.value = isMobile.value ? 'metadata' : 'seo';
        return;
      }
      if (!editAuthor.value.trim()) {
        errorToast('Author is required.');
        authorInvalid.value = true;
        editStep.value = 1;
        editMetaTab.value = 'metadata';
        return;
      }
      if (!editDescription.value.trim()) {
        errorToast('Description is required.');
        descriptionInvalid.value = true;
        editStep.value = 1;
        editMetaTab.value = 'metadata';
        nextTick(() => {
          if (categorySelect.value) categorySelect.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
      }
      if (!editCategory.value) {
        errorToast('Category is required.');
        categoryInvalid.value = true;
        editStep.value = 1;
        editMetaTab.value = isMobile.value ? 'metadata' : 'seo';
        nextTick(() => {
          if (categorySelect.value) categorySelect.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
      }
      if (!editFeatureImage.value && !editFeatureImagePreview.value) {
        errorToast('Feature image is required.');
        editStep.value = 1;
        editMetaTab.value = isMobile.value ? 'metadata' : 'images';
        return;
      }
      saving.value = true;
      publishing.value = publish;
      saveSuccess.value = false;
      try {
        const html = getEditorHtml();
        const markdown = turndownService.turndown(html);
        const tags = editTags.value;
        const { attachments: _attachments, ...existingFm } = editingPost.value.fm || {};
        const fm = {
          ...POST_SKELETON_FM,
          ...existingFm,
          title: editTitle.value,
          description: editDescription.value,
          author: editAuthor.value,
          categories: editCategory.value ? [editCategory.value] : (existingFm.categories || []),
          tags,
          img_big_1000x600: editFeatureImage.value,
          img_big_3000x1144: editFeatureImage.value,
          img_500x500: editFeatureImage.value,
          editor: 'PBB Admin',
          read_time: computeReadTime(markdown),
        };
        if (publish && !fm.published_at) {
          fm.published_at = new Date().toISOString();
        }
        if (fm.published === null || fm.published === undefined) {
          fm.published = true;
        }
        const newFrontMatter = jsyaml.dump(fm, { lineWidth: -1 });
        const newContent = `---\n${newFrontMatter}---\n\n${markdown}`;
        
        const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent, slug_title: editSlugTitle.value || null, ...(publish ? { published: true } : {}) }),
        });
        if (!res.ok) {
          let detail = '';
          try {
            const body = await res.json();
            detail = body.error || body.message || (Array.isArray(body.errors) ? body.errors.join(', ') : '');
          } catch (_) { /* non-json response */ }
          const action = republish ? 'Failed to republish' : (publish ? 'Failed to publish' : 'Failed to save');
          throw new Error(`${action}${detail ? `: ${detail}` : ''}`);
        }
        if (publish) editingPost.value.published = true;
        editingPost.value.content = newContent;
        editingPost.value.fm = fm;
        rememberAuthor(editAuthor.value);
        saveSuccess.value = true;
        setTimeout(() => { saveSuccess.value = false; }, 3000);
        if (publish) {
          const message = `${republish ? 'Republished' : 'Published'}! The post will go live in the background.`;
          const postToPreview = editingPost.value;
          confirmToast(message, { mode: 'success-confirm', cancelLabel: 'Close', confirmLabel: 'Preview' })
            .then((preview) => { if (preview && postToPreview) viewPost(postToPreview); });
        } else {
          notifyToast('Post saved successfully!');
        }
        editSnapshot = {
          title: editTitle.value,
          description: editDescription.value,
          author: editAuthor.value,
          slugTitle: editSlugTitle.value,
          category: editCategory.value,
          tags: JSON.stringify(editTags.value),
          featureImage: editFeatureImage.value,
        };
        quillDirty = false;
        clearDraft(editingPost.value.id);
        await loadPosts(pagination.value.page);
      } catch (err) {
        errorToast(err.message);
      } finally {
        saving.value = false;
        publishing.value = false;
      }
    }

    function onMarkdownBlur() {
      const fmMatch = markdownOutput.value.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) return;
      try {
        const fm = jsyaml.load(fmMatch[1]);
        if (!fm || typeof fm !== 'object') return;
        if (fm.title !== undefined) editTitle.value = fm.title || '';
        if (fm.description !== undefined) editDescription.value = fm.description || '';
        if (fm.author !== undefined) editAuthor.value = fm.author || '';
        if (fm.categories !== undefined) editCategory.value = (Array.isArray(fm.categories) ? fm.categories[0] : fm.categories) || '';
        if (fm.tags !== undefined) {
          const tags = Array.isArray(fm.tags) ? fm.tags : String(fm.tags).split(',').map(t => t.trim()).filter(Boolean);
          editTags.value = tags;
          editTagsRaw.value = '';
        }
      } catch (e) { /* invalid yaml, skip */ }
    }

    function onTitleBlur() {
      const isUnpublished = editingPost.value && !editingPost.value.published;
      if (!editSlugTitle.value || isUnpublished) {
        editSlugTitle.value = slugify(editTitle.value);
      }
    }

    async function suggestDescription() {
      let text = '';
      if (quillEditor) text = quillEditor.getText();
      else if (tiptapEditor) text = tiptapEditor.getText();
      text = (text || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        errorToast('Body is empty.');
        return;
      }
      const ok = await confirmToast(
        'This will replace your current description with text from the article content. Continue?',
        { cancelLabel: 'Cancel', confirmLabel: 'Replace' }
      );
      if (!ok) return;
      const match = text.match(/^.*?[.!?](?=\s|$)/);
      editDescription.value = (match ? match[0] : text).trim();
      descriptionInvalid.value = false;
    }

    function stripImagesAndBlobs(markdown) {
      return (markdown || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/<img\b[^>]*>/gi, '')
        .replace(/\bblob:[^\s)"']+/gi, '')
        .replace(/\bdata:image\/[^\s)"']+/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    const autopopulating = ref(false);
    const AUTOPOPULATE_MIN_WORDS = 50;
    const canAutopopulate = computed(() => bodyWordCount.value >= AUTOPOPULATE_MIN_WORDS);
    async function autopopulate() {
      if (!editingPost.value || autopopulating.value) return;
      const cleanBody = stripImagesAndBlobs(turndownService.turndown(getEditorHtml()));
      if (!cleanBody) {
        errorToast('Write the body first before AI populating.');
        return;
      }
      const wordCount = countWords(cleanBody);
      if (wordCount < AUTOPOPULATE_MIN_WORDS) {
        errorToast(`Body is too short (${wordCount}/${AUTOPOPULATE_MIN_WORDS} words after stripping images). Finish writing before AI populating.`);
        return;
      }
      const filled = [
        editDescription.value.trim() && 'description',
        editCategory.value && 'category',
        editTags.value.length && 'tags',
      ].filter(Boolean);
      if (filled.length) {
        const ok = await confirmToast(
          `AI Generate Metadata will overwrite your existing ${filled.join(', ')}. Continue?`,
          { cancelLabel: 'Cancel', confirmLabel: 'Overwrite' }
        );
        if (!ok) return;
      }
      autopopulating.value = true;
      try {
        const res = await fetch(`${API_BASE}/api/v1/posts/${editingPost.value.id}/autopopulate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: cleanBody }),
        });
        if (!res.ok) {
          let detail = '';
          try {
            const body = await res.json();
            detail = body.error || body.message || (Array.isArray(body.errors) ? body.errors.join(', ') : '');
          } catch (_) { /* non-json */ }
          throw new Error(`AI populate failed${detail ? `: ${detail}` : ''}`);
        }
        const data = await res.json();
        const isPublished = !!(editingPost.value && editingPost.value.published);
        if (typeof data.title === 'string' && !editTitle.value.trim()) editTitle.value = data.title;
        if (typeof data.description === 'string') editDescription.value = data.description;
        if (typeof data.author === 'string') editAuthor.value = data.author;
        if (!isPublished) {
          const aiSlug = typeof data.slug_title === 'string' ? data.slug_title.trim() : '';
          if (aiSlug) editSlugTitle.value = aiSlug.slice(0, 50);
          else if (editTitle.value) editSlugTitle.value = slugify(editTitle.value).slice(0, 50);
        }
        if (Array.isArray(data.categories) && data.categories[0]) editCategory.value = data.categories[0];
        else if (typeof data.category === 'string') editCategory.value = data.category;
        if (Array.isArray(data.tags)) editTags.value = data.tags.map(t => String(t).trim()).filter(Boolean);
        titleInvalid.value = false;
        descriptionInvalid.value = false;
        authorInvalid.value = false;
        categoryInvalid.value = false;
        tagsInvalid.value = false;
        notifyToast('Fields populated by AI.');
      } catch (err) {
        errorToast(err.message);
      } finally {
        autopopulating.value = false;
      }
    }

    watch(editingPost, async (post) => {
      if (!post) return;
      await nextTick();

      // Load existing attachments from post detail
      try {
        const res = await fetch(`${API_BASE}/api/v1/posts/${post.id}`, {
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (res.ok) {
          const data = await res.json();
          uploadedImages.value = data.attachments || [];
        }
      } catch (e) { /* silently ignore */ }
      const body = (post.content ? post.content.replace(/^---[\s\S]*?---\n?/, '') : '');
      const html = marked.parse(body);
      editBodyHtml = html;
      Quill.register('modules/imageResize', ImageResize.default || ImageResize);
      quillEditor = new Quill('#quill-editor', {
        theme: 'snow',
        modules: {
          imageResize: { modules: ['Resize', 'DisplaySize'] },
          history: { delay: 500, maxStack: 100, userOnly: true },
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            [{ align: [] }],
            ['clean'],
            ['undo', 'redo'],
          ],
        },
      });
      quillEditor.root.innerHTML = html;
      bodyLength.value = turndownService.turndown(quillEditor.root.innerHTML).length;
      bodyWordCount.value = countWords(quillEditor.getText());
      quillEditor.on('text-change', () => {
        quillDirty = true;
        bodyLength.value = turndownService.turndown(quillEditor.root.innerHTML).length;
        bodyWordCount.value = countWords(quillEditor.getText());
        scheduleDraftSave();
      });

      // Undo / redo
      const toolbarEl = quillEditor.getModule('toolbar').container;
      const undoBtn = toolbarEl.querySelector('.ql-undo');
      const redoBtn = toolbarEl.querySelector('.ql-redo');
      undoBtn.innerHTML = '↩';
      redoBtn.innerHTML = '↪';
      undoBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(30);
        quillEditor.history.undo();
        quillEditor.focus();
      });
      redoBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(30);
        quillEditor.history.redo();
        quillEditor.focus();
      });

      // Override image toolbar button to show insert modal
      quillEditor.getModule('toolbar').addHandler('image', () => {
        imageInsertModal.url = '';
        imageInsertModal.visible = true;
      });

      // Paste image URL as <img> tag
      quillEditor.root.addEventListener('paste', (e) => {
        const text = e.clipboardData.getData('text/plain').trim();
        if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text)) {
          e.preventDefault();
          const range = quillEditor.getSelection(true) || { index: quillEditor.getLength() };
          quillEditor.insertEmbed(range.index, 'image', text);
          quillEditor.setSelection(range.index + 1);
        }
      });

      // Drop uploaded image URL into editor
      quillEditor.root.addEventListener('drop', (e) => {
        const url = e.dataTransfer.getData('text/plain');
        if (!url || e.dataTransfer.files.length) return;
        e.preventDefault();
        e.stopPropagation();
        const range = quillEditor.getSelection(true) || { index: quillEditor.getLength() };
        quillEditor.insertEmbed(range.index, 'image', url);
        quillEditor.setSelection(range.index + 1);
      });

      if (pendingDraft && pendingDraft.body) {
        quillEditor.root.innerHTML = pendingDraft.body;
      }
      pendingDraft = null;
      suppressDraftSave = false;
    });

    watch([editTitle, editDescription, editAuthor, editSlugTitle, editCategory, editFeatureImage], scheduleDraftSave);
    watch(editTags, scheduleDraftSave, { deep: true });

    const creatingPost = ref(false);

    async function createPost() {
      creatingPost.value = true;
      try {
        const skeleton = `---\n${jsyaml.dump(POST_SKELETON_FM, { lineWidth: -1 })}---\n\n`;
        const res = await fetch(`${API_BASE}/api/v1/posts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: skeleton, front_matter: POST_SKELETON_FM, organization_id: 1 }),
        });
        if (!res.ok) throw new Error('Failed to create post');
        const data = await res.json();
        await loadPosts(1);
        editPost(data);
      } catch (err) {
        errorToast(err.message);
      } finally {
        creatingPost.value = false;
      }
    }

    async function deletePost(post) {
      const confirmed = await confirmToast(`Delete "${post.fm.title}"?`, { cancelLabel: 'Cancel', confirmLabel: 'Delete' });
      if (!confirmed) return;
      try {
        const res = await fetch(`${API_BASE}/api/v1/posts/${post.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token()}` },
        });
        if (!res.ok) throw new Error('Failed to delete');
        await loadPosts(pagination.value.page);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }

    function logout() {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/index.html';
    }

    watch(currentPage, (page) => {
      if (page === 'archived-posts') loadArchivedPosts(archivedPagination.value.page || 1);
      else if (page === 'all-posts') loadPosts(pagination.value.page || 1);
    });

    onMounted(async () => {
      window.addEventListener('resize', onResize);
      window.addEventListener('popstate', onPopState);
      loadAuthorSuggestions();
      const valid = await validate();
      if (!valid) return;
      validating.value = false;
      await loadPosts();
      seedAuthorSuggestionsFromPosts(posts.value);
      await restoreFromUrl();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', onPopState);
      stopLiveCheckInterval();
    });

    return {
      validating, isMobile, sidebarOpen, currentPage, openGroups, toast, notifyToast, errorToast, categorySelect, categoryInvalid, titleInvalid, descriptionInvalid, authorInvalid, tagsInvalid,
      loadingPosts, posts, postsError, pagination,
      loadingArchivedPosts, archivedPosts, archivedPostsError, archivedPagination,
      archivedSearch, onArchivedSearch, goToArchivedPage, archivedPageNumbers, unarchivePost,
      toggleGroup, navigate, logout, goToPage, pageNumbers, viewPost, editPost, deletePost, createPost, creatingPost, actionSheet, openActionSheet,
      search, onSearch, previewPost, renderedContent, liveUrl, closePreview, liveStatus,
      editingPost, editTitle, editDescription, editAuthor, authorSuggestions, editFeatureImage,
      editFeatureImagePreview, editFeatureImageFile, onFeatureImageFile, clearFeatureImage, featureFileInput,
      featureImageDragOver, onImageDragStart, onFeatureImageDrop,
      imageInsertModal, insertImageByUrl, insertImageFromDevice,
      attachmentQueue, uploadedImages, copiedImageIndex, copiedImageBlobIndex, selectedImageBlobId, setFeatureImage, onAttachmentSelect, onAttachmentDrop, removeAttachment, retryAttachment, deleteUploadedImage, copyImageUrl, copyImageBlob, toCloudFrontUrl,
      editSlugTitle, editCategory, editTagsRaw, editTags, postCategories, onTitleBlur, onMarkdownBlur, suggestDescription, autopopulate, autopopulating, canAutopopulate,
      addTag, addTagOnEnter, removeTag, slugify,
      saving, publishing, saveSuccess, editStep, editMetaTab, closeEditor, savePost,
      activeEditor, markdownOutput, currentReadTime, bodyWordCount, switchToEditor, tiptapCmd, tiptapActive, tiptapInsertImage, tiptapSetLink,
    };
  }
}).mount('#app');
