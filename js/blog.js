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

    // — Post em destaque —
    // Filtrado separadamente pois não faz parte do `.posts-grid`.
    // Sem este bloco, ele permanecia visível em qualquer categoria, dando a
    // falsa impressão de que o filtro não havia funcionado.
    if (postFeatured) {
        const category = postFeatured.getAttribute("data-category") || "";
        const title    = postFeatured.querySelector(".post-featured-title, h2")?.textContent.toLowerCase() || "";
        const desc     = postFeatured.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";

        const matchCategory = state.activeCategory === "todos" || category === state.activeCategory;
        const matchSearch   = !query || title.includes(query) || desc.includes(query);

        postFeatured.style.display = matchCategory && matchSearch ? "" : "none";
    }

    // — Cards do grid —
    const filteredCards = [];

    allCards.forEach(card => {
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

// ─── Inicialização ─────────────────────────────────────────────────────────────

/**
 * Ponto de entrada dos módulos do blog.
 * A ordem importa: initLoadMore cria o botão que renderLoadMore irá controlar.
 */
document.addEventListener("DOMContentLoaded", () => {
    initLoadMore();
    initBlogFilters();
    initSearch();

    // Aplica o estado inicial (categoria "todos", sem busca, sem scroll)
    applyFilters();
});