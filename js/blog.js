/**
 * blog.js
 * Controla todos os comportamentos interativos da página de blog.
 *
 * Módulos:
 *  1. initMobileMenu    — Menu hamburger (incorporado aqui; script.js não é carregado nesta página)
 *  2. initScrollReveal  — Animação de entrada via Intersection Observer (idem)
 *  3. initBlogFilters   — Filtragem de artigos por categoria (botões, sidebar e tags)
 *  4. initSearch        — Busca por texto com debounce
 *  5. initLoadMore      — Carregamento progressivo de artigos ("Carregar mais")
 *  6. initWhatsAppTracking — Rastreamento de cliques no WhatsApp via GTM
 */

(() => {

    // ─── Constantes ────────────────────────────────────────────────────────────

    const POSTS_PER_BATCH    = 10;
    const SEARCH_DEBOUNCE_MS = 250;
    const SCROLL_DELAY_MS    = 50;
    const REVEAL_THRESHOLD   = 0.15;

    const ARIA_LABELS = {
        menuOpen:   'Fechar menu de navegação',
        menuClosed: 'Abrir menu de navegação',
    };

    // ─── Estado compartilhado ──────────────────────────────────────────────────

    const state = {
        activeCategory: "todos",
        visibleCount:   POSTS_PER_BATCH,
    };

    // Snapshot do post-featured original (definido no HTML para Papelaria),
    // capturado antes de qualquer manipulação dinâmica do DOM.
    let featuredOriginal = null;

    // ─── Módulos compartilhados (antes em script.js) ───────────────────────────

    /**
     * 1. Menu Mobile (Hamburger)
     */
    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navList   = document.querySelector('.nav-list');
        if (!hamburger || !navList) return;

        const navLinks = document.querySelectorAll('.nav-link');

        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navList.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? ARIA_LABELS.menuOpen : ARIA_LABELS.menuClosed);
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navList.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.setAttribute('aria-label', ARIA_LABELS.menuClosed);
            });
        });
    }

    /**
     * 2. Scroll Reveal Animation (Intersection Observer)
     */
    function initScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: REVEAL_THRESHOLD });

        reveals.forEach(el => observer.observe(el));
    }

    /**
     * 6. Rastreamento de Cliques no WhatsApp via GTM
     */
    function initWhatsAppTracking() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        if (!whatsappLinks.length) return;

        window.dataLayer = window.dataLayer || [];

        whatsappLinks.forEach(link => {
            link.addEventListener('click', function () {
                const label    = this.getAttribute('aria-label') || 'WhatsApp';
                const location = this.classList.contains('whatsapp-float')
                    ? 'botao_flutuante'
                    : 'botao_pagina';

                window.dataLayer.push({
                    event:          'whatsapp_click',
                    event_category: 'Contato',
                    event_label:    label,
                    event_location: location,
                });
            });
        });
    }

    // ─── Módulos do blog ───────────────────────────────────────────────────────

    /**
     * 3. initBlogFilters — Filtragem de artigos por categoria
     *
     * Trata cliques em três grupos: botões de filtro horizontais (.filter-btn),
     * categorias da sidebar (.sidebar-cat-item) e tags (.tag).
     */
    function initBlogFilters() {
        const filterBtns  = document.querySelectorAll(".filter-btn");
        const sidebarCats = document.querySelectorAll(".sidebar-cat-item");
        const tags        = document.querySelectorAll(".tag");

        if (!filterBtns.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener("click", function () {
                setActiveCategory(this.getAttribute("data-category"), { scroll: true });
            });
        });

        [...sidebarCats, ...tags].forEach(btn => {
            btn.addEventListener("click", function () {
                setActiveCategory(this.getAttribute("data-category"), { scroll: true });
            });
        });
    }

    /**
     * 4. initSearch — Busca por texto com debounce
     */
    function initSearch() {
        const searchInput = document.querySelector("#blog-search");
        if (!searchInput) return;

        let searchTimeout;

        searchInput.addEventListener("input", function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.visibleCount = POSTS_PER_BATCH;
                applyFilters();
            }, SEARCH_DEBOUNCE_MS);
        });
    }

    /**
     * 5. initLoadMore — Carregamento progressivo ("Carregar mais")
     *
     * Cria o botão dinamicamente e o insere após o grid.
     */
    function initLoadMore() {
        const grid = document.querySelector(".posts-grid");
        if (!grid || document.querySelector(".blog-load-more")) return;

        const btn = document.createElement("button");
        btn.className = "blog-load-more";
        btn.setAttribute("aria-label", "Carregar mais artigos");
        grid.parentNode.appendChild(btn);

        btn.addEventListener("click", () => {
            state.visibleCount += POSTS_PER_BATCH;
            applyFilters();
        });
    }

    // ─── Lógica de filtragem central ───────────────────────────────────────────

    /**
     * Atualiza a categoria ativa, sincroniza o estado visual dos botões
     * e reaplica os filtros.
     */
    function setActiveCategory(category, { scroll = false } = {}) {
        state.activeCategory = category;
        state.visibleCount   = POSTS_PER_BATCH;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            const isActive = btn.getAttribute("data-category") === category;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
        });

        applyFilters({ scroll });
    }

    /**
     * Aplica filtro de categoria + busca em todos os posts da página.
     */
    function applyFilters({ scroll = false } = {}) {
        const searchInput  = document.querySelector("#blog-search");
        const allCards     = document.querySelectorAll(".post-card");
        const postFeatured = document.querySelector(".post-featured");
        const emptyState   = document.querySelector("#posts-empty");
        const filtersEl    = document.querySelector(".blog-filters");

        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

        allCards.forEach(card => card.removeAttribute("data-is-featured"));

        // — Post em destaque —
        if (postFeatured) {
            const isTodos     = state.activeCategory === "todos";
            const isPapelaria = state.activeCategory === "papelaria";

            if (isTodos) {
                const descEl = postFeatured.querySelector(".post-featured-desc");
                if (descEl) descEl.style.display = "";
                postFeatured.style.display = "none";
            } else if (isPapelaria) {
                if (featuredOriginal) {
                    postFeatured.setAttribute("href", featuredOriginal.href);
                    postFeatured.setAttribute("aria-label", featuredOriginal.ariaLabel);
                    const imgEl = postFeatured.querySelector(".post-featured-img");
                    if (imgEl) { imgEl.textContent = featuredOriginal.emoji; imgEl.setAttribute("style", featuredOriginal.thumbBg); }
                    const badge = postFeatured.querySelector(".post-category-badge");
                    if (badge) badge.textContent = featuredOriginal.badge;
                    const titleEl = postFeatured.querySelector(".post-featured-title");
                    if (titleEl) titleEl.textContent = featuredOriginal.title;
                    const descEl = postFeatured.querySelector(".post-featured-desc");
                    if (descEl) { descEl.innerHTML = featuredOriginal.desc; descEl.style.display = ""; }
                    const metaEl = postFeatured.querySelector(".post-featured-meta");
                    if (metaEl) metaEl.innerHTML = featuredOriginal.metaHTML;
                }
                const title = postFeatured.querySelector(".post-featured-title")?.textContent.toLowerCase() || "";
                const desc  = postFeatured.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";
                postFeatured.style.display = (!query || title.includes(query) || desc.includes(query)) ? "" : "none";
            } else {
                // Popula o destaque com o primeiro card da categoria ativa
                const firstMatch = Array.from(allCards).find(card => {
                    const cat         = card.getAttribute("data-category") || "";
                    const title       = card.querySelector(".post-card-title, h2")?.textContent.toLowerCase() || "";
                    const matchCat    = cat === state.activeCategory;
                    const matchSearch = !query || title.includes(query);
                    return matchCat && matchSearch;
                });

                if (firstMatch) {
                    const href      = firstMatch.getAttribute("href") || "#";
                    const ariaLabel = firstMatch.getAttribute("aria-label") || "";
                    const thumbEl   = firstMatch.querySelector(".post-card-thumb");
                    const emoji     = thumbEl ? thumbEl.textContent.trim() : "";
                    const thumbBg   = thumbEl ? thumbEl.getAttribute("style") || "" : "";
                    const catLabel  = firstMatch.querySelector(".post-card-category")?.textContent || "";
                    const titleText = firstMatch.querySelector(".post-card-title, h2")?.textContent || "";
                    const metaItems = firstMatch.querySelectorAll(".post-card-meta [role='listitem']");
                    const metaHTML  = Array.from(metaItems).map(m => `<span role="listitem">${m.innerHTML}</span>`).join("");

                    postFeatured.setAttribute("href", href);
                    postFeatured.setAttribute("aria-label", ariaLabel.replace("Leia:", "Leia o artigo:"));
                    postFeatured.setAttribute("data-category", state.activeCategory);

                    const imgEl = postFeatured.querySelector(".post-featured-img");
                    if (imgEl) { imgEl.textContent = emoji; imgEl.setAttribute("style", thumbBg); }

                    const badge = postFeatured.querySelector(".post-category-badge");
                    if (badge) badge.textContent = catLabel;

                    const titleEl = postFeatured.querySelector(".post-featured-title");
                    if (titleEl) titleEl.textContent = titleText;

                    const descEl = postFeatured.querySelector(".post-featured-desc");
                    if (descEl) descEl.style.display = "none";

                    const metaEl = postFeatured.querySelector(".post-featured-meta");
                    if (metaEl) metaEl.innerHTML = metaHTML;

                    const matchSearch = !query || titleText.toLowerCase().includes(query);
                    postFeatured.style.display = matchSearch ? "" : "none";

                    firstMatch.setAttribute("data-is-featured", "true");
                } else {
                    postFeatured.style.display = "none";
                }
            }
        }

        // — Cards do grid —
        const filteredCards = [];

        allCards.forEach(card => {
            if (card.getAttribute("data-is-featured") === "true") return;

            const category = card.getAttribute("data-category") || "";
            const title    = card.querySelector(".post-card-title, h2")?.textContent.toLowerCase() || "";
            const desc     = card.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";

            const matchCategory = state.activeCategory === "todos" || category === state.activeCategory;
            const matchSearch   = !query || title.includes(query) || desc.includes(query);

            if (matchCategory && matchSearch) filteredCards.push(card);
        });

        allCards.forEach(card => {
            card.style.display = "none";
            card.classList.remove("fade-in");
        });

        filteredCards.slice(0, state.visibleCount).forEach((card, i) => {
            card.style.display = "";
            setTimeout(() => card.classList.add("fade-in"), i * 60);
        });

        if (emptyState) {
            emptyState.style.display = filteredCards.length === 0 ? "flex" : "none";
        }

        updateCounter(filteredCards.length);
        renderLoadMore(filteredCards.length);

        if (scroll && filtersEl) {
            setTimeout(() => {
                filtersEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }, SCROLL_DELAY_MS);
        }
    }

    // ─── Funções auxiliares ────────────────────────────────────────────────────

    function updateCounter(totalFiltered) {
        const grid = document.querySelector(".posts-grid");
        if (!grid) return;

        let counter = document.querySelector(".blog-counter");

        if (!counter) {
            counter = document.createElement("p");
            counter.className = "blog-counter";
            counter.setAttribute("role", "status");
            counter.setAttribute("aria-live", "polite");
            grid.parentNode.insertBefore(counter, grid);
        }

        const showing = Math.min(state.visibleCount, totalFiltered);
        counter.textContent = `Mostrando ${showing} de ${totalFiltered} artigos`;
    }

    function renderLoadMore(totalFiltered) {
        const btn = document.querySelector(".blog-load-more");
        if (!btn) return;

        const hasMore = state.visibleCount < totalFiltered;
        btn.style.display = hasMore ? "block" : "none";

        if (hasMore) {
            const remaining = Math.min(POSTS_PER_BATCH, totalFiltered - state.visibleCount);
            btn.innerHTML = `<i class="fa-solid fa-arrow-down" aria-hidden="true"></i> Carregar mais ${remaining} artigos`;
        }
    }

    // ─── Ponto de entrada ──────────────────────────────────────────────────────

    document.addEventListener("DOMContentLoaded", () => {
        // Captura o estado original do destaque antes de qualquer manipulação
        const pf = document.querySelector(".post-featured");
        if (pf) {
            const metaItems = pf.querySelectorAll(".post-featured-meta [role='listitem']");
            featuredOriginal = {
                href:      pf.getAttribute("href"),
                ariaLabel: pf.getAttribute("aria-label"),
                emoji:     pf.querySelector(".post-featured-img")?.textContent.trim() || "",
                thumbBg:   pf.querySelector(".post-featured-img")?.getAttribute("style") || "",
                badge:     pf.querySelector(".post-category-badge")?.textContent || "",
                title:     pf.querySelector(".post-featured-title")?.textContent || "",
                desc:      pf.querySelector(".post-featured-desc")?.innerHTML || "",
                metaHTML:  Array.from(metaItems).map(m => `<span role="listitem">${m.innerHTML}</span>`).join(""),
            };
        }

        initMobileMenu();
        initScrollReveal();
        initWhatsAppTracking();
        initLoadMore();
        initBlogFilters();
        initSearch();

        applyFilters();
    });

})();