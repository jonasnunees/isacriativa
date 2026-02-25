document.addEventListener('DOMContentLoaded', () => {

        const searchInput   = document.getElementById('blog-search');
        const filterBtns    = document.querySelectorAll('.filter-btn, .sidebar-cat-item, .tag');
        const grid          = document.getElementById('posts-grid');
        const resultsInfo   = document.getElementById('results-info');
        const emptyState    = document.getElementById('posts-empty');
        const featuredPost  = document.querySelector('.post-featured');

        // Todos os cards (featured + grid)
        const allCards = [featuredPost, ...document.querySelectorAll('.post-card')];

        // ── Utilitário: atualiza info de resultados ──
        function updateResultsInfo(visible, query, category) {
            let text = '';
            if (query && category !== 'todos') {
                text = `<strong>${visible} artigos</strong> encontrados para "<strong>${query}</strong>" em <strong>${getCategoryLabel(category)}</strong>`;
            } else if (query) {
                text = `<strong>${visible} artigos</strong> encontrados para "<strong>${query}</strong>"`;
            } else if (category !== 'todos') {
                text = `Mostrando <strong>${visible} artigos</strong> em <strong>${getCategoryLabel(category)}</strong>`;
            } else {
                text = `Mostrando <strong>${visible} artigos</strong>`;
            }
            resultsInfo.innerHTML = text;
        }

        function getCategoryLabel(cat) {
            const labels = {
                papelaria: 'Papelaria',
                temas: 'Temas de Festa',
                decoracao: 'Decoração',
                dicas: 'Dicas Práticas',
                local: 'São Pedro da Aldeia',
                guias: 'Guias Completos',
            };
            return labels[cat] || cat;
        }

        // ── Filtro principal ──
        let activeCategory = 'todos';

        function applyFilters() {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            allCards.forEach(card => {
                if (!card) return;
                const cardCat   = card.getAttribute('data-category') || '';
                const cardTitle = (card.querySelector('h2') || card.querySelector('.post-featured-title') || {}).textContent?.toLowerCase() || '';
                const cardDesc  = (card.querySelector('.post-featured-desc') || {}).textContent?.toLowerCase() || '';

                const matchCat   = activeCategory === 'todos' || cardCat === activeCategory;
                const matchQuery = !query || cardTitle.includes(query) || cardDesc.includes(query);

                const show = matchCat && matchQuery;

                if (card.classList.contains('post-featured')) {
                    card.style.display = show ? '' : 'none';
                } else {
                    card.setAttribute('aria-hidden', show ? 'false' : 'true');
                }

                if (show) visibleCount++;
            });

            emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
            updateResultsInfo(visibleCount, searchInput.value.trim(), activeCategory);
        }

        // ── Clique nos filtros (topo + sidebar + tags) ──
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                activeCategory = cat;

                // Atualiza aria-pressed nos filtros do topo
                document.querySelectorAll('.filter-btn').forEach(b => {
                    const isActive = b.getAttribute('data-category') === cat;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });

                applyFilters();

                // Scroll suave até o grid em mobile
                if (window.innerWidth < 960) {
                    document.getElementById('blog-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // ── Busca com debounce ──
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 250);
        });

        // ── Limpa busca com Escape ──
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applyFilters();
            }
        });

        // ── Scroll Reveal (para cards que entram na tela) ──
        const reveals = document.querySelectorAll('.reveal');
        if (reveals.length) {
            const revealObs = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08 });
            reveals.forEach(el => revealObs.observe(el));
        }

        // ── Rastreamento WhatsApp via GTM ──
        window.dataLayer = window.dataLayer || [];
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
            link.addEventListener('click', function () {
                window.dataLayer.push({
                    event          : 'whatsapp_click',
                    event_category : 'Contato',
                    event_label    : this.getAttribute('aria-label') || 'WhatsApp',
                    event_location : this.classList.contains('whatsapp-float') ? 'botao_flutuante' : 'blog_sidebar',
                });
            });
        });

    });