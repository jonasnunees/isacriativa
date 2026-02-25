// Espera o HTML carregar completamente antes de executar o JavaScript
document.addEventListener("DOMContentLoaded", function () {

    // ===============================
    // CONFIGURAÇÕES INICIAIS
    // ===============================

    const POSTS_PER_BATCH = 10;
    let visibleCount = POSTS_PER_BATCH;
    let activeCategory = "todos";
    let searchTimeout;

    // ===============================
    // SELEÇÃO DOS ELEMENTOS DO HTML
    // ===============================

    const grid = document.querySelector(".posts-grid");
    const allCards = document.querySelectorAll(".post-card");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const searchInput = document.querySelector("#blog-search");
    const emptyState = document.querySelector("#posts-empty");

    // ===============================
    // FUNÇÃO PRINCIPAL DE FILTRO
    // ===============================

    function applyFilters() {

        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        let filteredCards = [];

        allCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category") || "";
            const cardTitle = card.querySelector(".post-card-title, .post-featured-title, h2")?.textContent.toLowerCase() || "";
            const cardDesc = card.querySelector(".post-featured-desc")?.textContent.toLowerCase() || "";

            const matchCategory = activeCategory === "todos" || cardCategory === activeCategory;
            const matchSearch = !query || cardTitle.includes(query) || cardDesc.includes(query);

            if (matchCategory && matchSearch) filteredCards.push(card);
        });

        // Esconde todos
        allCards.forEach(card => {
            card.style.display = "none";
            card.classList.remove("fade-in");
        });

        // Exibe somente os visíveis com animação
        filteredCards.slice(0, visibleCount).forEach((card, index) => {
            card.style.display = "";
            setTimeout(() => card.classList.add("fade-in"), index * 60);
        });

        if (emptyState) {
            emptyState.style.display = filteredCards.length === 0 ? "flex" : "none";
        }

        updateCounter(filteredCards.length);
        renderLoadMore(filteredCards.length);
    }

    // ===============================
    // CONTADOR
    // ===============================

    function updateCounter(totalFiltered) {
        let counter = document.querySelector(".blog-counter");
        if (!counter) {
            counter = document.createElement("p");
            counter.className = "blog-counter";
            counter.setAttribute("role", "status");
            counter.setAttribute("aria-live", "polite");
            grid.parentNode.insertBefore(counter, grid);
        }
        const showing = Math.min(visibleCount, totalFiltered);
        counter.textContent = `Mostrando ${showing} de ${totalFiltered} artigos`;
    }

    // ===============================
    // BOTÃO CARREGAR MAIS
    // ===============================

    function renderLoadMore(totalFiltered) {
        let btn = document.querySelector(".blog-load-more");
        if (!btn) {
            btn = document.createElement("button");
            btn.className = "blog-load-more";
            btn.setAttribute("aria-label", "Carregar mais artigos");
            grid.parentNode.appendChild(btn);
            btn.addEventListener("click", function () {
                visibleCount += POSTS_PER_BATCH;
                applyFilters();
            });
        }

        if (visibleCount >= totalFiltered) {
            btn.style.display = "none";
        } else {
            const remaining = Math.min(POSTS_PER_BATCH, totalFiltered - visibleCount);
            btn.innerHTML = `<i class="fa-solid fa-arrow-down" aria-hidden="true"></i> Carregar mais ${remaining} artigos`;
            btn.style.display = "block";
        }
    }

    // ===============================
    // BOTÃO VOLTAR AO TOPO
    // ===============================

    const backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.setAttribute("aria-label", "Voltar ao topo da página");
    backToTopBtn.title = "Voltar ao topo";
    backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
    document.body.appendChild(backToTopBtn);

    window.addEventListener("scroll", function () {
        backToTopBtn.classList.toggle("visible", window.scrollY > 400);
    }, { passive: true });

    backToTopBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ===============================
    // EVENTOS DE FILTRO
    // ===============================

    function setActiveCategory(category) {
        activeCategory = category;
        visibleCount = POSTS_PER_BATCH;

        filterButtons.forEach(btn => {
            const isActive = btn.getAttribute("data-category") === category;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        applyFilters();
    }

    filterButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            setActiveCategory(this.getAttribute("data-category"));
        });
    });

    document.querySelectorAll(".sidebar-cat-item, .tag").forEach(btn => {
        btn.addEventListener("click", function () {
            setActiveCategory(this.getAttribute("data-category"));
            document.getElementById("artigos")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    // ===============================
    // BUSCA COM DELAY
    // ===============================

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                visibleCount = POSTS_PER_BATCH;
                applyFilters();
            }, 250);
        });
    }

    // Inicializa
    applyFilters();
});