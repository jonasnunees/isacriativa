/**
 * blog.js
 * Controla os comportamentos interativos exclusivos da página de blog.
 *
 * Módulos:
 *  1. initBlogFilters   — Filtragem de artigos por categoria (botões, sidebar e tags)
 *  2. initSearch        — Busca por texto com debounce
 *  3. initLoadMore      — Carregamento progressivo de artigos ("Carregar mais")
 *
 * Depende de: script.js (carregado antes no HTML)
 */

// ─── Constantes ────────────────────────────────────────────────────────────────

// Quantidade de posts exibidos por vez ao carregar mais
const POSTS_PER_BATCH = 10;

// Delay em ms antes de aplicar a busca por texto (evita atualizações a cada tecla)
const SEARCH_DEBOUNCE_MS = 250;

// Delay em ms antes de rolar a página após filtrar (aguarda o DOM atualizar)
const SCROLL_DELAY_MS = 50;

// ─── Estado compartilhado entre os módulos ─────────────────────────────────────

// Estado centralizado acessível por todos os módulos deste arquivo.
// Usar um objeto evita variáveis soltas no escopo e torna as dependências explícitas.
const state = {
    activeCategory: "todos",
    visibleCount: POSTS_PER_BATCH,
};

// ─── Módulos ───────────────────────────────────────────────────────────────────

/**
 * 1. initBlogFilters — Filtragem de artigos por categoria
 *
 * Trata cliques em três grupos de elementos que acionam a mesma lógica:
 *  - Botões de filtro horizontais (.filter-btn) — acima da listagem
 *  - Categorias da sidebar (.sidebar-cat-item)
 *  - Tags de assuntos populares (.tag)
 *
 * O post em destaque (.post-featured) também é filtrado, corrigindo o bug
 * onde ele permanecia visível independentemente da categoria selecionada.
 *
 * Ao filtrar, a página rola suavemente até os resultados para que o usuário
 * perceba a mudança sem precisar rolar manualmente.
 */
function initBlogFilters() {
    const filterBtns  = document.querySelectorAll(".filter-btn");
    const sidebarCats = document.querySelectorAll(".sidebar-cat-item");
    const tags        = document.querySelectorAll(".tag");

    // Guard: sai sem erros em páginas sem sistema de filtros
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            setActiveCategory(this.getAttribute("data-category"), { scroll: true });
        });
    });

    // Sidebar e tags acionam o mesmo filtro e também rolam até a listagem
    [...sidebarCats, ...tags].forEach(btn => {
        btn.addEventListener("click", function () {
            setActiveCategory(this.getAttribute("data-category"), { scroll: true });
        });
    });
}

/**
 * 2. initSearch — Busca por texto com debounce
 *
 * Aguarda o usuário parar de digitar por SEARCH_DEBOUNCE_MS antes de aplicar
 * o filtro, evitando atualizações visuais excessivas a cada tecla pressionada.
 * A busca funciona em conjunto com o filtro de categoria ativo.
 */
function initSearch() {
    const searchInput = document.querySelector("#blog-search");
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // Reinicia a paginação ao buscar para não cortar resultados visíveis
            state.visibleCount = POSTS_PER_BATCH;
            applyFilters();
        }, SEARCH_DEBOUNCE_MS);
    });
}

/**
 * 3. initLoadMore — Carregamento progressivo ("Carregar mais")
 *
 * Cria o botão dinamicamente e o insere após o grid, pois ele não existe no HTML.
 * Ao clicar, incrementa o número de posts visíveis e reaplica os filtros ativos,
 * garantindo que apenas os posts da categoria/busca atual apareçam.
 *
 * O botão é controlado por renderLoadMore(), que decide se ele deve estar
 * visível ou oculto com base na quantidade de resultados filtrados.
 */
function initLoadMore() {
    const grid = document.querySelector(".posts-grid");
    if (!grid) return;

    // Evita duplicação caso a função seja chamada mais de uma vez
    if (document.querySelector(".blog-load-more")) return;

    const btn = document.createElement("button");
    btn.className = "blog-load-more";
    btn.setAttribute("aria-label", "Carregar mais artigos");
    grid.parentNode.appendChild(btn);

    btn.addEventListener("click", () => {
        state.visibleCount += POSTS_PER_BATCH;
        // Não rola ao carregar mais — o usuário já está na posição correta
        applyFilters();
    });
}

// ─── Lógica de filtragem central ───────────────────────────────────────────────

/**
 * Atualiza a categoria ativa, sincroniza o estado visual dos botões
 * e reaplica os filtros.
 *
 * @param {string} category           - Valor do data-category a ativar
 * @param {{ scroll: boolean }} options
 */
function setActiveCategory(category, { scroll = false } = {}) {
    state.activeCategory = category;
    state.visibleCount   = POSTS_PER_BATCH;

    // Sincroniza active + aria-pressed em todos os botões de filtro do topo
    document.querySelectorAll(".filter-btn").forEach(btn => {
        const isActive = btn.getAttribute("data-category") === category;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });

    applyFilters({ scroll });
}

/**
 * Aplica o filtro de categoria + busca por texto em todos os posts da página
 * (post destaque + cards do grid) e atualiza contador e botão "Carregar mais".
 *
 * @param {{ scroll: boolean }} options
 */
function applyFilters({ scroll = false } = {}) {
    const searchInput  = document.querySelector("#blog-search");
    const allCards     = document.querySelectorAll(".post-card");
    const postFeatured = document.querySelector(".post-featured");
    const emptyState   = document.querySelector("#posts-empty");
    const filtersEl    = document.querySelector(".blog-filters");

    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    // Limpa marcações de "featured" de rodadas anteriores (antes de qualquer lógica)
    allCards.forEach(card => card.removeAttribute("data-is-featured"));

    // — Post em destaque —
    // Em "todos": oculto (comportamento original).
    // Em "papelaria": exibe o destaque original definido no HTML, sem modificações.
    // Em outras categorias: popula dinamicamente com o primeiro card da categoria.
    if (postFeatured) {
        const isTodos     = state.activeCategory === "todos";
        const isPapelaria = state.activeCategory === "papelaria";

        if (isTodos) {
            // Garante que a descrição esteja visível caso tenha sido ocultada antes
            const descEl = postFeatured.querySelector(".post-featured-desc");
            if (descEl) descEl.style.display = "";
            postFeatured.style.display = "none";
        } else if (isPapelaria) {
            // Restaura os dados originais do destaque (podem ter sido sobrescritos por outra categoria)
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
            const title  = postFeatured.querySelector(".post-featured-title")?.textContent.toLowerCase() || "";
            const desc   = postFeatured.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";
            const matchSearch = !query || title.includes(query) || desc.includes(query);
            postFeatured.style.display = matchSearch ? "" : "none";
        } else {
            // Encontra o primeiro card da categoria ativa que bate com a busca
            const firstMatch = Array.from(allCards).find(card => {
                const cat   = card.getAttribute("data-category") || "";
                const title = card.querySelector(".post-card-title, h2")?.textContent.toLowerCase() || "";
                const matchCat    = cat === state.activeCategory;
                const matchSearch = !query || title.includes(query);
                return matchCat && matchSearch;
            });

            if (firstMatch) {
                // Extrai dados do card para preencher o destaque
                const href      = firstMatch.getAttribute("href") || "#";
                const ariaLabel = firstMatch.getAttribute("aria-label") || "";
                const thumbEl   = firstMatch.querySelector(".post-card-thumb");
                const emoji     = thumbEl ? thumbEl.textContent.trim() : "";
                const thumbBg   = thumbEl ? thumbEl.getAttribute("style") || "" : "";
                const catLabel  = firstMatch.querySelector(".post-card-category")?.textContent || "";
                const titleText = firstMatch.querySelector(".post-card-title, h2")?.textContent || "";
                const metaItems = firstMatch.querySelectorAll(".post-card-meta [role='listitem']");
                const metaHTML  = Array.from(metaItems).map(m => `<span role="listitem">${m.innerHTML}</span>`).join("");

                // Atualiza atributos do link de destaque
                postFeatured.setAttribute("href", href);
                postFeatured.setAttribute("aria-label", ariaLabel.replace("Leia:", "Leia o artigo:"));
                postFeatured.setAttribute("data-category", state.activeCategory);

                // Atualiza imagem/emoji e background
                const imgEl = postFeatured.querySelector(".post-featured-img");
                if (imgEl) {
                    imgEl.textContent = emoji;
                    imgEl.setAttribute("style", thumbBg);
                }

                // Atualiza badge de categoria
                const badge = postFeatured.querySelector(".post-category-badge");
                if (badge) badge.textContent = catLabel;

                // Atualiza título
                const titleEl = postFeatured.querySelector(".post-featured-title");
                if (titleEl) titleEl.textContent = titleText;

                // Oculta a descrição (cards não têm desc), ou limpa
                const descEl = postFeatured.querySelector(".post-featured-desc");
                if (descEl) descEl.style.display = "none";

                // Atualiza meta (data/tempo)
                const metaEl = postFeatured.querySelector(".post-featured-meta");
                if (metaEl) metaEl.innerHTML = metaHTML;

                // Verifica se o título bate com a busca para ocultar se necessário
                const titleLower = titleText.toLowerCase();
                const matchSearch = !query || titleLower.includes(query);
                postFeatured.style.display = matchSearch ? "" : "none";

                // Marca o card fonte como "featured" para ocultá-lo no grid
                firstMatch.setAttribute("data-is-featured", "true");
            } else {
                postFeatured.style.display = "none";
            }
        }
    }

    // — Cards do grid —
    const filteredCards = [];

    allCards.forEach(card => {
        // Não inclui no grid o card que foi promovido a destaque
        if (card.getAttribute("data-is-featured") === "true") return;

        const category = card.getAttribute("data-category") || "";
        const title    = card.querySelector(".post-card-title, h2")?.textContent.toLowerCase() || "";
        const desc     = card.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";

        const matchCategory = state.activeCategory === "todos" || category === state.activeCategory;
        const matchSearch   = !query || title.includes(query) || desc.includes(query);

        if (matchCategory && matchSearch) filteredCards.push(card);
    });

    // Oculta todos antes de exibir apenas os filtrados
    allCards.forEach(card => {
        card.style.display = "none";
        card.classList.remove("fade-in");
    });

    // Exibe os posts do lote atual com animação escalonada.
    // O delay por índice cria uma entrada em cascata sem depender de CSS puro,
    // necessário pois os elementos são inseridos/removidos do DOM dinamicamente.
    filteredCards.slice(0, state.visibleCount).forEach((card, i) => {
        card.style.display = "";
        setTimeout(() => card.classList.add("fade-in"), i * 60);
    });

    if (emptyState) {
        emptyState.style.display = filteredCards.length === 0 ? "flex" : "none";
    }

    updateCounter(filteredCards.length);
    renderLoadMore(filteredCards.length);

    // Rola até os filtros para que o usuário veja os resultados imediatamente.
    // O delay aguarda o DOM terminar de atualizar antes de calcular a posição de scroll.
    if (scroll && filtersEl) {
        setTimeout(() => {
            filtersEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, SCROLL_DELAY_MS);
    }
}

// ─── Funções auxiliares ────────────────────────────────────────────────────────

/**
 * Atualiza (ou cria) o parágrafo de contagem de resultados.
 * Criado dinamicamente para não exigir alteração no HTML.
 *
 * @param {number} totalFiltered - Total de posts que passaram pelo filtro
 */
function updateCounter(totalFiltered) {
    const grid = document.querySelector(".posts-grid");
    if (!grid) return;

    let counter = document.querySelector(".blog-counter");

    if (!counter) {
        counter = document.createElement("p");
        counter.className = "blog-counter";
        // aria-live="polite" notifica leitores de tela sobre mudanças no contador
        // sem interromper o que estiver sendo lido no momento
        counter.setAttribute("role", "status");
        counter.setAttribute("aria-live", "polite");
        grid.parentNode.insertBefore(counter, grid);
    }

    const showing = Math.min(state.visibleCount, totalFiltered);
    counter.textContent = `Mostrando ${showing} de ${totalFiltered} artigos`;
}

/**
 * Controla a visibilidade e o texto do botão "Carregar mais".
 * O botão em si é criado por initLoadMore(); aqui apenas gerenciamos seu estado.
 *
 * @param {number} totalFiltered - Total de posts que passaram pelo filtro
 */
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

// ─── Snapshot do destaque original ────────────────────────────────────────────

// Armazena os dados originais do post-featured (definido no HTML para Papelaria)
// para restaurá-los ao voltar para essa categoria após outra ter sobrescrito o DOM.
let featuredOriginal = null;

// ─── Inicialização ─────────────────────────────────────────────────────────────

/**
 * Ponto de entrada dos módulos do blog.
 * A ordem importa: initLoadMore cria o botão que renderLoadMore irá controlar.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Captura o estado original do destaque antes de qualquer manipulação dinâmica
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

    initLoadMore();
    initBlogFilters();
    initSearch();

    // Aplica o estado inicial (categoria "todos", sem busca, sem scroll)
    applyFilters();
});